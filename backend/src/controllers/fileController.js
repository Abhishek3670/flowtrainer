const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
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
        'video/mp4v-es',
        'application/octet-stream',
        'video/x-m4v'
    ];

    const allowedExtensions = ['.mp4', '.mov', '.avi', '.m4v'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    const mimeTypeAllowed = allowedMimeTypes.includes(file.mimetype);
    const extensionAllowed = allowedExtensions.includes(fileExtension);
    
    console.log('MIME type allowed:', mimeTypeAllowed);
    console.log('Extension allowed:', extensionAllowed);

    if (mimeTypeAllowed || extensionAllowed) {
        console.log('✅ File accepted');
        cb(null, true);
    } else {
        console.log('❌ File rejected');
        cb(new Error('Only video files (MP4, MOV, AVI) are allowed'));
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 500 * 1024 * 1024 // 500MB limit
    }
}).single('video');

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

            console.log('File uploaded successfully:', req.file);

            // Generate a unique fileId
            const fileId = uuidv4();

            // Save file metadata to database
            const fileRecord = new File({
                fileId: fileId,  // Set the required fileId
                filename: req.file.filename,
                originalName: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                path: req.file.path,
                status: 'processing' // Will be updated after video processing
            });

            console.log('Saving file record:', fileRecord);
            const savedFile = await fileRecord.save();
            console.log('File record saved:', savedFile);

            // TODO: Process video for metadata (duration, resolution, etc.)
            // For now, mark as ready
            savedFile.status = 'ready';
            await savedFile.save();

            console.log('File marked as ready, sending response');

            res.status(201).json({
                success: true,
                message: 'Video uploaded successfully',
                data: {
                    _id: savedFile._id,
                    fileId: savedFile.fileId,
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
        console.error('Error uploading file:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload file',
            error: error.message
        });
    }
};

// Get all files
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
            .select('_id fileId filename originalName size mimetype status uploadedAt')
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
        let query;
        const id = req.params.id;

        // Check if the ID is a valid ObjectId
        if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
            query = { _id: id };
        } else {
            // Otherwise search by fileId
            query = { fileId: id };
        }

        const file = await File.findOne(query);

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

        // Delete physical file
        try {
            await fs.unlink(file.path);
            console.log('Physical file deleted:', file.path);
        } catch (err) {
            console.warn('Could not delete physical file:', err.message);
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

// Serve video file for streaming
const serveVideo = async (req, res) => {
    try {
        const id = req.params.id;
        let query;

        console.log('=== VIDEO STREAMING DEBUG ===');
        console.log('Requested ID:', id);

        // Check if the ID is a valid ObjectId
        if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
            console.log('Searching by ObjectId (_id)');
            query = { _id: id };
        } else {
            console.log('Searching by fileId');
            query = { fileId: id };
        }

        const file = await File.findOne(query);

        if (!file) {
            console.log('File not found in database');
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        console.log('File found:', { 
            fileId: file.fileId, 
            filename: file.filename, 
            path: file.path 
        });

        const videoPath = file.path;
        
        // Check if file exists on disk
        try {
            await fs.access(videoPath);
            console.log('Video file exists on disk:', videoPath);
        } catch {
            console.log('Video file not found on disk:', videoPath);
            return res.status(404).json({
                success: false,
                message: 'Video file not found on disk'
            });
        }

        const stat = await fs.stat(videoPath);
        const fileSize = stat.size;
        const range = req.headers.range;

        console.log('File size:', fileSize, 'Range requested:', range);

        if (range) {
            // Handle range requests for video streaming
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;
            
            console.log('Range request:', { start, end, chunksize });
            
            const streamOptions = {
                start: start,
                end: end
            };
            
            const stream = require('fs').createReadStream(videoPath, streamOptions);
            
            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': file.mimetype || 'video/mp4',
            });
            
            stream.pipe(res);
        } else {
            // Serve entire file
            console.log('Serving entire file');
            res.writeHead(200, {
                'Content-Length': fileSize,
                'Content-Type': file.mimetype || 'video/mp4',
            });
            
            const stream = require('fs').createReadStream(videoPath);
            stream.pipe(res);
        }
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
