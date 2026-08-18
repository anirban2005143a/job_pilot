from pydantic import BaseModel, Field


class CreateResumeResponse(BaseModel):
    resume: str = Field(
        description=(
           "ONLY the complete resume in Markdown format. "
            "Must begin with the candidate's name and contain no "
            "explanation, commentary, metadata, introduction, conclusion, "
            "PDF-generation statement, ATS statement, or any text that "
            "is not part of the actual resume."
        )
    )