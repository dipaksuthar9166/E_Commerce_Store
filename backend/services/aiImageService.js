const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Generates an image using an Yahoo Image Search based on a prompt.
 *
 * @param {string} prompt The prompt to send to the image search.
 * @returns {Promise<string>} The final URL of the image.
 */
const generateAndStoreImage = async (prompt) => {
  console.log(`Searching real image with prompt: "${prompt}"`);

  try {
    const response = await axios.get('https://images.search.yahoo.com/search/images?p=' + encodeURIComponent(prompt), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    const $ = cheerio.load(response.data);
    let imageUrl = null;

    $('img').each((i, el) => {
      const src = $(el).attr('data-src') || $(el).attr('src');
      // basic filter to avoid tiny icons or tracking pixels
      if (src && src.startsWith('http') && !src.includes('clear.gif') && !src.includes('pixel')) {
        imageUrl = src;
        return false; // break loop
      }
    });

    if (imageUrl) {
      console.log(`Found real image: ${imageUrl}`);
      return imageUrl;
    } else {
      console.log('No image found, using fallback.');
      return 'https://via.placeholder.com/1024.png?text=' + encodeURIComponent(prompt);
    }
  } catch (error) {
    console.error('--- IMAGE SEARCH FAILED ---');
    console.error(error.message);
    return 'https://via.placeholder.com/1024.png?text=Image+Search+Failed';
  }
};

module.exports = { generateAndStoreImage };
