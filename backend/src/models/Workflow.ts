import mongoose, { Schema, Document } from 'mongoose';

// Interface for the 'selectedFile' object within a Node's data
export interface INodeDataSelectedFile {
    fileId?: string;
    filename?: string;
    originalName?: string;
    size?: number;
    mimetype?: string;
    uploadedAt?: Date;
}

// Interface for the 'videoFile' (legacy) object
export interface INodeDataLegacyFile {
    name?: string;
    size?: number;
    type?: string;
    uploadedAt?: Date;
}

// Interface for the 'data' object within a Node
export interface INodeData {
    label: string;
    nodeName?: string;
    isLive?: boolean;
    rtspUrl?: string;
    selectedFile?: INodeDataSelectedFile;
    videoFile?: INodeDataLegacyFile; // Legacy support
    status?: 'empty' | 'uploading' | 'ready' | 'error';
    config?: any; // For generic object data
}

// Interface for a single Node document
export interface INode {
    id: string;
    type: string;
    position: {
        x: number;
        y: number;
    };
    data: INodeData;
    selected?: boolean;
    dragging?: boolean;
}

// Interface for a single Edge document
export interface IEdge {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
    animated?: boolean;
    style?: any;
    label?: string;
    labelStyle?: any;
}

// Interface for the Viewport object
export interface IViewport {
    x: number;
    y: number;
    zoom: number;
}

// Main interface for the Workflow document, extending Mongoose's Document
export interface IWorkflow extends Document {
    name: string;
    description?: string;
    nodes: INode[];
    edges: IEdge[];
    viewport: IViewport;
    category: 'ml-training' | 'data-processing' | 'computer-vision' | 'other';
    status: 'draft' | 'published' | 'archived';
    tags: string[];
    createdBy?: string;
    lastModified: Date;
    version: number;
    createdAt: Date; // Automatically added by timestamps
    updatedAt: Date; // Automatically added by timestamps
}

// --- Mongoose Schemas ---

const NodeSchema = new Schema<INode>({
    id: { type: String, required: true },
    type: { type: String, required: true },
    position: {
        x: { type: Number, required: true },
        y: { type: Number, required: true }
    },
    data: {
        label: { type: String, required: true },
        nodeName: { type: String },
        isLive: { type: Boolean, default: false },
        rtspUrl: { type: String },
        selectedFile: {
            fileId: { type: String },
            filename: { type: String },
            originalName: { type: String },
            size: { type: Number },
            mimetype: { type: String },
            uploadedAt: { type: Date }
        },
        videoFile: { // Legacy support
            name: { type: String },
            size: { type: Number },
            type: { type: String },
            uploadedAt: { type: Date }
        },
        status: {
            type: String,
            enum: ['empty', 'uploading', 'ready', 'error'],
            default: 'empty'
        },
        config: { type: Schema.Types.Mixed }
    },
    selected: { type: Boolean, default: false },
    dragging: { type: Boolean, default: false }
}, { _id: false });

const EdgeSchema = new Schema<IEdge>({
    id: { type: String, required: true },
    source: { type: String, required: true },
    target: { type: String, required: true },
    sourceHandle: { type: String },
    targetHandle: { type: String },
    animated: { type: Boolean, default: false },
    style: { type: Schema.Types.Mixed },
    label: { type: String },
    labelStyle: { type: Schema.Types.Mixed }
}, { _id: false });

const WorkflowSchema = new Schema<IWorkflow>({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    nodes: {
        type: [NodeSchema],
        default: []
    },
    edges: {
        type: [EdgeSchema],
        default: []
    },
    viewport: {
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 },
        zoom: { type: Number, default: 1 }
    },
    category: {
        type: String,
        enum: ['ml-training', 'data-processing', 'computer-vision', 'other'],
        default: 'other'
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },
    tags: [{ type: String, trim: true }],
    createdBy: {
        type: String,
        default: 'anonymous'
    },
    lastModified: {
        type: Date,
        default: Date.now
    },
    version: {
        type: Number,
        default: 1
    }
}, {
    timestamps: true,
    minimize: false // Ensures empty arrays for nodes/edges are saved
});

// Pre-save middleware to update the lastModified field
WorkflowSchema.pre<IWorkflow>('save', function(next) {
    this.lastModified = new Date();
    next();
});

// Export the Mongoose model, typed with the IWorkflow interface
export default mongoose.model<IWorkflow>('Workflow', WorkflowSchema);