import express, { Express } from "express";
import { AuthController } from "../modules/auth/AuthController.js";
import { AuthService } from "../modules/auth/AuthService.js";
import { createAuthRouter } from "../modules/auth/authRoutes.js";
import { UserRepository } from "../users/UserRepository.js";
import { Db } from "mongodb";

export const createApp = (database: Db, jwtSecret: string): Express => {
  const app = express();
  app.use(express.json());
  const userRepository = new UserRepository(database);
  const authController = new AuthController(new AuthService(userRepository, jwtSecret));
  app.get("/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api/auth", createAuthRouter(authController));
  return app;
};
