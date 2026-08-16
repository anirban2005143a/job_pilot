import dotenv from "dotenv";

dotenv.config();

export const getenv = (name) => {
  return process.env[name]
};

