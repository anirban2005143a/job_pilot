import fs from "fs/promises";
import path from "path";

export const loadResumes = async (relativeResumePaths = []) => {
  if (!Array.isArray(relativeResumePaths)) {
    throw new Error("relativeResumePaths must be an array");
  }
  const resumes = [];

  for (const relativeResumePath of relativeResumePaths) {
    if (!/\.md$/i.test(relativeResumePath)) {
      continue;
    }

    const filePath = path.resolve(process.cwd(), relativeResumePath);

    try {
      const content = await fs.readFile(filePath, "utf8");

      if (content.trim()) {
        resumes.push(content);
      }
    } catch (error) {
      console.error(
        `[Resume] Failed to read ${relativeResumePath}:`,
        error.message,
      );
    }
  }

  if (resumes.length === 0) {
    throw new Error("No usable markdown resumes found");
  }

  return resumes;
};
