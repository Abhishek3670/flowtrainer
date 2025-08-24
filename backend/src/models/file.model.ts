import { Document, Schema, model } from 'mongoose';

export interface FileDocument extends Document {
    fileId?: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    destination: string;
    filename: string;
    path: string;
    size: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

const fileSchema = new Schema({
    fileId: { type: String },
    originalname: { type: String, required: true },
    encoding: { type: String, required: true },
    mimetype: { type: String, required: true },
    destination: { type: String, required: true },
    filename: { type: String, required: true },
    path: { type: String, required: true },
    size: { type: Number, required: true },
    status: { type: String, default: 'pending' },
}, {
    timestamps: true
});

export const FileModel = model<FileDocument>('File', fileSchema);
