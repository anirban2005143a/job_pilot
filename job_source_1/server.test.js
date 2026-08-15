import { describe, test, expect } from "vitest";
import request from "supertest";
import app from "./server.js";

describe("Mock Job Source API", () => {

  test("GET /jobs should return jobs", async () => {
    const response = await request(app)
      .get("/jobs");

    expect(response.status).toBe(200);
    expect(response.body.jobs).toBeInstanceOf(Array);
    expect(response.body.jobs.length).toBeGreaterThan(0);
  });


  test("POST /apply should create an application", async () => {
    const response = await request(app)
      .post("/apply")
      .send({
        job_id: "job-101",
        user_id: "test-user-1",
        name: "Test User",
        email: "test@example.com",
        resume: "resume.pdf",
        cover_letter: "Test cover letter",
      });

    expect(response.status).toBe(201);

    expect(response.body).toHaveProperty("application_id");
    expect(response.body.status).toBe("pending");
  });


  test("POST /apply should reject duplicate application", async () => {
    const response = await request(app)
      .post("/apply")
      .send({
        job_id: "job-101",
        user_id: "test-user-1",
        name: "Test User",
        email: "test@example.com",
        resume: "resume.pdf",
        cover_letter: "Test cover letter",
      });

    expect(response.status).toBe(409);
    expect(response.body.error)
      .toBe("Already applied to this job");
  });


  test("POST /apply should reject invalid job", async () => {
    const response = await request(app)
      .post("/apply")
      .send({
        job_id: "job-does-not-exist",
        user_id: "test-user-2",
        name: "Test User",
        email: "test@example.com",
        resume: "resume.pdf",
        cover_letter: "Test cover letter",
      });

    expect(response.status).toBe(404);
    expect(response.body.error)
      .toBe("Job not found");
  });


  test("GET /status should return user applications", async () => {
    const response = await request(app)
      .get("/status")
      .query({
        user_id: "test-user-1",
      });

    expect(response.status).toBe(200);
    expect(response.body.applications)
      .toBeInstanceOf(Array);
  });

});