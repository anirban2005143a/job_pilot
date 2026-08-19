from pydantic import BaseModel

from llm.extract_user_info.extract_user_info_schema import UserInformation


class ExtractUserInfoRequest(BaseModel):
    resume: str
    user_instruction: str = ""

