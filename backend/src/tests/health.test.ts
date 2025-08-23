import request from "supertest";
import server  from "../server";

describe("GET /api/health", () => {
  it("should return healthy", async () => {
    const res = await request(server).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("healthy");
  });
});
