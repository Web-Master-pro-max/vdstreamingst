const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '.env') });

const s3 = new S3Client({
  region: 'eu-north-1', // Frieren / Spy X Family bucket is in eu-north-1
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

async function main() {
  const bucketName = 'server-s3-6';
  console.log(`Searching bucket ${bucketName} for Frieren folders...`);
  
  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: 'Server-S3/',
      Delimiter: '/'
    });
    const response = await s3.send(command);
    
    console.log("Root folders in server-s3-6/Server-S3/:");
    if (response.CommonPrefixes) {
      response.CommonPrefixes.forEach(p => console.log(` - ${p.Prefix}`));
    } else {
      console.log("No common prefixes found.");
    }

    // Search specifically for Frieren folders
    const frierenPrefixes = response.CommonPrefixes 
      ? response.CommonPrefixes.filter(p => p.Prefix.toLowerCase().includes('frieren'))
      : [];
    
    if (frierenPrefixes.length > 0) {
      console.log("\nFound Frieren folders! Listing their contents to locate episodes...");
      for (const prefix of frierenPrefixes) {
        console.log(`\nListing folder: ${prefix.Prefix}`);
        const listCommand = new ListObjectsV2Command({
          Bucket: bucketName,
          Prefix: prefix.Prefix
        });
        const listRes = await s3.send(listCommand);
        if (listRes.Contents) {
          const manifests = listRes.Contents.filter(item => item.Key.endsWith('master.m3u8'));
          console.log(`Found ${manifests.length} master manifest files:`);
          manifests.forEach(m => {
            console.log(` - Key: ${m.Key}`);
            console.log(`   URL: https://${bucketName}.s3.eu-north-1.amazonaws.com/${encodeURIComponent(m.Key)}`);
          });
        }
      }
    } else {
      console.log("\nNo folders containing 'frieren' found under Server-S3/ prefix.");
    }
  } catch (err) {
    console.error("Error checking server-s3-6:", err.message);
  }
}

main();
