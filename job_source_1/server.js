import express from "express";
import fs from "fs/promises";
import { uuid } from "uuidv4";

const app = express();
app.use(express.json());

const PORT = 5001;

const JOBS_FILE = "./jobs.json";
const APPLICATIONS_FILE = "./applications.json";
const LOGS_FILE = "./logs.txt";

// -------------------------
// Helpers
// -------------------------

async function readJson(file) {
  try {
    const data = await fs.readFile(file, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeJson(file, data) {
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

async function addLog(level, event, message, metadata = {}) {
  const timestamp = new Date().toISOString();

  const extra = Object.entries(metadata)
    .map(([key, value]) => `${key}=${value}`)
    .join(" ");

  const line =
    `[${timestamp}] [${level}] [${event}] ${message}` +
    (extra ? ` | ${extra}` : "") +
    "\n";

  await fs.appendFile(LOGS_FILE, line);
}

// -------------------------
// GET /jobs
// -------------------------

app.get("/jobs", async (req, res) => {
  try {
    const jobs = await readJson(JOBS_FILE);

    // Pick 10 random jobs
    const randomJobs = jobs
      .sort(() => Math.random() - 0.5)
      .slice(0, 10);

    await addLog(
      "INFO",
      "JOBS_FETCHED",
      `Fetched ${randomJobs.length} random jobs`
    );

    res.json({
      jobs: randomJobs,
    });
  } catch (error) {
    await addLog("ERROR", "JOBS_FETCH_FAILED", "Failed to fetch jobs", {
      error: error.message,
    });

    res.status(500).json({
      error: "Failed to fetch jobs",
    });
  }
});

// -------------------------
// POST /apply
// -------------------------

app.post("/apply", async (req, res) => {
  try {
    const { job_id, user_id, name, email, resume, cover_letter } = req.body;

    const jobs = await readJson(JOBS_FILE);

    // Check job exists
    const job = jobs.find((job) => String(job.id) === String(job_id));

    if (!job) {
      await addLog("WARN", "APPLICATION_FAILED", "Job not found", {
        job_id,
        user_id,
      });

      return res.status(404).json({
        error: "Job not found",
      });
    }

    const applications = await readJson(APPLICATIONS_FILE);

    // Prevent duplicate application
    const alreadyApplied = applications.find(
      (application) =>
        application.job_id === job_id && application.user_id === user_id,
    );

    if (alreadyApplied) {
      await addLog("WARN", "APPLICATION_DUPLICATE", "Duplicate application", {
        job_id,
        user_id,
      });

      return res.status(409).json({
        error: "Already applied to this job",
        application_id: alreadyApplied.application_id,
      });
    }

    const application = {
      application_id: uuid(),
      job_id,
      user_id,
      name,
      email,
      resume,
      cover_letter,
      status: "pending",
      applied_at: new Date().toISOString(),
    };

    applications.push(application);

    await writeJson(APPLICATIONS_FILE, applications);

    await addLog("INFO", "APPLICATION_SUBMITTED", "Application submitted", {
      application_id: application.application_id,
      job_id,
      user_id,
    });

    res.status(201).json({
      application_id: application.application_id,
      status: "pending",
    });
  } catch (error) {
    await addLog("ERROR", "APPLICATION_ERROR", "Failed to submit application", {
      error: error.message,
    });

    res.status(500).json({
      error: "Failed to submit application",
    });
  }
});

// -------------------------
// GET /status
// -------------------------

app.get("/status", async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({
        error: "user_id is required",
      });
    }

    const applications = await readJson(APPLICATIONS_FILE);

    const userApplications = applications.filter(
      (application) => application.user_id === user_id,
    );

    await addLog(
      "INFO",
      "STATUS_FETCHED",
      `Fetched ${userApplications.length} applications`,
      {
        user_id,
      },
    );

    res.json({
      applications: userApplications,
    });
  } catch (error) {
    await addLog(
      "ERROR",
      "STATUS_FETCH_FAILED",
      "Failed to fetch application status",
      {
        error: error.message,
      },
    );

    res.status(500).json({
      error: "Failed to fetch application status",
    });
  }
});

// -------------------------
// Start server
// -------------------------

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Mock Job Source running on http://localhost:${PORT}`);
  });
}

export default app;
