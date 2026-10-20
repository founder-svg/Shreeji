import multer from 'multer';
import { storageService } from '../config/storage.js';

// Setup multer in-memory storage for high-speed streaming directly to cloud or disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allowed file types: images and PDFs
    const allowed = /jpeg|jpg|png|webp|gif|svg|pdf/;
    const isMimetype = allowed.test(file.mimetype.toLowerCase());
    if (isMimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image and PDF files (jpeg, jpg, png, webp, gif, svg, pdf) are allowed'));
    }
  },
});

export const uploadMiddleware = upload.single('file');
export const uploadMultipleMiddleware = upload.array('files', 10);

export const uploadController = {
  // GET /api/uploads/info
  getInfo: (req, res) => {
    res.json({
      success: true,
      provider: storageService.getProvider(),
      maxFileSize: '15MB',
      supportedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/pdf'],
    });
  },

  // POST /api/uploads (single file)
  uploadSingle: async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file provided in form-data field "file"',
        });
      }

      const folder = req.body.folder || 'products';
      const result = await storageService.uploadFile({
        buffer: req.file.buffer,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        folder,
      });

      res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/uploads/multiple (up to 10 files)
  uploadMultiple: async (req, res, next) => {
    try {
      if (!req.files || !req.files.length) {
        return res.status(400).json({
          success: false,
          error: 'No files provided in form-data field "files"',
        });
      }

      const folder = req.body.folder || 'products';
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
        message: `${results.length} files uploaded successfully`,
        data: results,
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/uploads/presigned (for direct client-side S3/Cloudflare R2 uploads)
  getPresignedUrl: async (req, res, next) => {
    try {
      const { filename, mimetype, folder = 'products' } = req.body;

      if (!filename || !mimetype) {
        return res.status(400).json({
          success: false,
          error: 'filename and mimetype are required',
        });
      }

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

  // DELETE /api/uploads
  deleteFile: async (req, res, next) => {
    try {
      const { key } = req.body;
      if (!key) {
        return res.status(400).json({
          success: false,
          error: 'Storage key is required to delete file',
        });
      }

      const deleted = await storageService.deleteFile(key);
      res.json({
        success: true,
        message: deleted ? 'File deleted successfully' : 'File not found or already deleted',
      });
    } catch (err) {
      next(err);
    }
  },
};
