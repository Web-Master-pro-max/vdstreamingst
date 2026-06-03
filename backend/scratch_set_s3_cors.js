const { S3Client, PutBucketCorsCommand } = require('@aws-sdk/client-s3');
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
  console.log(`Setting CORS configuration on bucket: ${bucketName}...`);
  
  const corsConfiguration = {
    CORSRules: [
      {
        AllowedHeaders: ['*'],
        AllowedMethods: ['GET', 'HEAD'],
        AllowedOrigins: ['*'],
        ExposeHeaders: ['Access-Control-Allow-Origin'],
        MaxAgeSeconds: 3000
      }
    ]
  };

  try {
    const command = new PutBucketCorsCommand({
      Bucket: bucketName,
      CORSConfiguration: corsConfiguration
    });
    
    await s3.send(command);
    console.log(`🎉 SUCCESS! CORS policy applied to bucket ${bucketName}!`);
  } catch (err) {
    console.error(`❌ FAILED to set CORS policy:`, err.message);
  }
}

main();
