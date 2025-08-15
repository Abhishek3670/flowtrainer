import express, { Application } from "express";
import cors from "cors";
import morgan from "morgan";
const workflowRoutes = require("./routes/workflowRoutes");
import checkpointRoutes from "./routes/checkpoints";
import cleanupRoutes from "./routes/cleanup";

const app: Application = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.use("/api/workflows", workflowRoutes);
app.use("/api/workflows/:id/checkpoints", checkpointRoutes);
app.use("/api/cleanup", cleanupRoutes);

export default app;
