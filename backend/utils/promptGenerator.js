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

/**
 * Generates a dynamic, detailed prompt for an AI image generation service for a banner.
 * @param {string} productName The name of the product.
 * @param {number} discountPercent The discount percentage for the product.
 * @param {string} category The category of the product.
 * @returns {string} A detailed prompt for generating a high-quality promotional banner.
 */
function generateBannerPrompt(productName, discountPercent, category) {
  const template = "A high-end e-commerce promotional banner featuring {product_name}, placed dynamically on a sleek dark-themed studio background tailored for {category}. The product is rendered in stunning 3D with dramatic ambient rim lighting, dynamic neon edge glows, and soft particle glare effects. Bold aesthetic typography on the left with text '{discount_percent}% OFF', a glowing vibrant 'SHOP NOW' CTA button with smooth glassmorphism UI overlay. Premium commercial product photography style, ultra-detailed, 8K resolution --ar 16:5";

  return template
    .replace('{product_name}', productName)
    .replace('{discount_percent}', discountPercent)
    .replace('{category}', category || 'products');
}


module.exports = { generateProductPrompt, generateBannerPrompt };
