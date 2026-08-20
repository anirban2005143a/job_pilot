from pydantic import BaseModel

from llm.extract_user_info.extract_user_info_schema import UserInformation


class ExtractUserInfoRequest(BaseModel):
    resume_content: str
    user_instruction: str = ""
    existing_user_info: UserInformation | dict | str | None = None,

