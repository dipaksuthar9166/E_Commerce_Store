import {
  Home,
  ShoppingBag,
  ClipboardList,
  Smartphone,
  BookOpen,
  Shirt,
  Sparkles,
  Laptop,
  Heart,
  Package,
  Tag,
} from 'lucide-react';

/** Suggested names vendors can quick-add (not forced on customer sidebar) */
export const vendorProductCategoryNames = [
  'Grocery',
  'Electronics',
  'Mobiles',
  'Fashion',
  'Stationery',
  'Beauty',
  'Books',
  'Home',
  'Sports',
  'Toys',
];

const EMOJI_MAP = {
  grocery: '🛒',
  electronics: '💻',
  mobiles: '📱',
  mobile: '📱',
  fashion: '👟',
  clothing: '👕',
  stationery: '📚',
  books: '📖',
  beauty: '💄',
  home: '🏠',
  sports: '⚽',
  toys: '🧸',
  food: '🍔',
  pharmacy: '💊',
  offers: '🔥',
};

const ICON_MAP = {
  grocery: ShoppingBag,
  electronics: Laptop,
  mobiles: Smartphone,
  mobile: Smartphone,
  fashion: Shirt,
  clothing: Shirt,
  stationery: BookOpen,
  books: BookOpen,
  offers: Sparkles,
};

const COLOR_MAP = [
  'from-emerald-500 to-teal-600',
  'from-sky-500 to-blue-600',
  'from-violet-500 to-purple-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-cyan-500 to-blue-600',
  'from-orange-500 to-red-500',
  'from-indigo-500 to-blue-700',
];

export function slugifyCategory(name = '') {
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function pickMeta(name, index = 0) {
  const key = slugifyCategory(name);
  const base = key.split('-')[0] || key;
  return {
    key,
    emoji: EMOJI_MAP[base] || EMOJI_MAP[key] || '📦',
    icon: ICON_MAP[base] || ICON_MAP[key] || Tag,
    color: COLOR_MAP[index % COLOR_MAP.length],
  };
}

/** Fixed customer nav links (not vendor categories) */
export const staticNavLinks = [
  {
    key: 'all-products',
    label: 'All Products',
    path: '/products',
    icon: Home,
    description: 'Browse full catalogue',
    type: 'link',
    emoji: '📦',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    key: 'offers',
    label: 'Top Offers',
    path: '/category/offers',
    icon: Sparkles,
    description: 'Deals & discounts',
    type: 'category',
    categoryName: 'Offers',
    emoji: '🔥',
    color: 'from-orange-500 to-red-500',
  },
  {
    key: 'orders',
    label: 'My Orders',
    path: '/orders',
    icon: ClipboardList,
    description: 'Track your orders',
    type: 'link',
    emoji: '📦',
    color: 'from-slate-500 to-slate-700',
  },
  {
    key: 'wishlist',
    label: 'Wishlist',
    path: '/wishlist',
    icon: Heart,
    description: 'Saved products',
    type: 'link',
    emoji: '❤️',
    color: 'from-pink-500 to-rose-600',
  },
];

/**
 * Map API public categories → sidebar/home items.
 * @param {{ name: string, key?: string, productCount?: number }[]} apiCategories
 */
export function buildCustomerNavFromApi(apiCategories = []) {
  const live = (Array.isArray(apiCategories) ? apiCategories : []).map((c, i) => {
    const meta = pickMeta(c.name, i);
    const key = c.key || meta.key;
    return {
      key,
      label: c.name,
      path: `/category/${key}`,
      icon: meta.icon,
      description: `${c.productCount || 0} products`,
      type: 'category',
      categoryName: c.name,
      emoji: meta.emoji,
      color: meta.color,
      productCount: c.productCount || 0,
    };
  });

  // All Products → live vendor categories → Top Offers → Orders → Wishlist
  const allProducts = staticNavLinks.find((l) => l.key === 'all-products');
  const offers = staticNavLinks.find((l) => l.key === 'offers');
  const orders = staticNavLinks.find((l) => l.key === 'orders');
  const wishlist = staticNavLinks.find((l) => l.key === 'wishlist');

  return [allProducts, ...live, offers, orders, wishlist].filter(Boolean);
}

/** Home chips = only real vendor categories (not static links) */
export function buildHomeCategoryChips(apiCategories = []) {
  return buildCustomerNavFromApi(apiCategories).filter((item) => item.type === 'category' && item.key !== 'offers');
}

export function resolveCategoryFromKey(categoryKey, apiCategories = []) {
  const nav = buildCustomerNavFromApi(apiCategories);
  const byKey = nav.find((item) => item.key === categoryKey);
  if (byKey) return byKey;

  // Fallback: treat URL key as category name (decoded)
  if (categoryKey === 'offers' || categoryKey === 'top-offers') {
    return staticNavLinks.find((l) => l.key === 'offers');
  }

  const nameGuess = decodeURIComponent(categoryKey).replace(/-/g, ' ');
  return {
    key: categoryKey,
    label: nameGuess.replace(/\b\w/g, (c) => c.toUpperCase()),
    path: `/category/${categoryKey}`,
    icon: Package,
    type: 'category',
    categoryName: nameGuess,
    emoji: '📦',
    color: 'from-slate-500 to-slate-700',
  };
}

export const isCategoryPathActive = (currentPath, item) => {
  if (item.type === 'link' && item.key === 'all-products') {
    return currentPath === '/products' || currentPath.startsWith('/product/');
  }
  return currentPath === item.path;
};

// Back-compat aliases (empty static list — use live API)
export const customerCategories = staticNavLinks;
export const homeCategoryChips = [];
export const getCustomerCategoryByKey = (key) =>
  resolveCategoryFromKey(key, []);
