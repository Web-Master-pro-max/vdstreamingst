const { S3Client, ListBucketsCommand, PutBucketCorsCommand } = require('@aws-sdk/client-s3');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Checking S3 Buckets for credentials...");
  
  const corsConfiguration = {
    CORSRules: [
      {
        AllowedHeaders: ['*'],
        AllowedMethods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE'],
        AllowedOrigins: ['*'],
        ExposeHeaders: ['Access-Control-Allow-Origin', 'Content-Length', 'Content-Type', 'ETag'],
        MaxAgeSeconds: 86400
      }
    ]
  };

  const bucketsToConfigure = ['server-3a', 'serverbuket-12'];

  try {
    const listRes = await s3.send(new ListBucketsCommand({}));
    if (listRes.Buckets) {
      listRes.Buckets.forEach(b => {
        if (!bucketsToConfigure.includes(b.Name)) {
          bucketsToConfigure.push(b.Name);
        }
      });
    }
  } catch (e) {
    console.warn("Could not list all buckets, using target list:", e.message);
  }

  for (const bucketName of bucketsToConfigure) {
    console.log(`Setting CORS configuration on bucket: ${bucketName}...`);
    try {
      const command = new PutBucketCorsCommand({
        Bucket: bucketName,
        CORSConfiguration: corsConfiguration
      });
      await s3.send(command);
      console.log(`🎉 SUCCESS! CORS policy applied to S3 bucket '${bucketName}'!`);
    } catch (err) {
      console.error(`⚠️ Could not set CORS on bucket '${bucketName}':`, err.message);
    }
  }

  // Also check if URLs in DB use serverbuket-12 vs server-3a and fix bucket domain if server-3a is the active bucket
  const activeBucket = process.env.AWS_S3_BUCKET || 'server-3a';
  console.log(`\nChecking DB URLs alignment with active bucket: ${activeBucket}...`);

  const episodes = await prisma.episode.findMany();
  for (const ep of episodes) {
    if (ep.videoUrl && ep.videoUrl.includes('serverbuket-12')) {
      const newUrl = ep.videoUrl.replace('serverbuket-12', activeBucket);
      console.log(`Updating Episode #${ep.id} videoUrl -> ${newUrl}`);
      await prisma.episode.update({
        where: { id: ep.id },
        data: { videoUrl: newUrl }
      });
    }
  }

  const shows = await prisma.show.findMany();
  for (const show of shows) {
    let updateData = {};
    if (show.poster && show.poster.includes('serverbuket-12')) {
      updateData.poster = show.poster.replace('serverbuket-12', activeBucket);
    }
    if (show.banner && show.banner.includes('serverbuket-12')) {
      updateData.banner = show.banner.replace('serverbuket-12', activeBucket);
    }
    if (Object.keys(updateData).length > 0) {
      console.log(`Updating Show #${show.id} image URLs ->`, updateData);
      await prisma.show.update({
        where: { id: show.id },
        data: updateData
      });
    }
  }
}

main().finally(() => prisma.$disconnect());
