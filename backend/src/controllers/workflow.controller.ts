import { Request, Response } from "express";
import Workflow from "../models/workflow.model";

export const createWorkflow = async (req: Request, res: Response) => {
  const { name, nodes, edges, createdBy } = req.body;
  try {
    const workflow = await Workflow.create({ name, nodes, edges, createdBy });
    res.status(201).json(workflow);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
};

export const getWorkflows = async (req: Request, res: Response) => {
  const workflows = await Workflow.find();
  res.json(workflows);
};
