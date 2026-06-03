const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const envPath = fs.existsSync(path.join(__dirname, '.env'))
  ? path.join(__dirname, '.env')
  : path.join(__dirname, '../.env');

dotenv.config({ path: envPath });

const s3 = new S3Client({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

async function main() {
  const bucketName = 'server-3a';
  console.log(`Checking bucket: ${bucketName} for all objects`);
  let isTruncated = true;
  let nextContinuationToken = undefined;
  
  try {
    while (isTruncated) {
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        ContinuationToken: nextContinuationToken
      });
      const response = await s3.send(command);
      
      if (response.Contents) {
        response.Contents.forEach(item => {
          console.log(`- ${item.Key} (${item.Size} bytes)`);
        });
      }
      
      isTruncated = response.IsTruncated;
      nextContinuationToken = response.NextContinuationToken;
    }
  } catch (err) {
    console.error("ERROR listing S3 bucket:", err.message);
  }
}

main();
