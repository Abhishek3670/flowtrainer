import fs from 'fs/promises';
import { createReadStream, ReadStream } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { IFileService } from '../interfaces/IFileService';
import multer from 'multer';
import { FileDocument, FileModel } from '../../models/file.model';

export class FileService implements IFileService {
  private readonly uploadDir: string;
  private readonly thumbnailDir: string;
  private readonly maxFileSize: number;
  private readonly multerInstance: multer.Multer;

  constructor(config: {
    uploadDir?: string;
    thumbnailDir?: string;
    maxFileSize?: number;
  } = {}) {
    this.uploadDir = config.uploadDir || path.join(process.cwd(), 'uploads');
    this.thumbnailDir = config.thumbnailDir || path.join(this.uploadDir, 'thumbnails');
    this.maxFileSize = config.maxFileSize || 100 * 1024 * 1024; // 100MB default

    // Initialize multer with storage configuration
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, this.uploadDir);
      },
      filename: (req, file, cb) => {
        const fileId = uuidv4();
        const ext = path.extname(file.originalname);
        cb(null, `${fileId}${ext}`);
      }
    });

    this.multerInstance = multer({
      storage,
      limits: {
        fileSize: this.maxFileSize
      }
    });
  }

  /**
   * Get paginated list of files with optional filters
   */
  async getFiles(page: number = 1, limit: number = 10, filters?: { 
    status?: string; 
    mimetype?: string; 
  }): Promise<{ files: FileDocument[]; total: number }> {
    const query: Record<string, any> = {};
    
    if (filters?.status) {
      query.status = filters.status;
    }
    if (filters?.mimetype) {
      query.mimetype = filters.mimetype;
    }

    const skip = (page - 1) * limit;
    const [files, total] = await Promise.all([
      FileModel.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      FileModel.countDocuments(query)
    ]);

    return { files, total };
  }

  /**
   * Get a single file by ID
   */
  async getFileById(fileId: string): Promise<FileDocument | null> {
    return FileModel.findOne({ 
      $or: [
        { _id: fileId },
        { fileId: fileId }
      ]
    });
  }

  /**
   * Stream a video file with support for range requests
   */
  async streamVideo(fileId: string, range?: string): Promise<{
    stream: ReadStream;
    headers: Record<string, string>;
    statusCode: number;
  } | null> {
    const file = await this.getFileById(fileId);
    if (!file) return null;

    const filePath = path.join(this.uploadDir, file.filename);
    const fileSize = file.size;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = (end - start) + 1;

      return {
        stream: createReadStream(filePath, { start, end }),
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize.toString(),
          'Content-Type': file.mimetype
        },
        statusCode: 206
      };
    }

    return {
      stream: createReadStream(filePath),
      headers: {
        'Content-Length': fileSize.toString(),
        'Content-Type': file.mimetype
      },
      statusCode: 200
    };
  }

  /**
   * Get multer middleware configured for video uploads
   */
  getUploadMiddleware() {
    return this.multerInstance;
  }

  /**
   * Process an uploaded file and create a database record
   */
  async handleUploadedFile(file: Express.Multer.File): Promise<FileDocument> {
    const newFile = new FileModel({
      fileId: path.parse(file.filename).name,
      originalname: file.originalname,
      encoding: file.encoding,
      mimetype: file.mimetype,
      destination: file.destination,
      filename: file.filename,
      path: file.path,
      size: file.size,
      status: 'ready'
    });

    await newFile.save();
    return newFile;
  }

  async uploadFile(
    file: Express.Multer.File,
    userId: string,
    metadata?: Record<string, any>
  ): Promise<{ id: string; url: string }> {
    // Validate file
    if (!this.validateFileSize(file.size, this.maxFileSize)) {
      throw new Error('File size exceeds maximum allowed size');
    }

    // Generate unique ID and paths
    const fileId = uuidv4();
    const extension = path.extname(file.originalname);
    const filename = `${fileId}${extension}`;
    const filePath = path.join(this.uploadDir, filename);

    // Ensure upload directory exists
    await fs.mkdir(this.uploadDir, { recursive: true });

    // Write file
    await fs.writeFile(filePath, file.buffer);

    // Generate thumbnail if it's an image
    const isImage = file.mimetype.startsWith('image/');
    if (isImage) {
      await this.generateThumbnail(fileId);
    }

    // Store metadata if provided
    if (metadata) {
      await this.saveMetadata(fileId, {
        ...metadata,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        userId,
        createdAt: new Date()
      });
    }

    return {
      id: fileId,
      url: `/uploads/${filename}`
    };
  }

  async deleteFile(fileId: string, userId: string): Promise<boolean> {
    const metadata = await this.getFileMetadata(fileId);
    
    if (!metadata || metadata.userId !== userId) {
      return false;
    }

    const filePath = path.join(this.uploadDir, `${fileId}${path.extname(metadata.name)}`);
    const thumbnailPath = path.join(this.thumbnailDir, `${fileId}.jpg`);

    try {
      await fs.unlink(filePath);
      await fs.unlink(thumbnailPath).catch(() => {}); // Ignore if thumbnail doesn't exist
      await this.deleteMetadata(fileId);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
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
    try {
      const metadataPath = path.join(this.uploadDir, 'metadata', `${fileId}.json`);
      const data = await fs.readFile(metadataPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  async generateThumbnail(fileId: string): Promise<string> {
    const metadata = await this.getFileMetadata(fileId);
    if (!metadata || !metadata.type.startsWith('image/')) {
      throw new Error('File is not an image');
    }

    const sourceFile = path.join(this.uploadDir, `${fileId}${path.extname(metadata.name)}`);
    const thumbnailPath = path.join(this.thumbnailDir, `${fileId}.jpg`);

    // Ensure thumbnail directory exists
    await fs.mkdir(this.thumbnailDir, { recursive: true });

    // Generate thumbnail
    await sharp(sourceFile)
      .resize(200, 200, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({
        quality: 80,
        progressive: true
      })
      .toFile(thumbnailPath);

    return `/uploads/thumbnails/${fileId}.jpg`;
  }

  validateFileType(filename: string, allowedTypes: string[]): boolean {
    const extension = path.extname(filename).toLowerCase();
    return allowedTypes.includes(extension);
  }

  validateFileSize(size: number, maxSize: number): boolean {
    return size <= maxSize;
  }

  async getSignedUrl(fileId: string, expiresInSeconds: number = 3600): Promise<string> {
    const metadata = await this.getFileMetadata(fileId);
    if (!metadata) {
      throw new Error('File not found');
    }

    // For local development, just return the direct URL
    // In production, this would generate a signed URL using cloud storage
    return metadata.url;
  }

  async moveFile(fileId: string, newPath: string): Promise<boolean> {
    const metadata = await this.getFileMetadata(fileId);
    if (!metadata) {
      return false;
    }

    const currentPath = path.join(this.uploadDir, `${fileId}${path.extname(metadata.name)}`);
    const targetPath = path.join(this.uploadDir, newPath);

    try {
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.rename(currentPath, targetPath);

      // Update metadata
      await this.saveMetadata(fileId, {
        ...metadata,
        name: path.basename(newPath)
      });

      return true;
    } catch (error) {
      console.error('Error moving file:', error);
      return false;
    }
  }

  private async saveMetadata(fileId: string, metadata: Record<string, any>): Promise<void> {
    const metadataDir = path.join(this.uploadDir, 'metadata');
    await fs.mkdir(metadataDir, { recursive: true });
    
    const metadataPath = path.join(metadataDir, `${fileId}.json`);
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  }

  private async deleteMetadata(fileId: string): Promise<void> {
    const metadataPath = path.join(this.uploadDir, 'metadata', `${fileId}.json`);
    await fs.unlink(metadataPath).catch(() => {});
  }
}
