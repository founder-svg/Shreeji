import fs from 'fs';
import path from 'path';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { config } from './env.js';

let s3Client = null;

// Initialize S3 / Cloudflare R2 / Supabase Storage client if configured
if (
  config.storageProvider !== 'local' &&
  config.s3.accessKeyId &&
  config.s3.secretAccessKey
) {
  const s3Config = {
    region: config.s3.region || 'auto',
    credentials: {
      accessKeyId: config.s3.accessKeyId,
      secretAccessKey: config.s3.secretAccessKey,
    },
  };

  // If using Cloudflare R2, Supabase S3 endpoint or custom S3 provider
  if (config.s3.endpoint) {
    s3Config.endpoint = config.s3.endpoint;
  }

  try {
    s3Client = new S3Client(s3Config);
    console.log(`☁️ [Storage] Initialized Cloud Storage provider: ${config.storageProvider.toUpperCase()}`);
  } catch (err) {
    console.error('⚠️ [Storage] S3 initialization failed, falling back to local storage:', err.message);
  }
} else {
  console.log('📁 [Storage] Using Local File Storage (server/uploads). Cloud storage credentials can be configured in .env');
}

/**
 * Cloud Storage Service
 */
export const storageService = {
  getProvider: () => (s3Client ? config.storageProvider : 'local'),

  /**
   * Upload file buffer to Cloud Storage or Local Disk
   */
  uploadFile: async ({ buffer, originalname, mimetype, folder = 'products' }) => {
    const ext = path.extname(originalname);
    const uniqueFilename = `${folder}/${Date.now()}-${uuidv4().slice(0, 8)}${ext}`;

    // 1. Cloud Storage (AWS S3, Cloudflare R2, Supabase)
    if (s3Client) {
      const command = new PutObjectCommand({
        Bucket: config.s3.bucket,
        Key: uniqueFilename,
        Body: buffer,
        ContentType: mimetype,
      });

      await s3Client.send(command);

      // Determine public URL
      let fileUrl;
      if (config.s3.publicUrl) {
        fileUrl = `${config.s3.publicUrl.replace(/\/$/, '')}/${uniqueFilename}`;
      } else if (config.s3.endpoint) {
        fileUrl = `${config.s3.endpoint.replace(/\/$/, '')}/${config.s3.bucket}/${uniqueFilename}`;
      } else {
        fileUrl = `https://${config.s3.bucket}.s3.${config.s3.region}.amazonaws.com/${uniqueFilename}`;
      }

      return {
        key: uniqueFilename,
        url: fileUrl,
        provider: config.storageProvider,
        size: buffer.length,
        mimetype,
      };
    }

    // 2. Local Disk Fallback
    const targetFolder = path.join(config.uploadsDir, folder);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    const localFilePath = path.join(config.uploadsDir, uniqueFilename);
    fs.writeFileSync(localFilePath, buffer);

    const relativeUrl = `/uploads/${uniqueFilename.replace(/\\/g, '/')}`;

    return {
      key: uniqueFilename,
      url: relativeUrl,
      provider: 'local',
      size: buffer.length,
      mimetype,
    };
  },

  /**
   * Generate Presigned Upload URL for fast client-side direct uploads to Cloudflare R2 / S3
   */
  getPresignedUploadUrl: async ({ filename, mimetype, folder = 'uploads', expiresIn = 300 }) => {
    if (!s3Client) {
      return {
        supported: false,
        message: 'Presigned URLs require S3/R2 cloud storage configuration in .env. Use POST /api/uploads directly for local mode.',
      };
    }

    const ext = path.extname(filename);
    const key = `${folder}/${Date.now()}-${uuidv4().slice(0, 8)}${ext}`;

    const command = new PutObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
      ContentType: mimetype,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
    const publicUrl = config.s3.publicUrl
      ? `${config.s3.publicUrl.replace(/\/$/, '')}/${key}`
      : `${config.s3.endpoint}/${config.s3.bucket}/${key}`;

    return {
      supported: true,
      uploadUrl,
      publicUrl,
      key,
      expiresIn,
    };
  },

  /**
   * Delete file from storage
   */
  deleteFile: async (key) => {
    if (s3Client) {
      const command = new DeleteObjectCommand({
        Bucket: config.s3.bucket,
        Key: key,
      });
      await s3Client.send(command);
      return true;
    }

    const localFilePath = path.join(config.uploadsDir, key);
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
      return true;
    }
    return false;
  },
};
