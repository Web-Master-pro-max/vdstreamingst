const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const dotenv = require('dotenv');
dotenv.config();

const s3 = new S3Client({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

// Master playlist with ONLY audio and video - NO SUBTITLE tags in the HLS manifest
const masterM3u8 = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-INDEPENDENT-SEGMENTS

#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="Hindi",LANGUAGE="hin",DEFAULT=YES,AUTOSELECT=YES,URI="audio0.m3u8"
#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="English",LANGUAGE="eng",DEFAULT=NO,AUTOSELECT=YES,URI="audio1.m3u8"

#EXT-X-STREAM-INF:BANDWIDTH=2000000,AUDIO="audio"
video.m3u8
`;

async function run() {
  const cmd = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: 'videos/show_28/ep_381/master.m3u8',
    Body: masterM3u8,
    ContentType: 'application/x-mpegURL',
    ACL: 'public-read'
  });
  await s3.send(cmd);
  console.log('Uploaded master without any subtitle tag!');
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
