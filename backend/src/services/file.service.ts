import { inject, injectable } from 'inversify';
import { IFileService } from './interfaces/IFileService';
import { FileDocument, FileModel } from '../models/file.model';
import multer from 'multer';
import { createReadStream, promises as fsPromises, unlink } from 'fs';
import * as fs from 'fs';
import { join, extname } from 'path';
import { TYPES } from '../types';
import { Logger } from '../utils/logger';

@injectable()
export class FileService implements IFileService {
    constructor(
        @inject(TYPES.Logger) private logger: Logger
    ) {}

    async uploadFile(file: Express.Multer.File, userId: string, metadata?: Record<string, any>): Promise<{ id: string; url: string }> {
        // This is handled by handleUploadedFile now
        const savedFile = await this.handleUploadedFile(file);
        return {
            id: savedFile._id.toString(),
            url: `/api/files/${savedFile._id}/stream`
        };
    }

    async getFileMetadata(fileId: string): Promise<{
        id: string;
        name: string;
        type: string;
        size: number;
        userId: string;
        url: string;
        metadata?: Record<string, any>;
        createdAt: Date;
    } | null> {
        const file = await this.getFileById(fileId);
        if (!file) return null;

        return {
            id: file._id.toString(),
            name: file.originalname,
            type: file.mimetype,
            size: file.size,
            userId: 'legacy', // We don't track this anymore
            url: `/api/files/${file._id}/stream`,
            createdAt: file.createdAt
        };
    }

    async generateThumbnail(fileId: string): Promise<string> {
        // Not implemented in new version
        throw new Error('Thumbnail generation is not supported');
    }

    validateFileType(filename: string, allowedTypes: string[]): boolean {
        const ext = extname(filename).toLowerCase();
        return allowedTypes.includes(ext);
    }

    validateFileSize(size: number, maxSize: number): boolean {
        return size <= maxSize;
    }

    async getSignedUrl(fileId: string, expiresInSeconds: number = 3600): Promise<string> {
        // We don't use signed URLs in this implementation
        const file = await this.getFileById(fileId);
        if (!file) throw new Error('File not found');
        return `/api/files/${file._id}/stream`;
    }

    async moveFile(fileId: string, newPath: string): Promise<boolean> {
        const file = await this.getFileById(fileId);
        if (!file) return false;

        try {
            await fsPromises.rename(file.path, newPath);
            file.path = newPath;
            await file.save();
            return true;
        } catch (error) {
            this.logger.error('Error moving file:', error);
            return false;
        }
    }

    async getFiles(page = 1, limit = 10, filters: { status?: string; mimetype?: string; } = {}) {
        const query = { ...filters };
        const skip = (page - 1) * limit;

        const [files, total] = await Promise.all([
            FileModel.find(query).skip(skip).limit(limit),
            FileModel.countDocuments(query)
        ]);

        return { files, total };
    }

    async getFileById(fileId: string): Promise<FileDocument | null> {
        return FileModel.findOne({ 
            $or: [
                { _id: fileId },
                { fileId: fileId }
            ]
        });
    }

    async deleteFile(fileId: string): Promise<boolean> {
        const file = await this.getFileById(fileId);
        if (!file) return false;

        try {
            // Delete physical file
            await new Promise<void>((resolve, reject) => {
                unlink(file.path, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            // Delete database record
            await file.deleteOne();
            return true;
        } catch (error) {
            this.logger.error('Error deleting file:', error);
            return false;
        }
    }

    async streamVideo(fileId: string, range?: string) {
        const file = await this.getFileById(fileId);
        if (!file) return null;

        const videoPath = file.path;
        const stat = await new Promise<{size: number}>((resolve, reject) => {
            fs.stat(videoPath, (err: NodeJS.ErrnoException | null, stats: { size: number }) => {
                if (err) reject(err);
                else resolve(stats);
            });
        });

        const headers: Record<string, string> = {};

        if (range) {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
            const chunksize = (end - start) + 1;

            headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`;
            headers['Accept-Ranges'] = 'bytes';
            headers['Content-Length'] = chunksize.toString();
            headers['Content-Type'] = file.mimetype;

            return {
                stream: createReadStream(videoPath, { start, end }),
                headers,
                statusCode: 206
            };
        }

        headers['Content-Length'] = stat.size.toString();
        headers['Content-Type'] = file.mimetype;

        return {
            stream: createReadStream(videoPath),
            headers,
            statusCode: 200
        };
    }

    getUploadMiddleware(): multer.Multer {
        const storage = multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, join(process.cwd(), 'uploads', 'videos'));
            },
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, file.fieldname + '-' + uniqueSuffix + '.mp4');
            }
        });

        return multer({
            storage,
            fileFilter: (req, file, cb) => {
                if (file.mimetype.startsWith('video/')) {
                    cb(null, true);
                } else {
                    cb(new Error('Only video files are allowed'));
                }
            },
            limits: {
                fileSize: 1024 * 1024 * 500 // 500MB max file size
            }
        });
    }

    async handleUploadedFile(file: Express.Multer.File): Promise<FileDocument> {
        const newFile = new FileModel({
            originalname: file.originalname,
            encoding: file.encoding,
            mimetype: file.mimetype,
            destination: file.destination,
            filename: file.filename,
            path: file.path,
            size: file.size
        });

        await newFile.save();
        return newFile;
    }
}
