import request from "supertest";
import app from "../../app";
import mongoose from "mongoose";

describe("Workflow API", () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI!);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("creates a workflow", async () => {
    const response = await request(app)
      .post("/api/workflows")
      .send({
        name: "Test",
        nodes: [],
        edges: [],
        createdBy: "test-user",
      });
    expect(response.status).toBe(201);
    expect(response.body.name).toBe("Test");
  });

  it("retrieves workflows", async () => {
    const response = await request(app).get("/api/workflows");
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
