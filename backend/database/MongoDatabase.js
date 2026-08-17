import mongoose from "mongoose";

export class MongoDatabase {
  constructor(uri) {
    this.uri = uri;
    this.connection = undefined;
  }

  async connect() {
    if (this.connection) {
      return this.connection;
    }

    if (!this.uri) {
      throw new Error("MONGODB_URI is required");
    }

    await mongoose.connect(this.uri);

    console.log("MongoDB connected successfully");

    this.connection = mongoose.connection;

    return this.connection;
  }

  async disconnect() {
    if (this.connection) {
      await mongoose.disconnect();
    }

    console.log("MongoDB disconnected");

    this.connection = undefined;
  }
}
