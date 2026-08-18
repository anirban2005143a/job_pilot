from pydantic import BaseModel, Field


class CreateCoverLetterResponse(BaseModel):
    cover_letter: str = Field(
        description=(
            "ONLY the complete professional cover letter. "
            "It must be ready to copy and send. "
            "Do not include explanations, analysis, metadata, "
            "headings such as 'Cover Letter', word counts, "
            "or any text outside the actual cover letter."
        )
    )