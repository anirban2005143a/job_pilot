const fs = require("fs/promises");
const path = require("path");
const axios = require("axios");

class LLMModule {
  constructor(user) {
    if (!user) {
      throw new Error("User object is required");
    }

    this.user = user;

    this.pythonApiBaseUrl = process.env.PYTHON_API_BASE_URL;

    if (!this.pythonApiBaseUrl) {
      throw new Error("PYTHON_API_BASE_URL is required");
    }
  }

  async summarizeResume(content, job) {
    const response = await axios.post(
      `${this.pythonApiBaseUrl}/summarize-resume`,
      {
        content,
        job,
      },
    );

    return response.data;
  }

  async matchJob(job) {
    if (!this.user) {
      throw new Error("User object is required");
    }

    if (!job) {
      throw new Error("job is required");
    }

    if (!user.resumes || user.resumes.length === 0) {
      throw new Error(`No resumes found for user: ${userId}`);
    }

    const user = this.user;

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
      const result = await this.summarizeResume(
        resumeDocuments[0].content,
        job,
      );

      resumeSummary = result;
    } else {
      // First two resumes
      const firstContent = `
            RESUME 1:
            ${resumeDocuments[0].content}

            RESUME 2:
            ${resumeDocuments[1].content}
        `;

      const result = await this.summarizeResume(firstContent, job);

      resumeSummary = result;

      // Prefix sum with remaining resumes
      for (let i = 2; i < resumeDocuments.length; i++) {
        const content = `
                CURRENT SUMMARY:
                ${resumeSummary}

                ADDITIONAL RESUME:
                ${resumeDocuments[i].content}
            `;

        const result = await this.summarizeResume(content, job);

        resumeSummary = result;
      }
    }

    // Final matching API call
    const response = await axios.post(`${this.pythonApiBaseUrl}/match-job`, {
      summary: resumeSummary,
      job,
      preferences: user.preferences || [],
    });

    return response.data;
  }


}

module.exports = {LLMModule};
