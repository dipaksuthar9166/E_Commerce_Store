const axios = require('axios');
const { uploadBufferToS3 } = require('../services/uploadService');
const {
  isCloudinaryConfigured,
  uploadImageToCloudinary,
  uploadBase64ToCloudinary,
} = require('../services/cloudinaryService');

/**
 * Normalize any Mongo / multer image payload into a Node Buffer.
 */
function toImageBuffer(data) {
  if (!data) return null;
  if (Buffer.isBuffer(data) && data.length > 0) return data;
  // lean() / JSON: { type: 'Buffer', data: number[] }
  if (data.type === 'Buffer' && Array.isArray(data.data) && data.data.length > 0) {
    return Buffer.from(data.data);
  }
  // BSON Binary
  if (data.buffer) {
    const buf = Buffer.isBuffer(data.buffer) ? data.buffer : Buffer.from(data.buffer);
    return buf.length > 0 ? buf : null;
  }
  // Uint8Array / ArrayBuffer views
  if (typeof data.length === 'number' && data.length > 0 && data.byteLength !== undefined) {
    return Buffer.from(data);
  }
  return null;
}

/**
 * True when product has at least one binary image in MongoDB.
 */
function hasBinaryImages(product) {
  const images = product?.images;
  if (!Array.isArray(images) || images.length === 0) return false;
  return images.some((img) => {
    if (!img) return false;
    if (typeof img === 'string' && img.trim()) return true;
    return Boolean(toImageBuffer(img.data));
  });
}

function isHttpUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value.trim());
}

/**
 * Count displayable images (binary slots + optional external URL as 1).
 */
function countProductImages(product) {
  const images = product?.images;
  let binaryCount = 0;
  if (Array.isArray(images)) {
    for (const img of images) {
      if (!img) continue;
      if (typeof img === 'string' && img.trim()) {
        binaryCount += 1;
        continue;
      }
      if (toImageBuffer(img.data)) binaryCount += 1;
    }
  }
  if (binaryCount > 0) return binaryCount;
  if (isHttpUrl(product?.imagePath)) return 1;
  // Legacy: string URLs inside images[]
  if (Array.isArray(images) && typeof images[0] === 'string' && isHttpUrl(images[0])) {
    return images.filter((u) => typeof u === 'string' && u.trim()).length;
  }
  return 0;
}

/**
 * Strip heavy binary image payloads from API JSON.
 * Frontend loads images via GET /api/products/:id/image (or imagePath URL).
 */
function formatProductForClient(product, extras = {}) {
  if (!product) return product;
  const obj = typeof product.toObject === 'function' ? product.toObject() : { ...product };

  const imageCount = countProductImages(obj);
  const urlFromImages =
    Array.isArray(obj.images) && typeof obj.images[0] === 'string' ? obj.images[0] : '';
  const imagePath = (isHttpUrl(obj.imagePath) && obj.imagePath.trim()) || (isHttpUrl(urlFromImages) ? urlFromImages : '') || '';

  delete obj.images;

  const hasImage = Boolean(imagePath || imageCount > 0);

  return {
    ...obj,
    ...extras,
    hasImage,
    imageCount: imageCount || (imagePath ? 1 : 0),
    // Keep absolute URLs only; binary images use /products/:id/image on the client
    imagePath: imagePath || undefined,
  };
}

/**
 * Try Cloudinary → S3 → null. Returns permanent public URL or null.
 */
async function uploadBufferToCloud(buffer, originalName, mimetype) {
  if (!buffer || !buffer.length) return null;

  // Cloudinary (preferred when configured)
  if (isCloudinaryConfigured()) {
    try {
      const b64 = buffer.toString('base64');
      const dataUri = `data:${mimetype || 'image/jpeg'};base64,${b64}`;
      const url = await uploadImageToCloudinary(dataUri);
      if (url) return url;
    } catch (err) {
      console.warn('[upload] Cloudinary failed:', err.message);
    }
    // Also try raw base64 helper
    try {
      const url = await uploadBase64ToCloudinary(buffer.toString('base64'));
      if (url) return url;
    } catch {
      /* ignore */
    }
  }

  // S3 fallback
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    try {
      const url = await uploadBufferToS3(
        buffer,
        originalName || `product_${Date.now()}.jpg`,
        mimetype || 'image/jpeg'
      );
      if (url) return url;
    } catch (err) {
      console.warn('[upload] S3 failed:', err.message);
    }
  }

  return null;
}

/**
 * Build image docs from multer file(s). Also tries cloud hosting.
 * @returns {{ images: Array, imagePath: string|undefined }}
 */
async function buildImagesFromFiles(files = []) {
  const list = Array.isArray(files) ? files.filter(Boolean) : [];
  const images = [];
  let imagePath;

  for (const file of list) {
    if (!file?.buffer?.length) continue;
    const contentType = file.mimetype || 'image/jpeg';
    images.push({ data: file.buffer, contentType });

    if (!imagePath) {
      const cloudUrl = await uploadBufferToCloud(file.buffer, file.originalname, contentType);
      if (cloudUrl) imagePath = cloudUrl;
    }
  }

  return { images, imagePath };
}

/**
 * Download a remote product image (barcode lookup, etc.) into a buffer.
 */
async function downloadRemoteImage(url) {
  if (!isHttpUrl(url)) return null;
  try {
    const res = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 20000,
      maxContentLength: 8 * 1024 * 1024,
      headers: {
        'User-Agent': 'MerskoECommerce/1.0 (product-image)',
        Accept: 'image/*,*/*',
      },
      validateStatus: (s) => s >= 200 && s < 400,
    });
    const contentType = String(res.headers['content-type'] || 'image/jpeg').split(';')[0].trim();
    if (!contentType.startsWith('image/') && contentType !== 'application/octet-stream') {
      return null;
    }
    return {
      data: Buffer.from(res.data),
      contentType: contentType.startsWith('image/') ? contentType : 'image/jpeg',
    };
  } catch (err) {
    console.warn('[upload] remote image download failed:', err.message);
    return null;
  }
}

/**
 * Resolve product images from uploaded files and/or remote imagePath URL.
 */
async function resolveProductImages({ files = [], imagePathUrl } = {}) {
  const fromFiles = await buildImagesFromFiles(files);
  if (fromFiles.images.length > 0) {
    return {
      images: fromFiles.images,
      imagePath: fromFiles.imagePath || undefined,
    };
  }

  if (isHttpUrl(imagePathUrl)) {
    // Prefer permanent cloud copy of remote URL
    if (isCloudinaryConfigured()) {
      const cloudUrl = await uploadImageToCloudinary(imagePathUrl);
      if (cloudUrl) {
        return { images: [], imagePath: cloudUrl };
      }
    }

    const downloaded = await downloadRemoteImage(imagePathUrl);
    if (downloaded) {
      const cloudUrl = await uploadBufferToCloud(
        downloaded.data,
        'barcode-product.jpg',
        downloaded.contentType
      );
      return {
        images: [downloaded],
        imagePath: cloudUrl || imagePathUrl,
      };
    }

    // Keep remote URL even if download failed (may still display in browser)
    return { images: [], imagePath: imagePathUrl };
  }

  return { images: [], imagePath: undefined };
}

module.exports = {
  hasBinaryImages,
  isHttpUrl,
  formatProductForClient,
  buildImagesFromFiles,
  downloadRemoteImage,
  resolveProductImages,
  uploadBufferToCloud,
  toImageBuffer,
  countProductImages,
};
