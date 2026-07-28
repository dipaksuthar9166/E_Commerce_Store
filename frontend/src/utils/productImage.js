/** Shared product image helper — avoids broken / mismatched placeholders */

const DEFAULT =
  'https://images.unsplash.com/photo-1560393464-5c69a73c5770?auto=format&fit=crop&q=80&w=600';

export function getProductImage(product) {
  // If product has an _id, assume it has an image in the DB and use the API endpoint
  if (product?._id) {
    return `/api/products/${product._id}/image`;
  }
  // Fallback for cases where product might not have an _id or image is not in DB
  return DEFAULT; // Use the existing default placeholder
}

export function getProductImageByIndex(product, index) {
  if (product?._id && index !== undefined && index >= 0) {
    return `/api/products/${product._id}/images/${index}`;
  }
  return DEFAULT;
}
