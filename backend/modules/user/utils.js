// utils/preferences.util.js

export const preferencesToParagraph = (preferences = {}) => {
  if (!preferences || typeof preferences !== "object") {
    return "";
  }

  const parts = [];

  if (preferences.notice_period) {
    parts.push(
      `The candidate has a notice period of ${preferences.notice_period}`
    );
  }

  if (preferences.start_date) {
    parts.push(
      `The candidate is available to start from ${new Date(
        preferences.start_date,
      ).toLocaleDateString()}`
    );
  }

  if (preferences.relocation_openness) {
    parts.push(
      `The candidate's relocation openness is ${preferences.relocation_openness}`
    );
  }

  if (preferences.employment_status) {
    parts.push(
      `The candidate is currently ${preferences.employment_status.replace(
        /_/g,
        " ",
      )}`
    );
  }

  if (preferences.has_visa) {
    parts.push(
      `The candidate has a visa: ${preferences.has_visa}`
    );
  }

  if (preferences.visa_type) {
    parts.push(
      `The candidate's visa type is ${preferences.visa_type}`
    );
  }

  if (preferences.visa_countries?.length) {
    parts.push(
      `The candidate has visa eligibility or preference for ${preferences.visa_countries.join(
        ", ",
      )}`
    );
  }

  if (preferences.work_authorization_in_current_country) {
    parts.push(
      `The candidate's work authorization in their current country is ${preferences.work_authorization_in_current_country}`
    );
  }

  if (preferences.sponsorship_requirement) {
    parts.push(
      `The candidate's sponsorship requirement is ${preferences.sponsorship_requirement.replace(
        /_/g,
        " ",
      )}`
    );
  }

  if (preferences.primary_languages?.length) {
    const languages = preferences.primary_languages
      .map(
        ({ language, proficiency }) =>
          `${language} (${proficiency})`,
      )
      .join(", ");

    parts.push(
      `The candidate's primary languages are ${languages}`
    );
  }

  if (preferences.role_experience?.length) {
    const experience = preferences.role_experience
      .map(
        ({ role, years }) =>
          `${role} (${years} years)`,
      )
      .join(", ");

    parts.push(
      `The candidate has experience in ${experience}`
    );
  }

  if (preferences.work_mode?.length) {
    parts.push(
      `The candidate prefers ${preferences.work_mode.join(
        ", ",
      )} work`
    );
  }

  if (preferences.city_preference?.length) {
    parts.push(
      `The candidate prefers working in ${preferences.city_preference.join(
        ", ",
      )}`
    );
  }

  if (preferences.country_preference?.length) {
    parts.push(
      `The candidate prefers working in ${preferences.country_preference.join(
        ", ",
      )}`
    );
  }

  if (preferences.company_preference) {
    parts.push(
      `The candidate's company preference is ${preferences.company_preference}`
    );
  }

  if (preferences.minimum_salary) {
    parts.push(
      `The candidate's minimum expected salary is ${preferences.minimum_salary}`
    );
  }

  if (preferences.customer_preference) {
    parts.push(
      `The candidate's additional preferences are: ${preferences.customer_preference}`
    );
  }

  return parts.length > 0
    ? `${parts.join(". ")}.`
    : "";
};

export const incrementUserApplicationCount = async (
  UserModel,
  user_data,
) => {
  if (!UserModel) {
    throw new Error("UserModel is required");
  }

  if (
    typeof UserModel.findByIdAndUpdate !== "function" ||
    UserModel.modelName !== "User"
  ) {
    throw new Error("Invalid UserModel");
  }

  if (!user_data) {
    throw new Error("user_data is required");
  }

  if (!user_data._id) {
    throw new Error("user_data._id is required");
  }

  const now = new Date();

  if (
    !user_data.applications_today_reset_at ||
    now >= user_data.applications_today_reset_at
  ) {
    await UserModel.findByIdAndUpdate(
      user_data._id,
      {
        $set: {
          applications_today: 1,
          applications_today_reset_at: new Date(
            now.getTime() + 24 * 60 * 60 * 1000,
          ),
        },
      },
    );

    return;
  }

  await UserModel.findByIdAndUpdate(
    user_data._id,
    {
      $inc: {
        applications_today: 1,
      },
    },
  );
};