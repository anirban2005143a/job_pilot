import express from "express";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";

const app = express();
app.use(express.json());

const PORT = 5001;

const JOBS_FILE = "./test_jobs.json";
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
function getRandomItems(array, count) {
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
}

app.get("/jobs", async (req, res) => {
  try {
    const jobs = await readJson(JOBS_FILE);

    // Pick k random jobs
    const randomJobs = getRandomItems(jobs, 3);

    await addLog(
      "INFO",
      "JOBS_FETCHED",
      `Fetched ${randomJobs.length} random jobs`,
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

    // Random status for storage
    const statuses = ["pending", "accepted", "rejected"];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    const application = {
      application_id: uuidv4(),
      job_id,
      user_id,
      name,
      email,
      resume,
      cover_letter,
      // Random status is stored in the file
      status: randomStatus,
      applied_at: new Date().toISOString(),
    };

    applications.push(application);

    await writeJson(APPLICATIONS_FILE, applications);

    await addLog("INFO", "APPLICATION_SUBMITTED", "Application submitted", {
      application_id: application.application_id,
      job_id,
      user_id,
      stored_status: randomStatus,
    });

    // But always return pending to the client
    res.status(201).json({
      application_id: application.application_id,
      job_id: job_id,
      user_id: user_id,
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

app.get("/check-status", async (req, res) => {
  try {
    const { user_id, job_id } = req.query;

    if (!user_id || !job_id) {
      return res.status(400).json({
        error: "user_id and job_id are required",
      });
    }

    const applications = await readJson(APPLICATIONS_FILE);

    const application = applications.find(
      (application) =>
        application.user_id === user_id && application.job_id === job_id,
    );

    if (!application) {
      return res.status(404).json({
        error: "Application not found",
      });
    }

    await addLog(
      "INFO",
      "STATUS_FETCHED",
      `Fetched application status: ${application.status}`,
      {
        user_id,
        job_id,
        status: application.status,
      },
    );

    return res.json({
      user_id,
      job_id,
      status: application.status,
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

    return res.status(500).json({
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
