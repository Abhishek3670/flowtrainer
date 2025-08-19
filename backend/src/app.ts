/**
 * FlowCraft Express Application Configuration
 * 
 * This file sets up the Express application with middleware and routes.
 * It serves as a modular configuration that can be imported and used
 * by the main server or for testing purposes.
 * 
 * Key Features:
 * - CORS configuration for cross-origin requests
 * - Request logging with Morgan
 * - JSON body parsing
 * - Modular route organization
 * 
 * Note: This appears to be a secondary configuration file that may
 * be used for testing or alternative server setups.
 */

import express, { Application } from "express";
import cors from "cors";
import morgan from "morgan";
import checkpointRoutes from "./routes/checkpoints";
import cleanupRoutes from "./routes/cleanup";
import projectRoutes from './routes/projectRoutes';

// Create Express application instance
const app: Application = express();

// Import workflow routes (using require for JS compatibility)
const workflowRoutes = require("./routes/workflowRoutes");

// ===== MIDDLEWARE CONFIGURATION =====

// Enable CORS for cross-origin requests
app.use(cors());

// Add HTTP request logging for development and debugging
app.use(morgan("dev"));

// Parse JSON request bodies
app.use(express.json());

// ===== ROUTE REGISTRATION =====

// Workflow management endpoints
app.use("/api/workflows", workflowRoutes);

// Checkpoint management endpoints (nested under workflows)
app.use("/api/workflows/:id/checkpoints", checkpointRoutes);

// Cleanup and maintenance endpoints
app.use("/api/cleanup", cleanupRoutes);

// Project management endpoints
app.use('/api/projects', projectRoutes);

// Export the configured Express application
export default app;
