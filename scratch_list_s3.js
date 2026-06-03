const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const dotenv = require('dotenv');
const path = require('path');

const fs = require('fs');
const envPath = fs.existsSync(path.join(__dirname, 'backend/.env')) 
  ? path.join(__dirname, 'backend/.env')
  : fs.existsSync(path.join(__dirname, '.env'))
    ? path.join(__dirname, '.env')
    : path.join(__dirname, '../.env');

dotenv.config({ path: envPath });

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

async function main() {
  console.log(`Checking bucket: ${process.env.AWS_S3_BUCKET}`);
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.AWS_S3_BUCKET,
      MaxKeys: 20
    });
    const response = await s3.send(command);
    console.log("SUCCESS! Objects found:");
    if (response.Contents) {
      response.Contents.forEach(item => {
        console.log(` - ${item.Key} (${item.Size} bytes)`);
      });
    } else {
      console.log("Bucket is empty.");
    }
  } catch (err) {
    console.error("ERROR listing S3 bucket:", err.message);
  }
}

main();
