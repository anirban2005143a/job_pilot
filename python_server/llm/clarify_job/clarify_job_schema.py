from typing import List, Literal
from pydantic import BaseModel, Field


class ClarificationPoint(BaseModel):

    title: str = Field(
        description=(
            "Short, clear title describing the main issue."
        )
    )

    summary: str = Field(
        description=(
            "A concise explanation combining the relevant user "
            "preference or information, the relevant job requirement "
            "or condition, and why they may not align. Address the "
            "person directly using 'you' and 'your'. Never use "
            "'the candidate' or 'the user'. Keep this concise and "
            "easy to understand."
        )
    )
    

class JobClarificationResult(BaseModel):

    summary: str = Field(
        description=(
            "A very concise overall summary of the main factors "
            "that may affect the application decision. Address "
            "the person using 'you' and 'your'."
        )
    )

    clarification_points: List[ClarificationPoint] = Field(
        default_factory=list,
        description=(
            "Short, ordered list of the most important factors "
            "the person should consider before applying."
        )
    )