export const clarificationEmailTemplate = ({
  company,
  jobTitle,
  message,
  jobId,
  frontendUrl,
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>JobPilot - Clarification Required</title>
</head>

<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background:#f4f6f8;padding:40px 20px;">
    <tr>
      <td align="center">

        <table width="600" cellpadding="0" cellspacing="0" border="0"
          style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:#111827;padding:24px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;">
                JobPilot
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:40px 32px;">

              <h2 style="margin:0 0 16px;color:#111827;font-size:22px;">
                Clarification Required
              </h2>

              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#4b5563;">
                Your job application needs your clarification before it can proceed.
              </p>

              <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin-bottom:24px;">

                <p style="margin:0 0 8px;font-size:15px;color:#374151;">
                  <strong>Company:</strong> ${company}
                </p>

                <p style="margin:0 0 8px;font-size:15px;color:#374151;">
                  <strong>Role:</strong> ${jobTitle}
                </p>

                <p style="margin:0;font-size:15px;line-height:1.6;color:#374151;">
                  ${message}
                </p>

              </div>

              <!-- Button -->
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-radius:8px;background:#2563eb;">

                    <a
                      href="${frontendUrl}/need-clarification/${jobId}"
                      target="_blank"
                      style="
                        display:inline-block;
                        padding:14px 24px;
                        color:#ffffff;
                        text-decoration:none;
                        font-size:16px;
                        font-weight:bold;
                        border-radius:8px;
                      "
                    >
                      Provide Clarification
                    </a>

                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#9ca3af;">
                If the button doesn't work, copy and paste this URL into your browser:
              </p>

              <p style="margin:8px 0 0;font-size:13px;color:#6b7280;word-break:break-all;">
                ${frontendUrl}/need-clarification/${jobId}
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                This email was sent by JobPilot.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;

export const applicationStatusEmailTemplate = ({
  status,
  company,
  jobTitle,
  message,
  jobId,
  frontendUrl,
}) => {
  const isAccepted = status === "accepted";

  const theme = isAccepted
    ? {
        background: "#ecfdf5",
        border: "#a7f3d0",
        accent: "#059669",
        accentDark: "#047857",
        iconBackground: "#d1fae5",
        icon: "✓",
        title: "Application Accepted",
        headline: "Congratulations! Your application was accepted.",
        description:
          "Great news — the employer has accepted your application. Your application journey has reached an exciting milestone.",
        buttonText: "View Application",
      }
    : {
        background: "#fef2f2",
        border: "#fecaca",
        accent: "#dc2626",
        accentDark: "#b91c1c",
        iconBackground: "#fee2e2",
        icon: "×",
        title: "Application Update",
        headline: "Your application was not selected.",
        description:
          "We're sorry to let you know that this application was not accepted. Don't be discouraged — there are always more opportunities ahead.",
        buttonText: "View Application",
      };

  const applicationUrl = `${frontendUrl}/applications/${jobId}`;

  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <title>JobPilot - ${theme.title}</title>
  </head>

  <body
    style="
      margin: 0;
      padding: 0;
      background: #f4f6f8;
      font-family: Arial, Helvetica, sans-serif;
      color: #1f2937;
    "
  >
    <table
      width="100%"
      cellpadding="0"
      cellspacing="0"
      border="0"
      style="
        background: #f4f6f8;
        padding: 40px 20px;
      "
    >
      <tr>
        <td align="center">
          <!-- Main Container -->
          <table
            width="600"
            cellpadding="0"
            cellspacing="0"
            border="0"
            style="
              max-width: 600px;
              width: 100%;
              background: #ffffff;
              border-radius: 16px;
              overflow: hidden;
            "
          >
            <!-- Header -->
            <tr>
              <td
                style="
                  background: #111827;
                  padding: 24px 32px;
                "
              >
                <table
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                >
                  <tr>
                    <td>
                      <h1
                        style="
                          margin: 0;
                          color: #ffffff;
                          font-size: 24px;
                          font-weight: 700;
                        "
                      >
                        JobPilot
                      </h1>
                    </td>

                    <td
                      align="right"
                      style="
                        color: #9ca3af;
                        font-size: 13px;
                      "
                    >
                      Application Update
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Status Banner -->
            <tr>
              <td
                style="
                  background: ${theme.background};
                  padding: 32px;
                  border-bottom: 1px solid ${theme.border};
                "
              >
                <table
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                >
                  <tr>
                    <!-- Status Icon -->
                    <td
                      style="
                        width: 52px;
                        height: 52px;
                        background: ${theme.iconBackground};
                        border-radius: 50%;
                        text-align: center;
                        vertical-align: middle;
                      "
                    >
                      <span
                        style="
                          font-size: 28px;
                          line-height: 52px;
                          font-weight: bold;
                          color: ${theme.accent};
                        "
                      >
                        ${theme.icon}
                      </span>
                    </td>

                    <!-- Status Text -->
                    <td style="padding-left: 16px;">
                      <p
                        style="
                          margin: 0 0 5px;
                          font-size: 13px;
                          font-weight: bold;
                          letter-spacing: 0.5px;
                          text-transform: uppercase;
                          color: ${theme.accent};
                        "
                      >
                        ${theme.title}
                      </p>

                      <h2
                        style="
                          margin: 0;
                          font-size: 22px;
                          line-height: 1.3;
                          color: #111827;
                        "
                      >
                        ${theme.headline}
                      </h2>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 36px 32px 40px;">
                <!-- Description -->
                <p
                  style="
                    margin: 0 0 24px;
                    font-size: 16px;
                    line-height: 1.7;
                    color: #4b5563;
                  "
                >
                  ${theme.description}
                </p>

                <!-- Job Card -->
                <table
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  style="
                    background: #f9fafb;
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                  "
                >
                  <tr>
                    <td style="padding: 20px 22px;">
                      <!-- Company -->
                      <p
                        style="
                          margin: 0 0 6px;
                          font-size: 13px;
                          font-weight: bold;
                          color: #9ca3af;
                          text-transform: uppercase;
                          letter-spacing: 0.5px;
                        "
                      >
                        Company
                      </p>

                      <p
                        style="
                          margin: 0 0 18px;
                          font-size: 17px;
                          font-weight: 600;
                          color: #111827;
                        "
                      >
                        ${company}
                      </p>

                      <!-- Position -->
                      <p
                        style="
                          margin: 0 0 6px;
                          font-size: 13px;
                          font-weight: bold;
                          color: #9ca3af;
                          text-transform: uppercase;
                          letter-spacing: 0.5px;
                        "
                      >
                        Position
                      </p>

                      <p
                        style="
                          margin: 0;
                          font-size: 17px;
                          font-weight: 600;
                          color: #111827;
                        "
                      >
                        ${jobTitle}
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- Employer Message -->
                <table
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  style="margin-top: 24px;"
                >
                  <tr>
                    <td>
                      <p
                        style="
                          margin: 0;
                          font-size: 15px;
                          line-height: 1.7;
                          color: #4b5563;
                        "
                      >
                        ${message}
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- CTA Button -->
                <table
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  style="margin-top: 30px;"
                >
                  <tr>
                    <td
                      style="
                        border-radius: 9px;
                        background: ${theme.accent};
                      "
                    >
                      <a
                        href="${applicationUrl}"
                        target="_blank"
                        style="
                          display: inline-block;
                          padding: 14px 24px;
                          color: #ffffff;
                          text-decoration: none;
                          font-size: 15px;
                          font-weight: bold;
                          border-radius: 9px;
                        "
                      >
                        ${theme.buttonText}
                      </a>
                    </td>
                  </tr>
                </table>

                <!-- Fallback URL -->
                <p
                  style="
                    margin: 24px 0 0;
                    font-size: 13px;
                    line-height: 1.5;
                    color: #9ca3af;
                  "
                >
                  If the button doesn't work, copy and paste this URL
                  into your browser:
                </p>

                <p
                  style="
                    margin: 8px 0 0;
                    font-size: 12px;
                    line-height: 1.5;
                    color: #6b7280;
                    word-break: break-all;
                  "
                >
                  ${applicationUrl}
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td
                style="
                  padding: 22px 32px;
                  background: #f9fafb;
                  border-top: 1px solid #e5e7eb;
                "
              >
                <p
                  style="
                    margin: 0 0 6px;
                    font-size: 13px;
                    font-weight: 600;
                    color: #374151;
                    text-align: center;
                  "
                >
                  JobPilot
                </p>

                <p
                  style="
                    margin: 0;
                    font-size: 12px;
                    line-height: 1.5;
                    color: #9ca3af;
                    text-align: center;
                  "
                >
                  This email was sent because the status of your
                  job application changed.
                </p>
              </td>
            </tr>
          </table>
          <!-- End Main Container -->
        </td>
      </tr>
    </table>
  </body>
</html>
  `;
};
