const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '.env') });

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

async function main() {
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.AWS_S3_BUCKET,
      Delimiter: '/'
    });
    const response = await s3.send(command);
    console.log("Root folders:");
    if (response.CommonPrefixes) {
      response.CommonPrefixes.forEach(p => console.log(` - ${p.Prefix}`));
    }
    
    // Check inside Server-S3/Descendants of the Sun S01/videos/
    const command2 = new ListObjectsV2Command({
      Bucket: process.env.AWS_S3_BUCKET,
      Prefix: 'Server-S3/Descendants of the Sun S01/videos/',
      Delimiter: '/'
    });
    const response2 = await s3.send(command2);
    console.log("\nFolders inside Server-S3/Demon_Slayer_infinit/:");
    if (response2.CommonPrefixes) {
      response2.CommonPrefixes.forEach(p => console.log(` - ${p.Prefix}`));
    }
    if (response2.Contents) {
      const match = response2.Contents.filter(item => item.Key.includes('m3u8'));
      match.forEach(item => console.log(` - MATCH: ${item.Key}`));
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

main();
