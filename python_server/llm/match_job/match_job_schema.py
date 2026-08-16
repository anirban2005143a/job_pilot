from enum import Enum
from pydantic import BaseModel, Field


class MatchResult(str, Enum):
    DIRECT_APPLY = "direct_apply"
    NEEDS_CLARIFICATION = "needs_clarification"
    REJECT = "reject"


class JobMatchResult(BaseModel):
    result: MatchResult = Field(
        description="Final job matching decision"
    )

    match_score: int = Field(
        ge=0,
        le=100,
        description="Overall match score from 0 to 100"
    )

    reason: str = Field(
        description=(
            "Explain why the decision was made using the most important "
            "matching skills, experience, and any meaningful gaps. "
            "Do not give a generic statement."
        )
    )

    matching_skills: list[str] = Field(
        default_factory=list,
        description="Skills and qualifications matching the job"
    )

    missing_or_unclear: list[str] = Field(
        default_factory=list,
        description="Information that is missing or unclear from the professional summary"

    )

    critical_gaps: list[str] = Field(
        default_factory=list,
        description="Critical requirements that the candidate does not satisfy"
    )

    future_work_experience: str = Field(
        description=(
            "A concise 3 to 4 line explanation of the type of work "
            "the candidate would likely perform if selected for this job"
        )
    )