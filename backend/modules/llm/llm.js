import fs from "fs/promises";
import path from "path";
import axios from "axios";
import { getenv } from "../../config/env.js";
class LLMModule {
  constructor(user) {
    if (!user) {
      throw new Error("User object is required");
    }

    this.user = user;

    this.pythonApiBaseUrl = getenv("PYTHON_SERVER_BASE_URL");

    if (!this.pythonApiBaseUrl) {
      throw new Error("PYTHON_API_BASE_URL is required");
    }
  }

  async getSummary(content, user_instruction) {
    const response = await axios.post(
      `${this.pythonApiBaseUrl}/summarize-resume`,
      {
        content,
        user_instruction: user_instruction || "",
      },
    );
    return response.data?.summary || "";
  }

  async summarizeAllResumes() {
    if (!this.user) {
      throw new Error("User object is required");
    }
    const user = this.user;

    if (!user.resumes || user.resumes.length === 0) {
      throw new Error(`No resumes found for user: ${userId}`);
    }

    // Read resume markdown files from paths stored in user.resumes
    const resumeDocuments = [];

    for (const resumePath of user.resumes) {
      if (!/\.md$/i.test(resumePath)) {
        continue;
      }

      const filePath = path.resolve(process.cwd(), resumePath);

      const content = await fs.readFile(filePath, "utf8");

      if (!content.trim()) {
        continue;
      }

      resumeDocuments.push({
        path: resumePath,
        content,
      });
    }

    if (resumeDocuments.length === 0) {
      throw new Error(`No usable markdown resumes found for user: ${userId}`);
    }

    // Prefix summarization
    let resumeSummary;

    if (resumeDocuments.length === 1) {
      const result = await this.getSummary(resumeDocuments[0].content);

      resumeSummary = result;
    } else {
      // First two resumes
      const firstContent = `
            RESUME 1:
            ${resumeDocuments[0].content}

            RESUME 2:
            ${resumeDocuments[1].content}
        `;

      const result = await this.getSummary(firstContent);

      resumeSummary = result;

      // Prefix sum with remaining resumes
      for (let i = 2; i < resumeDocuments.length; i++) {
        const content = `
                CURRENT SUMMARY:
                ${resumeSummary}

                ADDITIONAL RESUME:
                ${resumeDocuments[i].content}
            `;

        const result = await this.getSummary(content);

        resumeSummary = result;

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return resumeSummary;
  }
}

export { LLMModule };
