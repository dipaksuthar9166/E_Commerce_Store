/**
 * Generates a dynamic, detailed prompt for an AI image generation service.
 * @param {string} productName The name of the product (e.g., "Samsung Galaxy S26 Ultra").
 * @param {string} [color] The color of the product (e.g., "Sky Blue").
 * @param {string} [category] The category of the product (e.g., "Smartphone").
 * @returns {string} A detailed prompt for generating a high-quality product image.
 */
function generateProductPrompt(productName, color, category) {
  let prompt = `A professional, photorealistic e-commerce product photograph of a ${productName}`;

  if (color) {
    prompt += ` in ${color}`;
  }
  if (category) {
    prompt += `, which is a type of ${category}`;
  }

prompt += `. The item is centered in the frame against a clean, isolated, neutral light-grey background. Shot with studio lighting to create soft shadows, highlighting the product's texture and details. High resolution, 4k, crisp quality.`;
  
  return prompt;
}

module.exports = { generateProductPrompt };
