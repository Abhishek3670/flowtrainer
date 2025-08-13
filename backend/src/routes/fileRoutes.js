const express = require('express');
const router = express.Router();
const {
  uploadVideo,
  getFiles,
  getFile,
  deleteFile,
  serveVideo
} = require('../controllers/fileController');

// POST /api/files/upload - Upload video file
router.post('/upload', uploadVideo);

// GET /api/files - Get all files
router.get('/', getFiles);

// GET /api/files/:id - Get single file metadata
router.get('/:id', getFile);

// GET /api/files/:id/stream - Serve/stream video file
router.get('/:id/stream', serveVideo);

// DELETE /api/files/:id - Delete file
router.delete('/:id', deleteFile);

module.exports = router;
