CREATE_RESUME_PROMPT = """
Create one professional, ATS-friendly resume in Markdown using the
USER DATA, EXISTING RESUME, and JOB DATA provided below.

The EXISTING RESUME is the source of truth for the candidate's
professional background. It may contain information from one or
multiple original resumes.

The JOB DATA is only used to understand the target role and prioritize
relevant information from the EXISTING RESUME.

USER DATA is used for identity and contact information.

RULES:

- Never invent or assume candidate information.
- Never add a skill, technology, responsibility, qualification,
  achievement, metric, company, title, date, project, certification,
  education, or experience merely because it appears in the JOB DATA.
- Never calculate or guess years of experience.
- Never convert internship or project experience into professional
  experience.
- Preserve the factual meaning of the EXISTING RESUME.
- You may rewrite, shorten, reorder, and improve existing content.
- Prioritize experience, projects, and skills relevant to the JOB DATA.
- Use only skills supported by the EXISTING RESUME.
- Create the professional summary using only facts from the EXISTING
  RESUME.
- Avoid generic filler such as "highly motivated", "detail-oriented",
  "passionate", "results-driven", or "strong foundation".

If the EXISTING RESUME contains information from multiple resumes,
merge duplicate or overlapping information and produce ONE coherent
resume. Do not simply concatenate the content.

CONTACT INFORMATION:

Use USER DATA for name, email, phone, LinkedIn, GitHub, and portfolio.
If a value is missing from USER DATA but exists in the EXISTING RESUME,
you may use it.

Never guess or generate contact information.

When an actual email address is available, render it as a Markdown
mailto link:

[dasaniran268@gmail.com](mailto:dasaniran268@gmail.com)

When an actual LinkedIn, GitHub, or portfolio URL is available, render
it as a Markdown hyperlink:

[LinkedIn](ACTUAL_URL)
[GitHub](ACTUAL_URL)
[Portfolio](ACTUAL_URL)

Do not invent URLs.

If the source only contains a label such as "LinkedIn" or "GitHub"
without an actual URL, keep the label as plain text.

RESUME:

Create a conventional 1–2 page professional resume using sections
such as:

# Name

Contact Information

## Professional Summary

## Technical Skills

## Professional Experience

## Projects

## Education

## Achievements

## Certifications

## Competitive Programming

Only include sections for which information exists.

Use clean Markdown with headings, bullets, bold text, and Markdown
hyperlinks.

Do not use HTML, CSS, tables, emojis, icons, or code fences.

OUTPUT:

The `markdown` field must contain ONLY the actual resume.

The first content must be the candidate's name.

Do not include explanations, reasoning, notes, comments, introductions,
conclusions, or any text outside the resume.

USER DATA:
{user_object}

EXISTING RESUME:
{existing_resume}

JOB DATA:
{job_object}

ADDITIONAL USER INSTRUCTION:
{user_instruction}

{format_instructions}
"""