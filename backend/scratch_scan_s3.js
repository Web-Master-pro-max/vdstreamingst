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
  console.log(`Scanning bucket: ${bucketName} for folders under 'videos/'`);
  
  try {
    let isTruncated = true;
    let nextContinuationToken = undefined;
    const folders = new Set();
    const manifestFiles = [];

    while (isTruncated) {
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: 'videos/',
        ContinuationToken: nextContinuationToken
      });
      const response = await s3.send(command);
      
      if (response.Contents) {
        response.Contents.forEach(item => {
          const key = item.Key;
          const parts = key.split('/');
          if (parts.length > 2) {
            const folderPath = parts.slice(0, 3).join('/'); // videos/show_X/ep_Y
            folders.add(folderPath);
            if (key.endsWith('master.m3u8')) {
              manifestFiles.push(key);
            }
          }
        });
      }
      
      isTruncated = response.IsTruncated;
      nextContinuationToken = response.NextContinuationToken;
    }

    console.log(`\nFound ${folders.size} video folders:`);
    for (const f of folders) {
      console.log(` - ${f}`);
    }

    console.log(`\nFound ${manifestFiles.length} master manifest files:`);
    for (const m of manifestFiles) {
      console.log(` - ${m}`);
    }

    // Scan posters and banners
    console.log("\nScanning for posters/ and banners/ in S3...");
    const rootFolders = ['posters/', 'banners/'];
    for (const prefix of rootFolders) {
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix
      });
      const response = await s3.send(command);
      if (response.Contents) {
        console.log(`Files under ${prefix}:`);
        response.Contents.forEach(item => {
          console.log(` - ${item.Key} (${item.Size} bytes)`);
        });
      } else {
        console.log(`No files found under ${prefix}`);
      }
    }

  } catch (err) {
    console.error("ERROR listing S3 bucket:", err.message);
  }
}

main();
