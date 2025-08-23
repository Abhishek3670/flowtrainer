const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
    fileId: {
        type: String,
        required: true
    },
    filename: {
        type: String,
        required: true,
    },
    originalName: {
        type: String,
        required: true
    },
    mimetype: {
        type: String,
        required: true,
        enum: [
            'video/mp4',
            'video/avi',
            'video/mov',
            'video/quicktime',
            'video/x-msvideo',
            'video/x-quicktime',
            'video/mp4v-es',
            'application/octet-stream',
            'video/x-m4v'
        ]
    },
    size: {
        type: Number,
        required: true
    },
    duration: {
        type: Number, // in seconds
        default: null
    },
    resolution: {
        width: { type: Number },
        height: { type: Number }
    },
    fps: {
        type: Number,
        default: null
    },
    path: {
        type: String,
        required: true
    },
    thumbnailPath: {
        type: String,
        default: null
    },
    uploadedBy: {
        type: String,
        default: 'anonymous'
    },
    metadata: {
        codec: String,
        bitrate: Number,
        aspectRatio: String
    },
    status: {
        type: String,
        enum: ['uploading', 'processing', 'ready', 'error'],
        default: 'uploading'
    },
    errorMessage: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('File', FileSchema);
