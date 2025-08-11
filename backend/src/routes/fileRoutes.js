const express = require('express');
const router = express.Router();

// Debug utility function
const debugLog = (component, action, data) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${component}] ${action}`, data || '');
};

const {
  uploadVideo,
  getFiles,
  getFile,
  deleteFile,
  serveVideo
} = require('../controllers/fileController');

debugLog('FileRoutes', 'Setting up file routes');

// POST /api/files/upload - Upload video file
router.post('/upload', (req, res, next) => {
  debugLog('FileRoutes', 'POST /upload - uploadVideo called', { 
    hasFile: !!req.file,
    fileSize: req.file?.size,
    fileName: req.file?.originalname,
    fileType: req.file?.mimetype
  });
  uploadVideo(req, res, next);
});

// GET /api/files - Get all files
router.get('/', (req, res, next) => {
  debugLog('FileRoutes', 'GET / - getFiles called', { 
    query: req.query 
  });
  getFiles(req, res, next);
});

// GET /api/files/:id - Get single file metadata
router.get('/:id', (req, res, next) => {
  debugLog('FileRoutes', 'GET /:id - getFile called', { 
    id: req.params.id 
  });
  getFile(req, res, next);
});

// GET /api/files/:id/stream - Serve/stream video file
router.get('/files/stream/:id', (req, res, next) => {
  debugLog('FileRoutes', 'GET /files/stream/:id - serveVideo called', { 
    id: req.params.id,
    range: req.headers.range
  });
  serveVideo(req, res, next);
});

// DELETE /api/files/:id - Delete file
router.delete('/:id', (req, res, next) => {
  debugLog('FileRoutes', 'DELETE /:id - deleteFile called', { 
    id: req.params.id 
  });
  deleteFile(req, res, next);
});

debugLog('FileRoutes', 'File routes setup completed');

module.exports = router;
