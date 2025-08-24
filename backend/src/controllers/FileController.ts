import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { getFileService } from '../services';
import { FileService } from '../services/implementations/FileService';
import path from 'path';
import { createReadStream } from 'fs';

export class FileController {
  private fileService: FileService;
  private readonly UPLOAD_DIR: string;
  
  constructor() {
    this.fileService = getFileService();
    this.UPLOAD_DIR = path.join(process.cwd(), 'uploads');
  }

  // Upload file
  async uploadFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      // File upload
      const result = await this.fileService.uploadFile(req.file, userId, {
        originalName: req.file.originalname,
        description: req.body.description
      });

      res.status(201).json(result);
    } catch (error) {
      console.error('Error uploading file:', error);
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  // Get file metadata
  async getFileMetadata(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const fileId = req.params.id;
      const metadata = await this.fileService.getFileMetadata(fileId);
      
      if (!metadata) {
        res.status(404).json({ error: 'File not found' });
        return;
      }

      res.json(metadata);
    } catch (error) {
      console.error('Error getting file metadata:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Delete file
  async deleteFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const fileId = req.params.id;
      const success = await this.fileService.deleteFile(fileId, userId);
      
      if (!success) {
        res.status(404).json({ error: 'File not found or unauthorized' });
        return;
      }

      res.json({ message: 'File deleted successfully' });
    } catch (error) {
      console.error('Error deleting file:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Stream file
  async streamFile(req: Request, res: Response): Promise<void> {
    try {
      const fileId = req.params.id;
      const metadata = await this.fileService.getFileMetadata(fileId);
      
      if (!metadata) {
        res.status(404).json({ error: 'File not found' });
        return;
      }

      const filePath = path.join(this.UPLOAD_DIR, metadata.id + path.extname(metadata.name));
      const fileSize = metadata.size;
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        
        const stream = createReadStream(filePath, { start, end });
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': metadata.type || 'application/octet-stream'
        });
        
        stream.pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': metadata.type || 'application/octet-stream'
        });
        createReadStream(filePath).pipe(res);
      }
    } catch (error) {
      console.error('Error streaming file:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  // Generate thumbnail
  async generateThumbnail(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const fileId = req.params.id;
      const thumbnailUrl = await this.fileService.generateThumbnail(fileId);
      res.json({ thumbnailUrl });
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
}
