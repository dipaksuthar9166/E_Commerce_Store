const OpenAI = require('openai');
const axios = require('axios');
const cheerio = require('cheerio');
const {
  isCloudinaryConfigured,
  uploadImageToCloudinary,
  uploadBase64ToCloudinary,
} = require('./cloudinaryService');

function getOpenAIClient() {
  const apiKey = (process.env.OPENAI_API_KEY || '').trim();
  if (!apiKey || apiKey.includes('your_') || apiKey === 'sk-...') {
    return null;
  }
  return new OpenAI({ apiKey });
}

function hasOpenAIKey() {
  return Boolean(getOpenAIClient());
}

/**
 * Generate product image with OpenAI DALL·E, then store on Cloudinary when configured.
 * Falls back to web image search only if no OpenAI key.
 *
 * @param {string} prompt
 * @returns {Promise<{ url: string, source: 'openai'|'openai+cloudinary'|'search'|'placeholder', revisedPrompt?: string }>}
 */
const generateAndStoreImage = async (prompt) => {
  const client = getOpenAIClient();

  if (client) {
    try {
      console.log(`[AI Image] OpenAI DALL·E — prompt: "${String(prompt).slice(0, 120)}..."`);

      const model = process.env.OPENAI_IMAGE_MODEL || 'dall-e-3';
      const size = process.env.OPENAI_IMAGE_SIZE || '1024x1024';

      // Prefer b64 so we can permanently host on Cloudinary (OpenAI URLs expire ~1h)
      const response = await client.images.generate({
        model,
        prompt: String(prompt).slice(0, 3900),
        n: 1,
        size,
        quality: process.env.OPENAI_IMAGE_QUALITY || 'standard',
        style: 'natural',
        response_format: isCloudinaryConfigured() ? 'b64_json' : 'url',
      });

      const item = response.data?.[0];
      if (!item) {
        throw new Error('OpenAI returned no image data');
      }

      const revisedPrompt = item.revised_prompt;

      if (item.b64_json) {
        const permanent = await uploadBase64ToCloudinary(item.b64_json);
        if (permanent) {
          console.log('[AI Image] Stored on Cloudinary');
          return { url: permanent, source: 'openai+cloudinary', revisedPrompt };
        }
        // Cloudinary failed — use data URI only as last resort for small demos (skip — too large)
        // Fall through: re-request URL format
        const urlResp = await client.images.generate({
          model,
          prompt: String(prompt).slice(0, 3900),
          n: 1,
          size,
          quality: process.env.OPENAI_IMAGE_QUALITY || 'standard',
          style: 'natural',
          response_format: 'url',
        });
        const url = urlResp.data?.[0]?.url;
        if (url) {
          console.warn('[AI Image] Cloudinary missing/failed — using temporary OpenAI URL (~1h)');
          return { url, source: 'openai', revisedPrompt };
        }
      }

      if (item.url) {
        // Try to mirror to Cloudinary for permanent URL
        if (isCloudinaryConfigured()) {
          const permanent = await uploadImageToCloudinary(item.url);
          if (permanent) {
            return { url: permanent, source: 'openai+cloudinary', revisedPrompt };
          }
        }
        console.warn('[AI Image] Using temporary OpenAI URL (set CLOUDINARY_* for permanent storage)');
        return { url: item.url, source: 'openai', revisedPrompt };
      }

      throw new Error('OpenAI image response missing url and b64_json');
    } catch (err) {
      console.error('[AI Image] OpenAI failed:', err.status || '', err.message);
      // Fall through to search fallback so product add still works
      const searchUrl = await searchWebImage(prompt);
      return {
        url: searchUrl,
        source: searchUrl.includes('placeholder') ? 'placeholder' : 'search',
        error: err.message,
      };
    }
  }

  console.warn('[AI Image] No OPENAI_API_KEY — using web image search fallback');
  const searchUrl = await searchWebImage(prompt);
  return {
    url: searchUrl,
    source: searchUrl.includes('placeholder') ? 'placeholder' : 'search',
  };
};

/** Legacy Yahoo scrape fallback (no API key needed). */
async function searchWebImage(prompt) {
  try {
    const response = await axios.get(
      'https://images.search.yahoo.com/search/images?p=' + encodeURIComponent(prompt),
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        timeout: 12000,
      }
    );

    const $ = cheerio.load(response.data);
    let imageUrl = null;

    $('img').each((i, el) => {
      const src = $(el).attr('data-src') || $(el).attr('src');
      if (src && src.startsWith('http') && !src.includes('clear.gif') && !src.includes('pixel')) {
        imageUrl = src;
        return false;
      }
    });

    if (imageUrl) return imageUrl;
  } catch (error) {
    console.error('[AI Image] Web search failed:', error.message);
  }

  return (
    'https://via.placeholder.com/1024.png?text=' +
    encodeURIComponent(String(prompt).slice(0, 40) || 'No+Image')
  );
}

/**
 * Convenience: returns only the URL string (used by addVendorProduct).
 */
async function generateAndStoreImageUrl(prompt) {
  const result = await generateAndStoreImage(prompt);
  return typeof result === 'string' ? result : result.url;
}

module.exports = {
  generateAndStoreImage,
  generateAndStoreImageUrl,
  hasOpenAIKey,
  isCloudinaryConfigured,
};
