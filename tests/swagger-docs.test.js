import request from "supertest";
import { app } from "../src/app.js";

describe("API docs", () => {
  it("GET /openapi.json returns OpenAPI 3 document", async () => {
    const res = await request(app).get("/openapi.json");
    expect(res.statusCode).toBe(200);
    expect(res.body.openapi).toMatch(/^3\.0\./);
    expect(res.body.paths["/api/auth/login"]).toBeDefined();
    expect(res.body.paths["/api/auth/login"].post.security).toEqual([]);
  });

  it("GET /docs/ serves Swagger UI HTML", async () => {
    const res = await request(app).get("/docs/");
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("swagger-ui");
  });

  it("GET /api-docs/ serves Swagger UI HTML", async () => {
    const res = await request(app).get("/api-docs/");
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("swagger-ui");
  });

  it("redirects /docs to canonical /docs/", async () => {
    const res = await request(app).get("/docs").redirects(0);
    expect([301, 302, 307, 308]).toContain(res.statusCode);
    expect(res.headers.location).toBe("/docs/");
  });

  it("GET /downloads/swagger.json downloads spec JSON", async () => {
    const res = await request(app).get("/downloads/swagger.json");
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("application/json");
    expect(res.headers["content-disposition"]).toContain("attachment; filename=\"swagger.json\"");
    expect(res.body.openapi).toMatch(/^3\.0\./);
  });

  it("GET /downloads/master-data.json downloads generated sample", async () => {
    const res = await request(app).get("/downloads/master-data.json");
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("application/json");
    expect(res.headers["content-disposition"]).toContain("attachment; filename=\"master-data.json\"");
  });
});
