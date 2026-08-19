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
