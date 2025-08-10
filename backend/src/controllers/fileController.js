const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const File = require('../models/File');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/videos');
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname);
    const uniqueFilename = `${uuidv4()}${fileExtension}`;
    cb(null, uniqueFilename);
  }
});

// File validation
const fileFilter = (req, file, cb) => {
  console.log('=== FILE UPLOAD DEBUG ===');
  console.log('Original filename:', file.originalname);
  console.log('Detected MIME type:', file.mimetype);
  console.log('File extension:', path.extname(file.originalname));

  const allowedMimeTypes = [
    'video/mp4',
    'video/avi', 
    'video/mov',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-quicktime',
    'video/mp4v-es'  
  ];
  
 // Also allow based on file extension as fallback
  const allowedExtensions = ['.mp4', '.avi', '.mov', '.MOV'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  const isMimeTypeAllowed = allowedMimeTypes.includes(file.mimetype);
  const isExtensionAllowed = allowedExtensions.includes(fileExtension);
  
  console.log('MIME type allowed:', isMimeTypeAllowed);
  console.log('Extension allowed:', isExtensionAllowed);
  
  if (isMimeTypeAllowed || isExtensionAllowed) {
    console.log('✅ File accepted');
    cb(null, true);
  } else {
    console.log('❌ File rejected');
    console.log('Allowed MIME types:', allowedMimeTypes);
    console.log('Allowed extensions:', allowedExtensions);
    cb(new Error(`Invalid file type. Detected: ${file.mimetype}. Allowed types: ${allowedMimeTypes.join(', ')}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  }
}).single('video');

// Upload video file
const uploadVideo = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size is 500MB.'
          });
        }
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      // Save file metadata to database
      const fileRecord = new File({
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        status: 'processing' // Will be updated after video processing
      });

      const savedFile = await fileRecord.save();

      // TODO: Process video for metadata (duration, resolution, etc.)
      // For now, mark as ready
      savedFile.status = 'ready';
      await savedFile.save();

      res.status(201).json({
        success: true,
        message: 'Video uploaded successfully',
        data: {
          _id: savedFile._id,
          fileId: savedFile._id,
          filename: savedFile.filename,
          originalName: savedFile.originalName,
          size: savedFile.size,
          mimetype: savedFile.mimetype,
          status: savedFile.status,
          uploadedAt: savedFile.createdAt
        }
      });
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload video',
      error: error.message
    });
  }
};

// Get all uploaded files
const getFiles = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10,
      status,
      mimetype 
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (mimetype) query.mimetype = mimetype;

    const files = await File.find(query)
      .select('_id filename originalName size mimetype status duration resolution createdAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await File.countDocuments(query);

    res.json({
      success: true,
      data: {
        files,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: files.length,
          totalItems: total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch files',
      error: error.message
    });
  }
};

// Get single file
const getFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.json({
      success: true,
      data: file
    });
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch file',
      error: error.message
    });
  }
};

// Delete file
const deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Delete file from filesystem
    try {
      await fs.unlink(file.path);
      if (file.thumbnailPath) {
        await fs.unlink(file.thumbnailPath);
      }
    } catch (fsError) {
      console.warn('File not found on filesystem:', fsError.message);
    }

    // Delete from database
    await File.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file',
      error: error.message
    });
  }
};

// Serve video file
const serveVideo = async (req, res) => {
  try {
    console.log('=== SERVE VIDEO DEBUG ===');
    console.log('Request params:', req.params);
    console.log('File ID received:', req.params.id);
    console.log('File ID type:', typeof req.params.id);
    
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Invalid file ID provided'
      });
    }

    const file = await File.findById(req.params.id);
    
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check if file exists on filesystem
    try {
      await fs.access(file.path);
    } catch {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Set appropriate headers for video streaming
    res.setHeader('Content-Type', file.mimetype);
    res.setHeader('Content-Length', file.size);
    res.setHeader('Accept-Ranges', 'bytes');
    
    // Send file
    res.sendFile(path.resolve(file.path));
  } catch (error) {
    console.error('Error serving video:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to serve video',
      error: error.message
    });
  }
};


module.exports = {
  uploadVideo,
  getFiles,
  getFile,
  deleteFile,
  serveVideo
};
