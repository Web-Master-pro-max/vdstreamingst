const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const dotenv = require('dotenv');

dotenv.config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'dummy_key',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'dummy_secret',
  },
});

/**
 * Uploads a file buffer to AWS S3
 * @param {string} key - S3 Key (path in bucket)
 * @param {Buffer} body - File buffer
 * @param {string} contentType - File MIME type
 * @returns {Promise<string>} - The S3 URL of the uploaded object
 */
async function uploadToS3(key, body, contentType) {
  const bucketName = process.env.AWS_S3_BUCKET;
  if (!bucketName) {
    throw new Error('AWS_S3_BUCKET is not configured in .env');
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: body,
    ContentType: contentType,
    // Note: ACL public-read is commonly used for streaming content, but modern buckets
    // often use bucket policies instead. We'll omit ACL and let bucket policy dictate permissions,
    // or return the standard S3 URL.
  });

  await s3Client.send(command);
  
  // Return the public-facing S3 URL
  return `https://${bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
}

module.exports = {
  s3Client,
  uploadToS3,
};
