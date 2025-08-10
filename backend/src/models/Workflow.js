const mongoose = require('mongoose');

// Define Node schema more explicitly
const NodeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, required: true },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  data: {
    label: { type: String, required: true },
    // Video Stream specific properties
    nodeName: { type: String },
    isLive: { type: Boolean, default: false },
    rtspUrl: { type: String },
    
    // Enhanced file association
    selectedFile: {
      fileId: { type: String }, // Reference to File._id
      filename: { type: String },
      originalName: { type: String },
      size: { type: Number },
      mimetype: { type: String },
      uploadedAt: { type: Date }
    },
    
    // Legacy support
    videoFile: {
      name: { type: String },
      size: { type: Number },
      type: { type: String },
      uploadedAt: { type: Date }
    },
    
    // Node status
    status: {
      type: String,
      enum: ['empty', 'uploading', 'ready', 'error'],
      default: 'empty'
    },
    
    // Generic node configuration
    config: { type: mongoose.Schema.Types.Mixed }
  },
  // React Flow specific properties
  selected: { type: Boolean, default: false },
  dragging: { type: Boolean, default: false }
}, { _id: false });

// Rest of the schema stays the same...


// Define Edge schema more explicitly
const EdgeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  source: { type: String, required: true },
  target: { type: String, required: true },
  sourceHandle: { type: String },
  targetHandle: { type: String },
  animated: { type: Boolean, default: false },
  style: { type: mongoose.Schema.Types.Mixed },
  label: { type: String },
  labelStyle: { type: mongoose.Schema.Types.Mixed }
}, { _id: false });

const WorkflowSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  // IMPORTANT: Explicitly define as arrays of the schemas above
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
  // IMPORTANT: Prevent Mongoose from removing empty arrays
  minimize: false
});

// Pre-save middleware
WorkflowSchema.pre('save', function(next) {
  this.lastModified = new Date();
  next();
});

module.exports = mongoose.model('Workflow', WorkflowSchema);
