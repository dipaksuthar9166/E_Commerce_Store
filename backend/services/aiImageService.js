const axios = require('axios');
// const fs = require('fs'); // Uncomment if you need to save files temporarily
// const path = require('path'); // Uncomment if you need to manage file paths

// --- STEP 1: CHOOSE AND CONFIGURE YOUR SERVICES ---

// A) AI Image Generation Service (e.g., OpenAI, Stability AI)
//    You will need to install the required SDK, e.g., `npm install openai`
//    Uncomment and configure the service you want to use.
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// B) Cloud Storage Service (e.g., AWS S3, Cloudinary)
//    You will need to install the required SDK, e.g., `npm install @aws-sdk/client-s3`
//    Uncomment and configure the service you want to use.
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * **SCAFFOLD FUNCTION**
 * Generates an image using an AI service based on a prompt, then uploads it to cloud storage.
 *
 * @param {string} prompt The prompt to send to the AI image generation service.
 * @returns {Promise<string>} The final, permanent URL of the image in your cloud storage.
 */
const generateAndStoreImage = async (prompt) => {
  console.log(`Generating AI image with prompt: "${prompt}"`);

  // --- STEP 2: GENERATE THE IMAGE ---
  // This section calls the AI API. The response will likely contain a temporary URL.
  // Replace this with the actual API call to your chosen service (DALL-E, Stable Diffusion, etc.).

  let temporaryImageUrl;
  try {
    // EXAMPLE FOR DALL-E 3:
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024", // or "1792x1024" or "1024x1792"
      quality: "standard", // or "hd"
    });
    temporaryImageUrl = response.data[0].url;
    console.log(`Generated temporary image URL: ${temporaryImageUrl}`);
  } catch (error) {
    console.error('--- AI IMAGE GENERATION FAILED ---');
    console.error(error.message);
    // Return a default fallback image URL if generation fails
    return 'https://via.placeholder.com/1024.png?text=Image+Generation+Failed';
  }

  // --- STEP 3: DOWNLOAD AND UPLOAD TO YOUR STORAGE ---
  // The temporary URL from the AI service will expire. You must download the image
  // and upload it to your own persistent storage (like AWS S3, Cloudinary, etc.).

  try {
    // 1. Download the image data from the temporary URL
    const imageResponse = await axios({
      method: 'get',
      url: temporaryImageUrl,
      responseType: 'arraybuffer',
    });
    const imageBuffer = Buffer.from(imageResponse.data, 'binary');
    const contentType = imageResponse.headers['content-type'] || 'image/png';
    const fileExtension = contentType.split('/')[1] || 'png';
    const fileName = `product_${Date.now()}.${fileExtension}`;

    // EXAMPLE FOR AWS S3 UPLOAD:
    // 2. Define S3 upload parameters
    const s3Params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `products/${fileName}`,
      Body: imageBuffer,
      ContentType: contentType,
      ACL: 'public-read', // Make the image publicly accessible
    };

    // 3. Upload to S3
    await s3Client.send(new PutObjectCommand(s3Params));

    // 4. Construct the permanent URL
    const permanentUrl = `https://${s3Params.Bucket}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${s3Params.Key}`;
    console.log(`Successfully uploaded image to S3. Permanent URL: ${permanentUrl}`);
    
    return permanentUrl;
  } catch (error) {
    console.error('--- CLOUD STORAGE UPLOAD FAILED ---');
    console.error(error.message);
    // Return a fallback image URL if upload fails
    return 'https://via.placeholder.com/1024.png?text=Image+Upload+Failed';
  }
};

module.exports = { generateAndStoreImage };
