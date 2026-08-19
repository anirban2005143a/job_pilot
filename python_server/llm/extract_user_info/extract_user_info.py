import json
import os

from dotenv import load_dotenv

from langchain_huggingface import (
    HuggingFaceEndpoint,
    ChatHuggingFace,
)

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from langchain_classic.output_parsers import OutputFixingParser

# from .extract_user_info_prompt import EXTRACT_USER_INFO_PROMPT
# from .extract_user_info_schema import UserInformation


load_dotenv()


llm = HuggingFaceEndpoint(
    repo_id="meta-llama/Llama-3.1-8B-Instruct",
    huggingfacehub_api_token=os.environ["HUGGINGFACEHUB_API_TOKEN1"],
    max_new_tokens=1024,
    temperature=0.1,
)

model = ChatHuggingFace(llm=llm)


parser = PydanticOutputParser(
    pydantic_object=UserInformation
)


fixing_parser = OutputFixingParser.from_llm(
    parser=parser,
    llm=model,
    max_retries=2,
)


prompt = ChatPromptTemplate.from_template(
    EXTRACT_USER_INFO_PROMPT
)


extract_user_info_chain = prompt | model | fixing_parser


def _normalize_existing_user_info(
    existing_user_info: UserInformation | dict | str | None,
) -> str:
    """
    Convert existing user information into a predictable JSON string
    before sending it to the LLM.
    """

    if existing_user_info is None:
        return "{}"

    if isinstance(existing_user_info, UserInformation):
        return existing_user_info.model_dump_json(indent=2)

    if isinstance(existing_user_info, dict):
        return json.dumps(
            existing_user_info,
            ensure_ascii=False,
            indent=2,
        )

    if isinstance(existing_user_info, str):
        existing_user_info = existing_user_info.strip()

        if not existing_user_info:
            return "{}"

        # If the caller already supplied JSON, preserve it.
        try:
            parsed = json.loads(existing_user_info)

            return json.dumps(
                parsed,
                ensure_ascii=False,
                indent=2,
            )

        except json.JSONDecodeError:
            # Keep backward compatibility if somebody passes
            # plain text instead of JSON.
            return existing_user_info

    raise TypeError(
        "existing_user_info must be UserInformation, dict, str, or None"
    )


def extract_user_information(
    resume_content: str,
    existing_user_info: UserInformation | dict | str | None = None,
    user_instruction: str = "",
) -> UserInformation:

    if not resume_content or not resume_content.strip():
        raise ValueError("resume_content must not be empty")

    existing_user_info_content = _normalize_existing_user_info(
        existing_user_info
    )

    result = extract_user_info_chain.invoke(
        {
            "resume_content": resume_content.strip(),

            "existing_user_info": existing_user_info_content,

            "user_instruction": (
                user_instruction.strip()
                if user_instruction
                else ""
            ),

            "format_instructions": parser.get_format_instructions(),
        }
    )

    return result