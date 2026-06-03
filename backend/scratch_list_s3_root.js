const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '.env') });

const s3 = new S3Client({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

async function main() {
  const bucketName = 'server-3a';
  console.log(`Listing root folders in bucket: ${bucketName}`);
  
  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Delimiter: '/'
    });
    const response = await s3.send(command);
    
    console.log("Root Folders / Common Prefixes:");
    if (response.CommonPrefixes) {
      response.CommonPrefixes.forEach(p => console.log(` - ${p.Prefix}`));
    } else {
      console.log("No common prefixes found.");
    }
    
    console.log("\nRoot Objects:");
    if (response.Contents) {
      response.Contents.forEach(item => {
        console.log(` - ${item.Key} (${item.Size} bytes)`);
      });
    } else {
      console.log("No root objects found.");
    }
  } catch (err) {
    console.error("Error listing S3 root:", err.message);
  }
}

main();
