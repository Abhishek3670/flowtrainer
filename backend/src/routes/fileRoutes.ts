import express, { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate } from '../middleware/auth';
import { cacheMiddleware } from '../middleware/cache';
import { CacheService } from '../cache/redis';
import { container } from '../container';
import { FileController } from '../controllers';
import { TYPES } from '../types';

const router: Router = express.Router();
const fileController = container.get<FileController>(TYPES.FileController);
const cache = CacheService.getInstance();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename: (req, file, cb) => {
    // Let the FileService handle the actual file naming
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  }
});

// Apply authentication middleware to all routes except streaming
router.use((req, res, next) => {
    if (!req.path.endsWith('/stream')) {
        return authenticate(req, res, next);
    }
    next();
});

// --- CACHED ROUTES ---

// Cache file metadata for 300 seconds (5 min)
router.get('/:id/metadata', cacheMiddleware(300), (req, res) => fileController.getFileMetadata(req, res));

// --- ROUTES WITH CACHE INVALIDATION ---

// Middleware for cache invalidation
const invalidateFilesCache = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await cache.invalidate('GET:/api/files*');
    console.log('🧹 Cache invalidated for pattern: /api/files*');
  } catch (err) {
    console.warn('⚠️ Cache invalidation failed:', err);
  }
  next();
};

// File upload
router.post('/upload', invalidateFilesCache, upload.single('file'), (req, res) => 
  fileController.uploadFile(req, res)
);

// Delete file
router.delete('/:id', invalidateFilesCache, (req, res) => 
  fileController.deleteFile(req, res)
);

// Generate thumbnail (for images)
router.post('/:id/thumbnail', (req, res) => 
  fileController.generateThumbnail(req, res)
);

// --- NON-CACHED ROUTES ---

// Stream file (no auth required for public access)
router.get('/:id/stream', (req, res) => 
  fileController.streamFile(req, res)
);

export = router;
