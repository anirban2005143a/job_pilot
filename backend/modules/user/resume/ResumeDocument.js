import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

import { extractResumeContent } from "../../../services/resume/extractResumeContent.js";

export class ResumeDocument {

  constructor({ userId, file }) {
    if (!userId) {
      throw new Error("userId is required");
    }

    if (!file) {
      throw new Error("Resume file is required");
    }

    this.userId = userId.toString();
    this.file = file;

    // One UUID is shared by the original file and markdown file.
    this.uuid = randomUUID();

    // Prevent path traversal while keeping the original filename.
    this.originalFilename = path.basename(file.originalname);

    // UUID + original filename
    this.filename = `${this.uuid}_${this.originalFilename}`;

    // UUID + original filename without extension + .md
    const parsedFilename = path.parse(this.originalFilename);

    this.markdownFilename =
      `${this.uuid}_${parsedFilename.name}.md`;

    this.userResumeDir = path.join(
      process.cwd(),
      "uploads",
      "resumes",
      this.userId
    );

    this.originalPath = path.join(
      this.userResumeDir,
      this.filename
    );

    this.markdownPath = path.join(
      this.userResumeDir,
      this.markdownFilename
    );

    this.relativePath = path
      .join(
        "uploads",
        "resumes",
        this.userId,
        this.filename
      )
      .replaceAll("\\", "/");

    this.content = null;
  }

  async createDirectory() {
    await fs.mkdir(this.userResumeDir, {
      recursive: true,
    });
  }

  async saveOriginal() {
    await fs.writeFile(
      this.originalPath,
      this.file.buffer
    );

    return this.originalPath;
  }

  async extractContent() {
    this.content = await extractResumeContent(this.file);

    return this.content;
  }

  async saveMarkdown(content = this.content) {
    if (!content) {
      throw new Error(
        "Resume content must be extracted before saving Markdown"
      );
    }

    await fs.writeFile(
      this.markdownPath,
      content,
      "utf-8"
    );

    return this.markdownPath;
  }

  async process() {
    await this.createDirectory();

    await this.extractContent();

    await this.saveOriginal();

    await this.saveMarkdown();

    return this;
  }

  getRelativePath() {
    return this.relativePath;
  }

  getMetadata() {
    return {
      uuid: this.uuid,
      userId: this.userId,
      originalFilename: this.originalFilename,
      filename: this.filename,
      markdownFilename: this.markdownFilename,
      originalPath: this.originalPath,
      markdownPath: this.markdownPath,
      relativePath: this.relativePath,
    };
  }

  async exists() {
    try {
      await fs.access(this.originalPath);
      return true;
    } catch {
      return false;
    }
  }

  async delete() {
    await Promise.all([
      fs.rm(this.originalPath, {
        force: true,
      }),

      fs.rm(this.markdownPath, {
        force: true,
      }),
    ]);
  }
}