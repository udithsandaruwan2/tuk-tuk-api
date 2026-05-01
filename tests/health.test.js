import request from "supertest";
import { app } from "../src/app.js";

describe("GET /health", () => {
  it("returns 200", async () => {
    const response = await request(app).get("/health");
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
