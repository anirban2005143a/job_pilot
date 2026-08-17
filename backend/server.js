import { app } from "./app.js";
import { getenv } from "./config/env.js";
import { MongoDatabase } from "./database/MongoDatabase.js";

const PORT = Number(getenv("PORT") || 5000);
const MONGO_URI = getenv("MONGO_URI");

const startServer = async () => {
  try {
    // Connect to MongoDB
    const database = new MongoDatabase(MONGO_URI);

    await database.connect();

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log("Shutting down server...");

      server.close(async () => {
        await database.disconnect();       
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
