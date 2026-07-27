const { v2: cloudinary } = require('cloudinary');

function isCloudinaryConfigured() {
  const name = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!name || !key || !secret) return false;
  if (String(secret).includes('your_real') || String(secret).includes('placeholder')) {
    return false;
  }
  return true;
}

function configureCloudinary() {
  if (!isCloudinaryConfigured()) return false;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return true;
}

/**
 * Upload a remote image URL or base64 data URI to Cloudinary.
 * @returns {Promise<string|null>} permanent HTTPS URL or null if not configured / failed
 */
async function uploadImageToCloudinary(source, folder = 'mersko/products') {
  if (!configureCloudinary()) return null;
  try {
    const result = await cloudinary.uploader.upload(source, {
      folder,
      resource_type: 'image',
      overwrite: false,
      transformation: [
        { width: 1024, height: 1024, crop: 'limit' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });
    return result.secure_url || result.url || null;
  } catch (err) {
    console.error('Cloudinary upload failed:', err.message);
    return null;
  }
}

/**
 * Upload raw base64 (no data: prefix) as PNG.
 */
async function uploadBase64ToCloudinary(base64, folder = 'mersko/products') {
  if (!base64) return null;
  const dataUri = base64.startsWith('data:')
    ? base64
    : `data:image/png;base64,${base64}`;
  return uploadImageToCloudinary(dataUri, folder);
}

module.exports = {
  isCloudinaryConfigured,
  uploadImageToCloudinary,
  uploadBase64ToCloudinary,
};
