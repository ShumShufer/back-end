import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import app from "../../src/app.js";
import type { Server } from "node:http";

describe("Health & Core Middleware Integration Tests", () => {
  let server: Server;
  let baseUrl: string;

  before(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address();
        const port = typeof address === "object" && address ? address.port : 0;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it("GET /health should return 200 OK", async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as { status: string; message: string };
    assert.equal(body.status, "OK");
    assert.equal(body.message, "Server is up and running");
  });

  it("GET /api/v1/health should return 200 OK", async () => {
    const res = await fetch(`${baseUrl}/api/v1/health`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as { status: string; message: string };
    assert.equal(body.status, "OK");
  });

  it("GET /non-existent-route should return 404 with standard error envelope", async () => {
    const res = await fetch(`${baseUrl}/non-existent-route`);
    assert.equal(res.status, 404);
    const body = (await res.json()) as {
      success: boolean;
      error?: { code: string; message: string };
    };
    assert.equal(body.success, false);
    assert.ok(body.error);
    assert.equal(body.error?.code, "NOT_FOUND");
  });
});
