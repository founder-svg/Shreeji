import path from 'path';
import multer from 'multer';
import { storageService } from '../config/storage.js';
import { jobQueue } from '../jobs/jobQueue.js';

// Strict allowed folders to prevent directory traversal
const ALLOWED_FOLDERS = ['products', 'categories', 'banners', 'documents', 'inquiries', 'cad', 'videos', 'photos', 'projects'];

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

  // MP4 Video: ftyp
  if (mimetype === 'video/mp4') {
    if (buffer.length >= 12) {
      const isFtyp =
        buffer[4] === 0x66 && // f
        buffer[5] === 0x74 && // t
        buffer[6] === 0x79 && // y
        buffer[7] === 0x70;   // p
      return isFtyp;
    }
    return true;
  }

  // WebM Video: 1A 45 DF A3
  if (mimetype === 'video/webm') {
    return (
      buffer[0] === 0x1a &&
      buffer[1] === 0x45 &&
      buffer[2] === 0xdf &&
      buffer[3] === 0xa3
    );
  }

  // 3D GLB (glTF Binary): 67 6C 54 46 ('glTF')
  if (mimetype === 'model/gltf-binary' || mimetype === 'application/octet-stream') {
    if (buffer[0] === 0x67 && buffer[1] === 0x6c && buffer[2] === 0x54 && buffer[3] === 0x46) {
      return true;
    }
  }

  // AutoCAD DWG: AC (41 43)
  if (mimetype === 'image/vnd.dwg' || mimetype === 'application/acad' || mimetype === 'application/octet-stream') {
    if (buffer[0] === 0x41 && buffer[1] === 0x43) return true;
  }

  // JSON / GeoJSON / DXF ASCII check
  if (mimetype === 'application/json' || mimetype === 'application/geo+json' || mimetype === 'text/plain') {
    const firstChar = buffer.toString('utf8', 0, 50).trim();
    if (firstChar.startsWith('{') || firstChar.startsWith('[') || firstChar.includes('SECTION') || firstChar.includes('0\nSECTION')) {
      return true;
    }
  }

  return false;
};

// Multer memory configuration with size and extension filters
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for CAD & HD Video
    files: 10,
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /jpeg|jpg|png|webp|pdf|mp4|webm|json|geojson|dwg|dxf|glb|gltf/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const isAllowedExt = allowedExtensions.test(ext);

    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/webp', 'application/pdf',
      'video/mp4', 'video/webm', 'application/json', 'application/geo+json',
      'model/gltf-binary', 'application/octet-stream', 'image/vnd.dwg', 'application/dxf', 'text/plain'
    ];
    const isAllowedMime = allowedMimes.includes(file.mimetype.toLowerCase()) || file.mimetype === '';

    if (isAllowedExt) {
      cb(null, true);
    } else {
      cb(
        new Error(
          'Invalid file type. Allowed formats: Photos (JPG, PNG, WebP), Videos (MP4, WebM), CAD (DWG, DXF, GLB, GeoJSON, JSON), and PDF.'
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
      maxFileSize: '50MB',
      allowedMimeTypes: [
        'image/jpeg', 'image/png', 'image/webp', 'application/pdf',
        'video/mp4', 'video/webm', 'application/json', 'model/gltf-binary', 'application/octet-stream'
      ],
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
