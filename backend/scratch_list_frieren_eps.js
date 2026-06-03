const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '.env') });

const s3 = new S3Client({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

async function main() {
  const bucketName = 'server-s3-6';
  const prefix = 'Server-S3/Frieren Beyond Journeys End S01/videos/';
  console.log(`Checking bucket ${bucketName} under prefix: ${prefix}`);
  
  try {
    let isTruncated = true;
    let nextContinuationToken = undefined;
    const episodesFound = new Set();
    const allMasterManifests = [];

    while (isTruncated) {
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix,
        ContinuationToken: nextContinuationToken
      });
      const response = await s3.send(command);
      
      if (response.Contents) {
        response.Contents.forEach(item => {
          const key = item.Key;
          // Key looks like: Server-S3/Frieren Beyond Journeys End S01/videos/EP1/master.m3u8
          const relativePath = key.substring(prefix.length);
          const parts = relativePath.split('/');
          if (parts.length > 0 && parts[0].startsWith('EP')) {
            episodesFound.add(parts[0]);
            if (key.endsWith('master.m3u8')) {
              allMasterManifests.push(key);
            }
          }
        });
      }
      
      isTruncated = response.IsTruncated;
      nextContinuationToken = response.NextContinuationToken;
    }

    console.log(`\nFound ${episodesFound.size} episode folders:`);
    console.log(Array.from(episodesFound).sort((a,b) => {
      const numA = parseInt(a.replace('EP', ''));
      const numB = parseInt(b.replace('EP', ''));
      return numA - numB;
    }).join(', '));

    console.log(`\nFound ${allMasterManifests.length} master manifest files:`);
    allMasterManifests.sort().forEach(m => {
      console.log(` - ${m}`);
    });
  } catch (err) {
    console.error("Error listing Frieren S3 objects:", err.message);
  }
}

main();
