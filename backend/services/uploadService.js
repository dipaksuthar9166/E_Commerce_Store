const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION || process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Uploads a file buffer to S3.
 * @param {Buffer} buffer The file buffer.
 * @param {string} originalName The original filename.
 * @param {string} mimetype The mime type.
 * @returns {Promise<string>} The public URL of the uploaded image.
 */
const uploadBufferToS3 = async (buffer, originalName, mimetype) => {
  try {
    const fileExtension = originalName.split('.').pop() || 'png';
    const fileName = `product_${Date.now()}_${Math.floor(Math.random() * 10000)}.${fileExtension}`;

    const s3Params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME || process.env.AWS_BUCKET_NAME,
      Key: `products/${fileName}`,
      Body: buffer,
      ContentType: mimetype,
      ACL: 'public-read',
    };

    await s3Client.send(new PutObjectCommand(s3Params));

    const s3Region = process.env.AWS_S3_REGION || process.env.AWS_REGION || 'ap-south-1';
    const permanentUrl = `https://${s3Params.Bucket}.s3.${s3Region}.amazonaws.com/${s3Params.Key}`;
    return permanentUrl;
  } catch (error) {
    if (error.name === 'NoSuchBucket' || error.Code === 'NoSuchBucket') {
      console.warn(`[upload] S3 Bucket "${s3Params.Bucket}" does not exist. Falling back to local/database storage.`);
    } else {
      console.warn(`[upload] S3 Upload failed: ${error.message || 'Unknown error'}. Falling back to local/database storage.`);
    }
    return null;
  }
};

module.exports = {
  uploadBufferToS3,
};
