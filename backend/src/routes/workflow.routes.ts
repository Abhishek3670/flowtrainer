import { Router } from "express";
import { createWorkflow, getWorkflows } from "../controllers/workflow.controller";

const router = Router();
router.post("/", createWorkflow);
router.get("/", getWorkflows);

export default router;
