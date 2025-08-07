import express, { Application } from "express";
import cors from "cors";
import morgan from "morgan";
import workflowRoutes from "./routes/workflow.routes";

const app: Application = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.use("/api/workflows", workflowRoutes);

export default app;
