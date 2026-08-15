import fs from "fs/promises";
import path from "path";
import User from "./user.model.js";

export const uploadResumeController = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please upload at least one resume",
      });
    }

    const userId = req.user._id;

    const userResumeDir = path.join(
      process.cwd(),
      "uploads",
      "resumes",
      userId.toString()
    );

    await fs.mkdir(userResumeDir, {
      recursive: true,
    });

    const resumePaths = [];

    for (const file of req.files) {
      // Keep original filename
      const filename = path.basename(file.originalname);

      const resumePath = path.join(
        userResumeDir,
        filename
      );

      // Save original resume
      await fs.writeFile(
        resumePath,
        file.buffer
      );

      // Extract resume text/content
      const content = await extractResumeContent(file);

      // Save extracted content as Markdown
      const markdownFilename = `${path.parse(filename).name}.md`;

      const markdownPath = path.join(
        userResumeDir,
        markdownFilename
      );

      await fs.writeFile(
        markdownPath,
        content,
        "utf-8"
      );

      // Path stored in MongoDB
      const relativePath = path
        .join(
          "uploads",
          "resumes",
          userId.toString(),
          filename
        )
        .replaceAll("\\", "/");

      resumePaths.push(relativePath);
    }

    // Update user's resumes
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $push: {
          resumes: {
            $each: resumePaths,
          },
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      message: "Resume(s) uploaded successfully",
    });
  } catch (error) {
    console.error("Upload resume error:", error);

    return res.status(500).json({
      message: "Failed to upload resume",
      error: error.message,
    });
  }
};

export const addPreferenceController = async (req, res) => {
  try {
    const { preferences } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $addToSet: {
          preferences: {
            $each: preferences,
          },
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      message: "Preferences added successfully",
      preferences: user.preferences,
    });
  } catch (error) {
    console.error("Add preference error:", error);

    return res.status(500).json({
      message: "Failed to add preferences",
      error: error.message,
    });
  }
};

const extractResumeContent = async (file) => {
  return "new things";
};