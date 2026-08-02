/** Shared product image helper — full backend URL so Vercel/production can load images */

import { getApiBaseUrl } from './apiBase';

const DEFAULT =
  'https://images.unsplash.com/photo-1560393464-5c69a73c5770?auto=format&fit=crop&q=80&w=600';

function apiOrigin() {
  // getApiBaseUrl → https://xxx.onrender.com/api  (keep /api — image routes live under it)
  return String(getApiBaseUrl() || '').replace(/\/+$/, '');
}

function isHttpUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value.trim());
}

/** True when product has a displayable image (URL or DB binary via hasImage) */
export function productHasImage(product) {
  if (!product) return false;
  if (product.hasImage === true) return true;
  if (product.hasImage === false) return false;
  if (isHttpUrl(product.imagePath)) return true;
  if (typeof product.imageCount === 'number' && product.imageCount > 0) return true;
  if (Array.isArray(product.images) && product.images.length > 0) return true;
  // Legacy: imagePath was set even for relative/API cases
  if (product.imagePath && String(product.imagePath).trim()) return true;
  return false;
}

/** Backend image endpoint for a product id (works online + local) */
export function getProductImageUrl(productId, index = 0) {
  if (!productId) return DEFAULT;
  const base = apiOrigin();
  if (!index || index === 0) {
    return `${base}/products/${productId}/image`;
  }
  return `${base}/products/${productId}/images/${index}`;
}

export function getProductImage(product) {
  if (!product) return DEFAULT;

  // Absolute CDN / barcode / Cloudinary URL
  if (isHttpUrl(product.imagePath)) {
    return product.imagePath.trim();
  }

  // Cart may store a resolved absolute URL
  if (isHttpUrl(product.image_path)) {
    return product.image_path.trim();
  }

  const id = product._id || product.id;
  if (id && productHasImage(product)) {
    return getProductImageUrl(id, 0);
  }

  // Soft fallback: try API when shape is ambiguous (legacy cart / partial objects)
  if (
    id &&
    product.hasImage !== false &&
    (product.images || product.imagePath || product.image_path || product.imageCount)
  ) {
    return getProductImageUrl(id, 0);
  }

  return DEFAULT;
}

export function getProductImageByIndex(product, index = 0) {
  if (!product) return DEFAULT;

  if (isHttpUrl(product.imagePath) && (!index || index === 0)) {
    return product.imagePath.trim();
  }

  // Legacy string[] gallery
  if (Array.isArray(product.images) && typeof product.images[index] === 'string') {
    const src = product.images[index];
    if (isHttpUrl(src)) return src;
  }

  const id = product._id || product.id;
  if (id && index !== undefined && index >= 0 && productHasImage(product)) {
    return getProductImageUrl(id, index);
  }

  // Soft fallback for detail pages that build index from imageCount
  if (id && productHasImage(product) !== false && (product.imageCount > 0 || product.hasImage)) {
    return getProductImageUrl(id, index);
  }

  return DEFAULT;
}

export { DEFAULT as DEFAULT_PRODUCT_IMAGE };
