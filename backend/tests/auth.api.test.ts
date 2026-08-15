import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";
import { createApp } from "../app.js";
import { UserRepository } from "../users/UserRepository.js";

let mongo: MongoMemoryServer;
let client: MongoClient;
let app: ReturnType<typeof createApp>;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  client = new MongoClient(mongo.getUri());
  await client.connect();
  const database = client.db("auth-test");
  await new UserRepository(database).ensureIndexes();
  app = createApp(database, "test-secret");
});

afterAll(async () => { await client.close(); await mongo.stop(); });

describe("Auth API", () => {
  const user = { name: "Ada Lovelace", email: "ada@example.com", password: "secure-pass-1" };
  it("registers a user and returns a JWT", async () => {
    const response = await request(app).post("/api/auth/register").send(user);
    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({ name: user.name, email: user.email });
    expect(response.body.user).not.toHaveProperty("passwordHash");
    expect(response.body.token).toEqual(expect.any(String));
  });
  it("rejects duplicate email addresses", async () => {
    const response = await request(app).post("/api/auth/register").send(user);
    expect(response.status).toBe(409);
  });
  it("logs in a registered user", async () => {
    const response = await request(app).post("/api/auth/login").send({ email: user.email, password: user.password });
    expect(response.status).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));
  });
  it("rejects invalid login credentials", async () => {
    const response = await request(app).post("/api/auth/login").send({ email: user.email, password: "wrong-password" });
    expect(response.status).toBe(401);
  });
});
