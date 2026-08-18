from pydantic import BaseModel


class CreateCoverLetterRequest(BaseModel):
    user_data: dict
    resume: str
    job_data: dict
    user_instruction: str = ""


class CreateCoverLetterResponse(BaseModel):
    cover_letter: str