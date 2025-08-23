import mongoose, { Schema, Document } from 'mongoose';

// Define the structure of nested objects for better type safety
export interface IResolution {
    width?: number;
    height?: number;
}

export interface IMetadata {
    codec?: string;
    bitrate?: number;
    aspectRatio?: string;
}

// Define the main interface for the File document, extending Mongoose's Document
export interface IFile extends Document {
    fileId: string;
    filename: string;
    originalName: string;
    mimetype:
        | 'video/mp4'
        | 'video/avi'
        | 'video/mov'
        | 'video/quicktime'
        | 'video/x-msvideo'
        | 'video/x-quicktime'
        | 'video/mp4v-es'
        | 'application/octet-stream'
        | 'video/x-m4v';
    size: number;
    duration?: number | null;
    resolution?: IResolution;
    fps?: number | null;
    path: string;
    thumbnailPath?: string | null;
    uploadedBy?: string;
    metadata?: IMetadata;
    status?: 'uploading' | 'processing' | 'ready' | 'error';
    errorMessage?: string | null;
    createdAt: Date; // Automatically added by timestamps
    updatedAt: Date; // Automatically added by timestamps
}

// Create the Mongoose Schema corresponding to the IFile interface
const FileSchema: Schema<IFile> = new Schema({
    fileId: {
        type: String,
        required: true,
        unique: true, // Recommended for a unique identifier
        index: true,   // Recommended for faster queries
    },
    filename: {
        type: String,
        required: true,
    },
    originalName: {
        type: String,
        required: true,
    },
    mimetype: {
        type: String,
        required: true,
        enum: [
            'video/mp4', 'video/avi', 'video/mov', 'video/quicktime',
            'video/x-msvideo', 'video/x-quicktime', 'video/mp4v-es',
            'application/octet-stream', 'video/x-m4v'
        ],
    },
    size: {
        type: Number,
        required: true,
    },
    duration: {
        type: Number, // in seconds
        default: null,
    },
    resolution: {
        width: { type: Number },
        height: { type: Number },
    },
    fps: {
        type: Number,
        default: null,
    },
    path: {
        type: String,
        required: true,
    },
    thumbnailPath: {
        type: String,
        default: null,
    },
    uploadedBy: {
        type: String,
        default: 'anonymous',
    },
    metadata: {
        codec: String,
        bitrate: Number,
        aspectRatio: String,
    },
    status: {
        type: String,
        enum: ['uploading', 'processing', 'ready', 'error'],
        default: 'uploading',
    },
    errorMessage: {
        type: String,
        default: null,
    }
}, {
    timestamps: true // This option adds createdAt and updatedAt fields
});

// Export the Mongoose model, typed with the IFile interface
export default mongoose.model<IFile>('File', FileSchema);