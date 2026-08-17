import pLimit from "p-limit";
import { JobRepository } from "../job/job.repository.js";
import User from "../user/user.model.js";
import { LLMModule } from "../llm/llm.js";
import { schedulerQueue } from "../jobScheduler/scheduler.queue.js";
import { clarificationQueue } from "../needsClarification/clarification.queue.js";
import { rejectQueue } from "../rejectedJob/reject.queue.js";
import { JobMatch } from "../job/jobMatch.model.js";

const limit = pLimit(5);

export class MatchingPipeline {
  constructor() {
    this.jobRepository = new JobRepository();
  }

  async process(jobId) {
    const job = await this.jobRepository.getJobById(jobId);

    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    const users = await User.find({
      status: "active",
    });

    console.log(`[Matching Pipeline] Processing Job id ${jobId}`);

    await Promise.all(
      users.map((user) =>
        limit(async () => {
          const result = await new LLMModule(user).matchJob(job);

          await JobMatch.findOneAndUpdate(
            {
              jobId: job._id,
              userId: user._id,
            },
            {
              ...result,
            },
            {
              upsert: true,
              new: true,
            },
          );

          console.log(
            `[Matching Pipeline] Match result of Job=${job._id} with user-${user._id} : \n`,
            result,
          );

          if (result.result === "direct_apply") {
            await schedulerQueue.add("schedule-job", {
              jobId: job._id.toString(),
              userId: user._id.toString(),
            });
          } else if (result.result === "reject") {
            await rejectQueue.add("reject-job", {
              jobId: job._id.toString(),
              userId: user._id.toString(),
            });
          } else if (result.result === "needs_clarification") {
            await clarificationQueue.add("clarify-job", {
              jobId: job._id.toString(),
              userId: user._id.toString(),
            });
          }
        }),
      ),
    );
  }
}
