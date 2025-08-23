// backend/src/database/createIndexes.ts

import mongoose from "mongoose";

export async function createIndexes() {
  const db = mongoose.connection.db;

  console.log('🔧 Creating FlowTrainer database indexes...');

  try {
    // === CRITICAL INDEXES ===

    // 1. User workflows sorted by last modified (most common query)
    await db.collection("workflows").createIndex(
      { createdBy: 1, lastModified: -1 },
      { name: "user_workflows_sorted_idx", background: true }
    );
    console.log('✅ Created index: user_workflows_sorted_idx');

    // 2. Unique file lookup (replace auto-generated fileId_1)
    await db.collection("files").createIndex(
      { fileId: 1 },
      { name: "fileId_unique_idx", unique: true, background: true }
    );
    console.log('✅ Created index: fileId_unique_idx');

    // === HIGH PRIORITY INDEXES ===

    // 3. Workflow category and status filtering
    await db.collection("workflows").createIndex(
      { category: 1, status: 1 },
      { name: "category_status_idx", background: true }
    );
    console.log('✅ Created index: category_status_idx');

    // 4. Workflow status with recent first
    await db.collection("workflows").createIndex(
      { status: 1, lastModified: -1 },
      { name: "status_recent_idx", background: true }
    );
    console.log('✅ Created index: status_recent_idx');

    // 5. User files by status (compound index)
    await db.collection("files").createIndex(
      { uploadedBy: 1, status: 1 },
      { name: "user_files_status_idx", background: true }
    );
    console.log('✅ Created index: user_files_status_idx');

    // 6. File status and type queries
    await db.collection("files").createIndex(
      { status: 1, mimetype: 1 },
      { name: "status_mimetype_idx", background: true }
    );
    console.log('✅ Created index: status_mimetype_idx');

    // === CHECKPOINT INDEXES ===

    // 7. Workflow checkpoints chronological
    await db.collection("checkpoints").createIndex(
      { workflowId: 1, createdAt: -1 },
      { name: "workflow_checkpoints_idx", background: true }
    );
    console.log('✅ Created index: workflow_checkpoints_idx');

    // 8. User checkpoint history
    await db.collection("checkpoints").createIndex(
      { createdBy: 1, createdAt: -1 },
      { name: "user_checkpoints_idx", background: true }
    );
    console.log('✅ Created index: user_checkpoints_idx');

    // === MEDIUM PRIORITY INDEXES ===

    // 9. Tag-based workflow search
    await db.collection("workflows").createIndex(
      { tags: 1 },
      { name: "tags_search_idx", background: true }
    );
    console.log('✅ Created index: tags_search_idx');

    // 10. Text search in workflows
    await db.collection("workflows").createIndex(
      { name: "text", description: "text" },
      { name: "workflow_text_search_idx", background: true }
    );
    console.log('✅ Created index: workflow_text_search_idx');

    // 11. Recent workflows
    await db.collection("workflows").createIndex(
      { createdAt: -1 },
      { name: "recent_workflows_idx", background: true }
    );
    console.log('✅ Created index: recent_workflows_idx');

    // 12. Recent files
    await db.collection("files").createIndex(
      { createdAt: -1 },
      { name: "recent_files_idx", background: true }
    );
    console.log('✅ Created index: recent_files_idx');

    console.log("\n🎉 All FlowTrainer indexes created successfully!");

    // Log stats
    const workflowIndexes = await db.collection("workflows").indexes();
    const fileIndexes = await db.collection("files").indexes();
    const checkpointIndexes = await db.collection("checkpoints").indexes();

    console.log("\n📊 Index Summary:");
    console.log(`  Workflows: ${workflowIndexes.length} indexes`);
    console.log(`  Files:     ${fileIndexes.length} indexes`);
    console.log(`  Checkpoints: ${checkpointIndexes.length} indexes`);

  } catch (error: unknown) {
    console.error("❌ Error creating indexes:", error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes("E11000")) {
      console.error("💡 Hint: Duplicate key error – clean up duplicate data first.");
    } else if (errorMessage.includes("already exists")) {
      console.error("💡 Hint: Index already exists – drop conflicting indexes first.");
    }
    throw error;
  }
}

// Optional helper to drop conflicting auto-indexes before creating new ones
export async function dropConflictingIndexes() {
  const db = mongoose.connection.db;
  console.log("🧹 Dropping conflicting auto-generated indexes...");

  const toDrop = ["fileId_1", "filename_1", "uploadedBy_1", "status_1", "mimetype_1"];
  
  for (const idx of toDrop) {
    try {
      await db.collection("files").dropIndex(idx);
      console.log(`✅ Dropped index: ${idx}`);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      
      if (errorMessage.includes("not found")) {
        console.log(`ℹ️ Index not found: ${idx}`);
      } else {
        console.warn(`⚠️ Could not drop ${idx}: ${errorMessage}`);
      }
    }
  }
}

// Optional helper to list current indexes for debugging
export async function listCurrentIndexes() {
  const db = mongoose.connection.db;
  console.log("\n📋 Current Database Indexes:");
  
  for (const coll of ["workflows", "files", "checkpoints"]) {
    console.log(`\nCollection: ${coll}`);
    try {
      const idxs = await db.collection(coll).indexes();
      idxs.forEach(i => {
        console.log(`  - ${i.name}: ${JSON.stringify(i.key)}${i.unique ? " (unique)" : ""}`);
      });
    } catch (error: unknown) {
      console.log("  (no indexes or collection missing)");
    }
  }
}
