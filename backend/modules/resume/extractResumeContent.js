import axios from "axios";
import FormData from "form-data";
import { getenv } from "../../config/env.js";

const PYTHON_SERVER_BASE_URL = getenv("PYTHON_SERVER_BASE_URL") || "http://localhost:8000";

export const extractResumeContent = async (file) => {
  if (!file) {
    throw new Error("Resume file is required");
  }

  if (!file.buffer) {
    throw new Error("Resume file buffer is missing");
  }

  const formData = new FormData();

  formData.append("file", file.buffer, {
    filename: file.originalname || "resume.pdf",
    contentType: file.mimetype || "application/pdf",
  });

  try {
    const response = await axios.post(
      `${PYTHON_SERVER_BASE_URL}/parse`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },

        // Adjust this if you want to support very large resumes.
        maxContentLength: Infinity,
        maxBodyLength: Infinity,

        // Optional timeout.
        timeout: 60_000,
      }
    );

    if (!response.data?.markdown) {
      throw new Error(
        "Resume parser did not return markdown content"
      );
    }

    return response.data.markdown;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const parserMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message;

      throw new Error(
        `Resume parsing failed: ${parserMessage}`
      );
    }

    throw error;
  }
};
