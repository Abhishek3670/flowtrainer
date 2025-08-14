import { Schema, model, Document } from 'mongoose';

// Enhanced checkpoint model with versioning support
interface VersionedCheckpoint extends Document {
  workflowId: string;
  name: string;
  description?: string;
  version: number;
  createdAt: Date;
  createdBy: string;
  nodes: any[];
  edges: any[];
  viewport: { x: number; y: number; zoom: number };
  parentCheckpointId?: string;
  isActive: boolean;
  metadata?: {
    nodeCount: number;
    edgeCount: number;
    tags?: string[];
    changesSummary?: string;
    branchName?: string;
  };
  diff?: {
    nodesAdded: any[];
    nodesRemoved: any[];
    nodesModified: any[];
    edgesAdded: any[];
    edgesRemoved: any[];
    edgesModified: any[];
  };
}

const VersionedCheckpointSchema = new Schema<VersionedCheckpoint>({
  workflowId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  version: { type: Number, required: true, default: 1 },
  createdAt: { type: Date, default: Date.now, index: true },
  createdBy: { type: String, required: true },
  nodes: { type: Schema.Types.Mixed, default: [] },
  edges: { type: Schema.Types.Mixed, default: [] },
  viewport: {
    x: { type: Number, required: true, default: 0 },
    y: { type: Number, required: true, default: 0 },
    zoom: { type: Number, required: true, default: 1 }
  },
  parentCheckpointId: { type: String, ref: 'VersionedCheckpoint' },
  isActive: { type: Boolean, default: true, index: true },
  metadata: {
    nodeCount: { type: Number, default: 0 },
    edgeCount: { type: Number, default: 0 },
    tags: [String],
    changesSummary: String,
    branchName: { type: String, default: 'main' }
  },
  diff: {
    nodesAdded: { type: Schema.Types.Mixed, default: [] },
    nodesRemoved: { type: Schema.Types.Mixed, default: [] },
    nodesModified: { type: Schema.Types.Mixed, default: [] },
    edgesAdded: { type: Schema.Types.Mixed, default: [] },
    edgesRemoved: { type: Schema.Types.Mixed, default: [] },
    edgesModified: { type: Schema.Types.Mixed, default: [] }
  }
});

// Compound indexes for efficient queries
VersionedCheckpointSchema.index({ workflowId: 1, version: -1 });
VersionedCheckpointSchema.index({ workflowId: 1, createdAt: -1 });
VersionedCheckpointSchema.index({ workflowId: 1, isActive: 1, version: -1 });

// Pre-save middleware to auto-increment version
VersionedCheckpointSchema.pre('save', async function(next) {
  if (this.isNew) {
    const lastVersion = await VersionedCheckpointModel.findOne(
      { workflowId: this.workflowId },
      {},
      { sort: { version: -1 } }
    );
    
    this.version = lastVersion ? lastVersion.version + 1 : 1;
    
    // Auto-calculate metadata
    this.metadata = {
      ...this.metadata,
      nodeCount: Array.isArray(this.nodes) ? this.nodes.length : 0,
      edgeCount: Array.isArray(this.edges) ? this.edges.length : 0
    };
  }
  next();
});

export const VersionedCheckpointModel = model<VersionedCheckpoint>('VersionedCheckpoint', VersionedCheckpointSchema);

// Utility methods
export class CheckpointVersionManager {
  
  // Get latest version for a workflow
  static async getLatestVersion(workflowId: string) {
    return await VersionedCheckpointModel.findOne(
      { workflowId, isActive: true },
      {},
      { sort: { version: -1 } }
    );
  }

  // Get all versions for a workflow
  static async getAllVersions(workflowId: string, includeInactive = false) {
    const filter = includeInactive 
      ? { workflowId } 
      : { workflowId, isActive: true };
      
    return await VersionedCheckpointModel.find(filter).sort({ version: -1 });
  }

  // Create a new version with diff calculation
  static async createVersion(workflowId: string, data: any, parentVersion?: VersionedCheckpoint) {
    const diff = parentVersion ? this.calculateDiff(parentVersion, data) : undefined;
    
    const checkpoint = new VersionedCheckpointModel({
      workflowId,
      ...data,
      parentCheckpointId: parentVersion?._id,
      diff
    });
    
    return await checkpoint.save();
  }

  // Calculate diff between two checkpoint versions
  static calculateDiff(oldCheckpoint: VersionedCheckpoint, newData: any) {
    const oldNodes = oldCheckpoint.nodes || [];
    const newNodes = newData.nodes || [];
    const oldEdges = oldCheckpoint.edges || [];
    const newEdges = newData.edges || [];

    // Simple diff calculation (can be enhanced with more sophisticated algorithms)
    const oldNodeIds = new Set(oldNodes.map((n: any) => n.id));
    const newNodeIds = new Set(newNodes.map((n: any) => n.id));
    
    const oldEdgeIds = new Set(oldEdges.map((e: any) => e.id));
    const newEdgeIds = new Set(newEdges.map((e: any) => e.id));

    return {
      nodesAdded: newNodes.filter((n: any) => !oldNodeIds.has(n.id)),
      nodesRemoved: oldNodes.filter((n: any) => !newNodeIds.has(n.id)),
      nodesModified: newNodes.filter((n: any) => {
        if (!oldNodeIds.has(n.id)) return false;
        const oldNode = oldNodes.find((on: any) => on.id === n.id);
        return JSON.stringify(oldNode) !== JSON.stringify(n);
      }),
      edgesAdded: newEdges.filter((e: any) => !oldEdgeIds.has(e.id)),
      edgesRemoved: oldEdges.filter((e: any) => !newEdgeIds.has(e.id)),
      edgesModified: newEdges.filter((e: any) => {
        if (!oldEdgeIds.has(e.id)) return false;
        const oldEdge = oldEdges.find((oe: any) => oe.id === e.id);
        return JSON.stringify(oldEdge) !== JSON.stringify(e);
      })
    };
  }

  // Soft delete a version
  static async deleteVersion(checkpointId: string) {
    return await VersionedCheckpointModel.findByIdAndUpdate(
      checkpointId,
      { isActive: false },
      { new: true }
    );
  }

  // Hard delete a version
  static async permanentlyDeleteVersion(checkpointId: string) {
    return await VersionedCheckpointModel.findByIdAndDelete(checkpointId);
  }
}
