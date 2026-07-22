/** Shared product image helper — avoids broken / mismatched placeholders */

const KEYWORD_IMAGES = [
  { keys: ['laptop', 'computer', 'notebook pc'], url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=600' },
  { keys: ['mobile', 'phone', 'smartphone', 'iphone'], url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=600' },
  { keys: ['shoe', 'sneaker', 'nike', 'footwear'], url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600' },
  { keys: ['book', 'maths', 'cbse', 'class'], url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600' },
  { keys: ['parle', 'biscuit', 'snack', 'food'], url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&q=80&w=600' },
  { keys: ['grocery', 'fruit', 'veg'], url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600' },
];

const DEFAULT =
  'https://images.unsplash.com/photo-1560393464-5c69a73c5770?auto=format&fit=crop&q=80&w=600';

export function getProductImage(product) {
  if (product?.imagePath && String(product.imagePath).trim()) {
    return product.imagePath;
  }
  const name = (product?.name || '').toLowerCase();
  for (const entry of KEYWORD_IMAGES) {
    if (entry.keys.some((k) => name.includes(k))) return entry.url;
  }
  return DEFAULT;
}
