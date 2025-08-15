import express, { Application } from "express";
import cors from "cors";
import morgan from "morgan";
import checkpointRoutes from "./routes/checkpoints";
import cleanupRoutes from "./routes/cleanup";
import projectRoutes from './routes/projectRoutes';

const app: Application = express();
const workflowRoutes = require("./routes/workflowRoutes");

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use("/api/workflows", workflowRoutes);
app.use("/api/workflows/:id/checkpoints", checkpointRoutes);
app.use("/api/cleanup", cleanupRoutes);
app.use('/api/projects', projectRoutes);

export default app;
