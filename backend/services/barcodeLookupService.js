const axios = require('axios');
const Product = require('../models/Product');

/**
 * Lookup product details by barcode (EAN-13 / UPC / etc.)
 * Sources (in order):
 *  1. Existing products in our DB (same barcode)
 *  2. Open Food Facts (free, grocery/FMCG)
 *  3. Open Beauty Facts (cosmetics)
 */

const UA = 'MerskoECommerce/1.0 (vendor-barcode-lookup)';

function cleanBarcode(code) {
  return String(code || '').replace(/\s+/g, '').trim();
}

function mapOpenFoodFacts(product, barcode) {
  if (!product) return null;

  const name =
    product.product_name_en ||
    product.product_name ||
    product.generic_name_en ||
    product.generic_name ||
    product.brands ||
    '';

  if (!name) return null;

  const brand = product.brands || product.brand_owner || '';
  const quantity = product.quantity || '';

  // Prefer English category tags when available
  let category = '';
  if (Array.isArray(product.categories_tags) && product.categories_tags.length) {
    const enTag = [...product.categories_tags].reverse().find((t) => String(t).startsWith('en:'));
    if (enTag) {
      category = enTag.replace(/^en:/i, '').replace(/-/g, ' ').trim();
    }
  }
  if (!category && product.categories) {
    const parts = product.categories.split(',').map((s) => s.trim()).filter(Boolean);
    category = parts[parts.length - 1] || parts[0] || '';
  }
  category = String(category)
    .replace(/^[a-z]{2}:/i, '')
    .replace(/-/g, ' ')
    .trim();
  if (category) {
    category = category
      .split(' ')
      .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
      .join(' ');
  }
  if (!category) category = 'Grocery';

  const image =
    product.image_front_url ||
    product.image_url ||
    product.image_front_small_url ||
    product.image_small_url ||
    '';

  const ingredients = product.ingredients_text_en || product.ingredients_text || '';
  const descParts = [
    brand && `Brand: ${brand}`,
    quantity && `Size: ${quantity}`,
    ingredients && ingredients.slice(0, 280),
  ].filter(Boolean);

  return {
    barcode,
    name: name.trim(),
    brand: brand || '',
    description: descParts.join(' · ') || name.trim(),
    category: category || 'Grocery',
    color: '',
    imagePath: image || '',
    source: 'openfoodfacts',
  };
}

async function fetchOpenFacts(baseUrl, barcode) {
  try {
    const { data } = await axios.get(`${baseUrl}/api/v2/product/${encodeURIComponent(barcode)}.json`, {
      timeout: 12000,
      headers: { 'User-Agent': UA },
      validateStatus: (s) => s < 500,
    });
    if (data?.status === 1 && data.product) {
      return mapOpenFoodFacts(data.product, barcode);
    }
  } catch (err) {
    console.warn(`Barcode lookup failed (${baseUrl}):`, err.message);
  }
  return null;
}

async function lookupFromDb(barcode) {
  const existing = await Product.findOne({ barcode })
    .sort({ updatedAt: -1 })
    .select('name description color imagePath category barcode categoryId')
    .populate('categoryId', 'name')
    .lean();

  if (!existing) return null;

  return {
    barcode,
    name: existing.name,
    brand: '',
    description: existing.description || '',
    category: existing.categoryId?.name || existing.category || 'General',
    color: existing.color || '',
    imagePath: existing.imagePath || '',
    source: 'database',
  };
}

/**
 * @param {string} rawCode
 * @returns {Promise<object|null>}
 */
async function lookupBarcode(rawCode) {
  const barcode = cleanBarcode(rawCode);
  if (!barcode || barcode.length < 6) {
    return null;
  }

  // 1) Our catalogue (instant, works offline for known codes)
  const fromDb = await lookupFromDb(barcode);
  if (fromDb) return fromDb;

  // 2) Open Food Facts
  const food = await fetchOpenFacts('https://world.openfoodfacts.org', barcode);
  if (food) return food;

  // 3) Open Beauty Facts
  const beauty = await fetchOpenFacts('https://world.openbeautyfacts.org', barcode);
  if (beauty) return beauty;

  return null;
}

module.exports = { lookupBarcode, cleanBarcode };
