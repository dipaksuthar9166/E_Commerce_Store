const axios = require('axios');

/**
 * Removes the background from an image using the remove.bg API.
 * @param {string} imageUrl The publicly accessible URL of the image to process.
 * @returns {Promise<string>} The URL of the background-removed image, or the original URL if an error occurs.
 */
const removeImageBackground = async (imageUrl) => {
  // IMPORTANT: Replace with your actual remove.bg API key.
  // You can get a free API key from https://www.remove.bg/dashboard#api-key
  const REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY || 'YOUR_API_KEY_HERE';

  if (!REMOVE_BG_API_KEY || REMOVE_BG_API_KEY === 'YOUR_API_KEY_HERE') {
    console.warn('********************************************************************************');
    console.warn('* WARNING: remove.bg API key is not configured. Backgrounds will not be removed. *');
    console.warn('* Get a free key at https://www.remove.bg and add it to your .env file.         *');
    console.warn('********************************************************************************');
    return imageUrl; // Return original URL if API key is not set
  }

  if (!imageUrl || !imageUrl.startsWith('http')) {
    return imageUrl; // Return original if it's not a valid URL
  }

  try {
    const response = await axios.post(
      'https://api.remove.bg/v1.0/removebg',
      {
        image_url: imageUrl,
        size: 'auto', // Automatically determine output size
        type: 'auto', // Get URL of the result image
      },
      {
        headers: {
          'X-Api-Key': REMOVE_BG_API_KEY,
        },
        responseType: 'json', // Expect a JSON response containing the URL
      }
    );

    // remove.bg with `type: 'url'` returns the URL in `data.data.result_url`
    if (response.data && response.data.data && response.data.data.result_url) {
      console.log(`Successfully removed background for image: ${imageUrl}`);
      return response.data.data.result_url;
    } else {
      // Fallback for unexpected response structure
      console.warn('remove.bg response did not contain a result URL.', response.data);
      return imageUrl;
    }
  } catch (error) {
    // Log the error but return the original URL to not break the flow
    console.error('Error calling remove.bg API:', error.response ? error.response.data : error.message);
    console.error(`Failed to remove background for image: ${imageUrl}. Returning original.`);
    return imageUrl;
  }
};

module.exports = { removeImageBackground };
