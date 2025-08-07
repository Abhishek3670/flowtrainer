import mongoose from "mongoose";
import Workflow from "../backend/src/models/workflow.model";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/flowcraft";

const seed = async () => {
  await mongoose.connect(MONGO_URI);

  const defaultWorkflow = new Workflow({
    name: "Sample Workflow",
    nodes: [
      {
        id: "1",
        type: "input",
        position: { x: 100, y: 100 },
        data: { label: "Start Node" },
      },
    ],
    edges: [],
    createdBy: "system",
  });

  await defaultWorkflow.save();
  console.log("Seed data inserted");
  await mongoose.disconnect();
};

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
