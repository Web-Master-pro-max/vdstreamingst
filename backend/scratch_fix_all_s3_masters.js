const { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const dotenv = require('dotenv');
dotenv.config();

const s3 = new S3Client({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

async function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
}

async function fixMaster(key) {
  try {
    const getRes = await s3.send(new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key
    }));
    const text = await streamToString(getRes.Body);
    
    // Check if contains SUBTITLES="subs" or invalid subtitle renditions
    if (text.includes('SUBTITLES="subs"') || text.includes('TYPE=SUBTITLES')) {
      console.log(`Fixing ${key}...`);
      const lines = text.split('\n');
      const cleanLines = [];
      for (const line of lines) {
        const l = line.trim();
        if (l.startsWith('#EXT-X-MEDIA:TYPE=SUBTITLES')) {
          // Skip raw vtt subtitle media tags from HLS manifest to avoid ExoPlayer ParserException
          continue;
        }
        if (l.startsWith('#EXT-X-STREAM-INF:')) {
          cleanLines.push(l.replace(/,SUBTITLES="[^"]+"/, ''));
          continue;
        }
        cleanLines.push(line);
      }
      const newText = cleanLines.join('\n');
      await s3.send(new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        Body: newText,
        ContentType: 'application/x-mpegURL',
        ACL: 'public-read'
      }));
      console.log(`Successfully updated ${key}`);
    } else {
      console.log(`${key} is already clean.`);
    }
  } catch (err) {
    console.error(`Error fixing ${key}:`, err.message);
  }
}

async function main() {
  const masterKeys = [
    'videos/show_28/ep_381/master.m3u8',
    'videos/show_22/ep_406/master.m3u8',
    'videos/show_22/ep_407/master.m3u8',
    'videos/show_22/ep_408/master.m3u8',
    'videos/show_22/ep_409/master.m3u8',
    'videos/show_22/ep_410/master.m3u8',
    'videos/show_22/ep_411/master.m3u8',
  ];

  for (const k of masterKeys) {
    await fixMaster(k);
  }
}

main();
