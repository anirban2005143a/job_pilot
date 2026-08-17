

from typing import Any, Dict
from pydantic import BaseModel, Field

class JobClarificationRequest(BaseModel):
    user_data: Dict[str, Any] = Field(
        ...,
        description="Relevant user profile and job preferences"
    )

    job_data: Dict[str, Any] = Field(
        ...,
        description="Job information"
    )

    match_result: Dict[str, Any] = Field(
        ...,
        description="Existing job match result"
    )