import { FileDocument } from '../../models/file.model';
import { ReadStream } from 'fs';
import { Request, Response } from 'express';

export interface IFileService {
    /**
     * Get paginated list of files with optional filters
     */
    getFiles(page?: number, limit?: number, filters?: { 
        status?: string; 
        mimetype?: string; 
    }): Promise<{
        files: FileDocument[];
        total: number;
    }>;

    /**
     * Get a single file by ID (either MongoDB ID or fileId)
     */
    getFileById(fileId: string): Promise<FileDocument | null>;

    /**
     * Delete a file and its associated physical file
     * @param fileId The ID of the file to delete
     * @param userId The ID of the user attempting to delete the file
     * @returns Promise<boolean> True if deletion was successful, false otherwise
     */
    deleteFile(fileId: string, userId: string): Promise<boolean>;

    /**
     * Stream a video file with support for range requests
     */
    streamVideo(fileId: string, range?: string): Promise<{
        stream: ReadStream;
        headers: Record<string, string>;
        statusCode: number;
    } | null>;

    /**
     * Get multer middleware configured for video uploads
     */
    getUploadMiddleware(): {
        single: (fieldName: string) => (req: Request, res: Response, cb: (error?: any) => void) => void;
    };

    /**
     * Process an uploaded file and create a database record
     */
    handleUploadedFile(file: Express.Multer.File): Promise<FileDocument>;

    // Legacy methods that we need to keep for backward compatibility
    uploadFile(file: Express.Multer.File, userId: string, metadata?: Record<string, any>): Promise<{ id: string; url: string }>;
    getFileMetadata(fileId: string): Promise<{
        id: string;
        name: string;
        type: string;
        size: number;
        userId: string;
        url: string;
        metadata?: Record<string, any>;
        createdAt: Date;
    } | null>;
    generateThumbnail(fileId: string): Promise<string>;
    validateFileType(filename: string, allowedTypes: string[]): boolean;
    validateFileSize(size: number, maxSize: number): boolean;
    getSignedUrl(fileId: string, expiresInSeconds?: number): Promise<string>;
    moveFile(fileId: string, newPath: string): Promise<boolean>;
}
