import { Request, Response } from 'express';
import { inject } from 'inversify';
import { controller, httpGet, httpPost, httpDelete } from 'inversify-express-utils';
import { IFileService } from '../services/interfaces/IFileService';
import { TYPES } from '../types';
import { AuthenticatedRequest } from '../types';

@controller('/api/files')
export class FileController {
    constructor(
        @inject(TYPES.FileService) private fileService: IFileService
    ) {}

    @httpGet('/')
    async getFiles(req: Request, res: Response): Promise<void> {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const filters = {
                status: req.query.status as string,
                mimetype: req.query.mimetype as string
            };

            const result = await this.fileService.getFiles(page, limit, filters);
            res.json({
                success: true,
                data: {
                    files: result.files,
                    pagination: {
                        current: page,
                        total: Math.ceil(result.total / limit),
                        count: result.files.length,
                        totalItems: result.total
                    }
                }
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch files',
                error: error.message
            });
        }
    }

    @httpGet('/:id')
    async getFile(req: Request, res: Response): Promise<void> {
        try {
            const file = await this.fileService.getFileById(req.params.id);
            if (!file) {
                res.status(404).json({
                    success: false,
                    message: 'File not found'
                });
                return;
            }
            res.json({
                success: true,
                data: file
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch file',
                error: error.message
            });
        }
    }

    @httpGet('/:id/metadata')
    async getFileMetadata(req: Request, res: Response): Promise<void> {
        try {
            const file = await this.fileService.getFileById(req.params.id);
            if (!file) {
                res.status(404).json({
                    success: false,
                    message: 'File not found'
                });
                return;
            }
            res.json({
                success: true,
                data: {
                    _id: file._id,
                    filename: file.filename,
                    size: file.size,
                    mimetype: file.mimetype,
                    status: file.status,
                    createdAt: file.createdAt
                }
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch file metadata',
                error: error.message
            });
        }
    }

    @httpGet('/:id/stream')
    async streamFile(req: Request, res: Response): Promise<void> {
        return this.streamVideo(req, res);
    }

    @httpPost('/:id/thumbnail')
    async generateThumbnail(req: Request, res: Response): Promise<void> {
        try {
            const thumbnail = await this.fileService.generateThumbnail(req.params.id);
            if (!thumbnail) {
                res.status(404).json({
                    success: false,
                    message: 'File not found or thumbnail generation failed'
                });
                return;
            }
            res.json({
                success: true,
                data: thumbnail
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Failed to generate thumbnail',
                error: error.message
            });
        }
    }

    @httpPost('/upload')
    async uploadFile(req: Request, res: Response): Promise<void> {
        try {
            const upload = this.fileService.getUploadMiddleware().single('video');
            
            await new Promise<void>((resolve, reject) => {
                upload(req, res, async (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            if (!req.file) {
                res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
                return;
            }

            const savedFile = await this.fileService.handleUploadedFile(req.file);
            res.status(201).json({
                success: true,
                message: 'Video uploaded successfully',
                data: {
                    _id: savedFile._id,
                    fileId: savedFile.fileId,
                    filename: savedFile.filename,
                    originalName: savedFile.originalname,
                    size: savedFile.size,
                    mimetype: savedFile.mimetype,
                    status: savedFile.status,
                    uploadedAt: savedFile.createdAt
                }
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Failed to upload file',
                error: error.message
            });
        }
    }

    @httpGet('/:id/stream')
    async streamVideo(req: Request, res: Response): Promise<void> {
        try {
            const range = req.headers.range;
            const result = await this.fileService.streamVideo(req.params.id, range);
            
            if (!result) {
                res.status(404).json({
                    success: false,
                    message: 'File not found'
                });
                return;
            }

            res.writeHead(result.statusCode, result.headers);
            result.stream.pipe(res);
        } catch (error: any) {
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    message: 'Failed to stream video',
                    error: error.message
                });
            }
        }
    }

    @httpDelete('/:id')
    async deleteFile(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            if (!req.user?.userId) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }

            const success = await this.fileService.deleteFile(req.params.id, req.user.userId);
            if (!success) {
                res.status(404).json({
                    success: false,
                    message: 'File not found or unauthorized'
                });
                return;
            }
            res.json({
                success: true,
                message: 'File deleted successfully'
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Failed to delete file',
                error: error.message
            });
        }
    }
}