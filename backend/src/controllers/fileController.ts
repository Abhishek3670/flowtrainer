import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import mongoose, { Document, FilterQuery, Model } from 'mongoose';
import { Request, Response } from 'express';

interface IFile extends Document {
    fileId: string;
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    path: string;
    status: 'processing' | 'ready' | 'failed';
    createdAt: Date;
    updatedAt: Date;
}

// Assume 'File' is a Mongoose model of type IFile
const File: Model<IFile> = require('../models/File');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
        const uploadDir = path.join(__dirname, '../../uploads/videos');
        try {
            await fsPromises.access(uploadDir);
        } catch {
            await fsPromises.mkdir(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
        const fileExtension = path.extname(file.originalname);
        const uniqueFilename = `${uuidv4()}${fileExtension}`;
        cb(null, uniqueFilename);
    }
});

// File validation
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
    console.log('=== FILE UPLOAD DEBUG ===');
    console.log('Original filename:', file.originalname);
    console.log('Detected MIME type:', file.mimetype);
    console.log('File extension:', path.extname(file.originalname));

    const allowedMimeTypes: string[] = [
        'video/mp4', 'video/avi', 'video/mov', 'video/quicktime',
        'video/x-msvideo', 'video/x-quicktime', 'video/mp4v-es',
        'application/octet-stream', 'video/x-m4v'
    ];
    const allowedExtensions: string[] = ['.mp4', '.mov', '.avi', '.m4v'];
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

export const uploadVideo = (req: Request, res: Response): void => {
    try {
        upload(req, res, async (err: any) => {
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
                return res.status(400).json({ success: false, message: err.message });
            }

            if (!req.file) {
                return res.status(400).json({ success: false, message: 'No file uploaded' });
            }

            console.log('File uploaded successfully:', req.file);

            const fileId = uuidv4();

            const fileRecord = new File({
                fileId: fileId,
                filename: req.file.filename,
                originalName: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                path: req.file.path,
                status: 'processing'
            });

            console.log('Saving file record:', fileRecord);
            const savedFile = await fileRecord.save();
            console.log('File record saved:', savedFile);

            savedFile.status = 'ready';
            await savedFile.save();

            console.log('File marked as ready, sending response');

            return res.status(201).json({
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
    } catch (error: any) {
        console.error('Error uploading file:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload file',
            error: error.message
        });
    }
};

export const getFiles = async (req: Request, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const status = req.query.status as string;
        const mimetype = req.query.mimetype as string;

        const query: FilterQuery<IFile> = {};
        if (status) query.status = status;
        if (mimetype) query.mimetype = mimetype;

        const files = await File.find(query)
            .select('_id fileId filename originalName size mimetype status createdAt')
            .sort({ createdAt: -1 })
            .limit(limit)
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
    } catch (error: any) {
        console.error('Error fetching files:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch files',
            error: error.message
        });
    }
};

export const getFile = async (req: Request, res: Response): Promise<Response | void> => {
    try {
        let query: FilterQuery<IFile>;
        const id = req.params.id;

        if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
            query = { _id: id };
        } else {
            query = { fileId: id };
        }

        const file = await File.findOne(query);

        if (!file) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }

        res.json({ success: true, data: file });
    } catch (error: any) {
        console.error('Error fetching file:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch file',
            error: error.message
        });
    }
};

export const deleteFile = async (req: Request, res: Response): Promise<Response | void> => {
    try {
        const file = await File.findById(req.params.id);
        
        if (!file) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }

        try {
            await fsPromises.unlink(file.path);
            console.log('Physical file deleted:', file.path);
        } catch (err: any) {
            console.warn('Could not delete physical file:', err.message);
        }

        await File.findByIdAndDelete(req.params.id);

        res.json({ success: true, message: 'File deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting file:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete file',
            error: error.message
        });
    }
};

export const serveVideo = async (req: Request, res: Response): Promise<Response | void> => {
    try {
        const id = req.params.id;
        let query: FilterQuery<IFile>;

        console.log('=== VIDEO STREAMING DEBUG ===');
        console.log('Requested ID:', id);

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
            return res.status(404).json({ success: false, message: 'File not found' });
        }

        console.log('File found:', { fileId: file.fileId, filename: file.filename, path: file.path });

        const videoPath = file.path;
        
        try {
            await fsPromises.access(videoPath);
            console.log('Video file exists on disk:', videoPath);
        } catch {
            console.log('Video file not found on disk:', videoPath);
            return res.status(404).json({ success: false, message: 'Video file not found on disk' });
        }

        const stat = await fsPromises.stat(videoPath);
        const fileSize = stat.size;
        const range = req.headers.range;

        console.log('File size:', fileSize, 'Range requested:', range);

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;
            
            console.log('Range request:', { start, end, chunksize });
            
            const stream = fs.createReadStream(videoPath, { start, end });
            
            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': file.mimetype || 'video/mp4',
            });
            
            stream.pipe(res);
        } else {
            console.log('Serving entire file');
            res.writeHead(200, {
                'Content-Length': fileSize,
                'Content-Type': file.mimetype || 'video/mp4',
            });
            fs.createReadStream(videoPath).pipe(res);
        }
    } catch (error: any) {
        console.error('Error serving video:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Failed to serve video',
                error: error.message
            });
        }
    }
};