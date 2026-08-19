import { Novu } from "@novu/api";
import { getenv } from "../../config/env.js";
import { applicationStatusEmailTemplate, clarificationEmailTemplate } from "./notification.template.js";

const novu = new Novu({
  secretKey: getenv("NOVU_SECRET_KEY"),
});

export const subscribeUserToNovu = async (user) => {
  if (!user) {
    throw new Error("user not found");
  }

  const subscriberId = user._id.toString();

  await novu.subscribers.create({
    subscriberId,
    email: user.email,
  });

  console.log(`User ${subscriberId} subscribed to Novu`);
};

export const createClarificationEmail = (data) => {
  if (!data || typeof data !== "object") {
    throw new Error("Email template data is required");
  }

  const requiredFields = [
    "company",
    "jobTitle",
    "message",
    "jobId",
    "frontendUrl",
  ];

  const missingFields = requiredFields.filter(
    (field) =>
      data[field] === undefined || data[field] === null || data[field] === "",
  );

  if (missingFields.length > 0) {
    throw new Error(
      `Missing required email template fields: ${missingFields.join(", ")}`,
    );
  }
  return clarificationEmailTemplate(data);
};

export const createApplicationStatusEmail = (data) => {
  if (!data || typeof data !== "object") {
    throw new Error("Application status email template data is required");
  }

  const requiredFields = [
    "status",
    "company",
    "jobTitle",
    "message",
    "jobId",
    "frontendUrl",
  ];

  const missingFields = requiredFields.filter(
    (field) =>
      data[field] === undefined || data[field] === null || data[field] === "",
  );

  if (missingFields.length > 0) {
    throw new Error(
      `Missing required email template fields: ${missingFields.join(", ")}`,
    );
  }

  const normalizedStatus = data.status.toLowerCase();

  if (!["accepted", "rejected"].includes(normalizedStatus)) {
    throw new Error(
      `Invalid application status for notification: ${data.status}`,
    );
  }

  return applicationStatusEmailTemplate({
    ...data,

    status: normalizedStatus,
  });
};
