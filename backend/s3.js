const path = require('path');
const fs = require('fs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

function getUploadsDir(customOverride) {
  const custom = customOverride || process.env.LOCAL_STORAGE_PATH;
  if (custom && custom.trim()) {
    const resolved = path.resolve(custom.trim());
    if (!fs.existsSync(resolved)) {
      try {
        fs.mkdirSync(resolved, { recursive: true });
      } catch (e) {
        console.warn('Could not create custom storage directory:', e.message);
      }
    }
    return resolved;
  }
  return fs.existsSync('/app/uploads') ? '/app/uploads' : path.join(__dirname, '../uploads');
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function uploadToS3(key, buffer, mimeType, storageTypeOverride, storagePathOverride) {
  const storageType = (storageTypeOverride || process.env.STORAGE_TYPE || 'local').toLowerCase().trim();

  // If storage type is 'local' (default for laptop server), save directly to disk
  if (storageType !== 's3') {
    const uploadsDir = getUploadsDir(storagePathOverride);
    const cleanKey = key.replace(/^[/\\]+/, '');
    const targetPath = path.join(uploadsDir, cleanKey);
    const targetFolder = path.dirname(targetPath);

    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    fs.writeFileSync(targetPath, buffer);
    console.log(`[Storage] Saved file locally to disk: ${targetPath}`);
    return `/uploads/${cleanKey.replace(/\\/g, '/')}`;
  }

  // AWS S3 upload mode
  const bucket = process.env.AWS_S3_BUCKET || 'serverbuket-12';
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  });

  await s3Client.send(command);
  const region = process.env.AWS_REGION || 'ap-south-1';
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

module.exports = {
  s3Client,
  uploadToS3,
  getUploadsDir,
};

