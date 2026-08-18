from pydantic import BaseModel, Field
from typing import Any

class CreateResumeRequest(BaseModel):
    user_data: dict
    resumes: str
    job_data: dict
    user_instruction: str = ""