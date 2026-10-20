import path from 'path';
import multer from 'multer';
import { storageService } from '../config/storage.js';
import { jobQueue } from '../jobs/jobQueue.js';

// Strict allowed folders to prevent directory traversal
const ALLOWED_FOLDERS = ['products', 'categories', 'banners', 'documents', 'inquiries'];

// Magic bytes validation for true binary inspection
const validateMagicBytes = (buffer, mimetype) => {
  if (!buffer || buffer.length < 4) return false;

  // JPEG: FF D8 FF
  if (mimetype === 'image/jpeg' || mimetype === 'image/jpg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  // PNG: 89 50 4E 47
  if (mimetype === 'image/png') {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    );
  }

  // WebP: RIFF ... WEBP
  if (mimetype === 'image/webp') {
    const isRiff =
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46;
    if (buffer.length >= 12) {
      const isWebp =
        buffer[8] === 0x57 &&
        buffer[9] === 0x45 &&
        buffer[10] === 0x42 &&
        buffer[11] === 0x50;
      return isRiff && isWebp;
    }
    return isRiff;
  }

  // PDF: %PDF (25 50 44 46)
  if (mimetype === 'application/pdf') {
    return (
      buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46
    );
  }

  return false;
};

// Multer memory configuration with strict size and extension filters
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10,
  },
  fileFilter: (req, file, cb) => {
    // Strictly disallow SVG (XSS vector), allow only safe binary images and PDFs
    const allowedExtensions = /jpeg|jpg|png|webp|pdf/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const isAllowedExt = allowedExtensions.test(ext);

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const isAllowedMime = allowedMimes.includes(file.mimetype.toLowerCase());

    if (isAllowedExt && isAllowedMime) {
      cb(null, true);
    } else {
      cb(
        new Error(
          'Invalid file type. Only secure raster images (JPEG, PNG, WebP) and PDFs are permitted.'
        )
      );
    }
  },
});

export const uploadMiddleware = upload.single('file');
export const uploadMultipleMiddleware = upload.array('files', 10);

export const uploadController = {
  getInfo: (req, res) => {
    res.json({
      success: true,
      provider: storageService.getProvider(),
      maxFileSize: '10MB',
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      allowedFolders: ALLOWED_FOLDERS,
    });
  },

  // POST /api/uploads (single file - Admin protected)
  uploadSingle: async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No valid file provided in form-data field "file"',
        });
      }

      // Verify file signature
      if (!validateMagicBytes(req.file.buffer, req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          error: 'File content signature does not match claimed MIME type.',
        });
      }

      // Sanitize folder
      const requestedFolder = (req.body.folder || 'products').toLowerCase();
      const folder = ALLOWED_FOLDERS.includes(requestedFolder) ? requestedFolder : 'products';

      const result = await storageService.uploadFile({
        buffer: req.file.buffer,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        folder,
      });

      res.status(201).json({
        success: true,
        message: 'File uploaded and verified successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/uploads/multiple (Admin protected)
  uploadMultiple: async (req, res, next) => {
    try {
      if (!req.files || !req.files.length) {
        return res.status(400).json({
          success: false,
          error: 'No files provided in form-data field "files"',
        });
      }

      const requestedFolder = (req.body.folder || 'products').toLowerCase();
      const folder = ALLOWED_FOLDERS.includes(requestedFolder) ? requestedFolder : 'products';

      for (const file of req.files) {
        if (!validateMagicBytes(file.buffer, file.mimetype)) {
          return res.status(400).json({
            success: false,
            error: `File '${file.originalname}' has invalid binary magic bytes.`,
          });
        }
      }

      const uploadPromises = req.files.map((file) =>
        storageService.uploadFile({
          buffer: file.buffer,
          originalname: file.originalname,
          mimetype: file.mimetype,
          folder,
        })
      );

      const results = await Promise.all(uploadPromises);

      res.status(201).json({
        success: true,
        message: `${results.length} files uploaded and verified successfully`,
        data: results,
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/uploads/presigned (Admin protected)
  getPresignedUrl: async (req, res, next) => {
    try {
      const { filename, mimetype } = req.body;

      if (!filename || !mimetype) {
        return res.status(400).json({
          success: false,
          error: 'filename and mimetype are required',
        });
      }

      const requestedFolder = (req.body.folder || 'products').toLowerCase();
      const folder = ALLOWED_FOLDERS.includes(requestedFolder) ? requestedFolder : 'products';

      const presignedData = await storageService.getPresignedUploadUrl({
        filename,
        mimetype,
        folder,
      });

      res.json({
        success: true,
        data: presignedData,
      });
    } catch (err) {
      next(err);
    }
  },

  // DELETE /api/uploads (Admin protected)
  deleteFile: async (req, res, next) => {
    try {
      const { key } = req.body;
      if (!key || typeof key !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Valid storage key is required',
        });
      }

      // Prevent path traversal
      const normalizedKey = path.normalize(key).replace(/^(\.\.(\/|\\|$))+/, '');
      if (normalizedKey.includes('..') || path.isAbsolute(normalizedKey)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid storage key format',
        });
      }

      const deleted = await storageService.deleteFile(normalizedKey);

      if (deleted) {
        jobQueue.enqueue('recordAuditLog', {
          userId: req.user?.id,
          userEmail: req.user?.email,
          action: 'DELETE_FILE',
          entityType: 'file',
          entityId: normalizedKey,
          details: { key: normalizedKey },
          ipAddress: req.ip,
          clientPlatform: req.clientPlatform,
        });
      }

      res.json({
        success: true,
        message: deleted ? 'File deleted successfully' : 'File not found or already deleted',
      });
    } catch (err) {
      next(err);
    }
  },
};
