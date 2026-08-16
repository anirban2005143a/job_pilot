from pydantic import BaseModel, Field
from typing import Any

class MatchJobRequest(BaseModel):

    user_summary: str = Field(
        ...,
        description="Summary/profile of the candidate",
    )

    job: dict[str, Any] = Field(
        ...,
        description="Job object",
    )

    user_instruction: str = Field(
        default="",
        description="Optional additional instruction",
    )