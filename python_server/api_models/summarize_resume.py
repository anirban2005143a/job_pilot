from pydantic import BaseModel, Field

# =========================================================
# Request / Response Models
# =========================================================

class ResumeSummaryRequest(BaseModel):
    content: str = Field(
        ...,
        min_length=1,
        description="Resume or professional content to summarize.",
    )

    user_instruction: str = Field(
        default="",
        description="Optional instruction controlling the summarization.",
    )


class ResumeSummaryResponse(BaseModel):
    summary: str
