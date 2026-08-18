CREATE_COVER_LETTER_PROMPT = """
Write a professional, natural cover letter for the target job.

Use the EXISTING RESUME as the source of truth for the candidate.

IMPORTANT:
- Never invent or infer candidate experience.
- Never treat job requirements as candidate skills.
- Never claim the candidate has experience with something only because
  it appears in the job description.
- Preserve where information comes from in the resume.

The resume has different sections. Respect them:

EXPERIENCE = actual professional work experience.
PROJECTS = project experience.
TECHNICAL SKILLS = technologies/tools the candidate knows.
Do not turn a Technical Skill into professional experience unless the
Experience or Projects section explicitly supports it.

For example:
- TypeScript can be mentioned as a skill, and its use at Google can
  be mentioned as professional experience.
- React.js can be mentioned as a skill and its use in Code Fusion can
  be mentioned as project experience.
- Next.js can be mentioned as a skill and its use in JobPilot can be
  mentioned as project experience.
- AWS must NOT be mentioned because it is not in the resume.
- REST APIs, OAuth2, JWT, Jest, Playwright, Cypress, GitHub Actions,
  CI/CD, and web security must NOT be claimed because they are not
  explicitly supported by the resume.
- Do not claim 2+ years of professional experience. The resume shows
  a Google internship from May 2026 to July 2026.

Use JOB DATA only to identify which existing candidate experience,
projects, and skills are relevant to the role.

Do not copy the job description.

Do not invent reasons for wanting the company.
Do not mention company facts such as customer numbers unless the
candidate has a genuine, explicitly stated reason to mention them.

Write 250–350 words in 3–4 paragraphs.

Focus on:
- Google experience with Java and TypeScript.
- Relevant frontend/interface work at Google.
- Code Fusion and its React.js, MongoDB, Yjs, Socket.IO experience.
- JobPilot and its FastAPI, Next.js, Socket.IO, and AI/LLM experience.
- Other resume skills that genuinely match the job.

Do not repeat the same information.

Avoid generic phrases such as:
"ideal candidate", "perfect fit", "proven track record",
"passionate about", "thrilled to apply", "strong foundation",
"I am impressed by", or "make a significant contribution".

Return ONLY the finished cover letter.

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