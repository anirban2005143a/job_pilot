import os

from dotenv import load_dotenv

from langchain_huggingface import (
    HuggingFaceEndpoint,
    ChatHuggingFace,
)

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from langchain_classic.output_parsers import OutputFixingParser

from .extract_user_info_prompt import EXTRACT_USER_INFO_PROMPT
from .extract_user_info_schema import UserInformation


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


def extract_user_information(
    resume_content: str,
    user_instruction: str = "",
) -> UserInformation:

    if not resume_content or not resume_content.strip():
        raise ValueError("resume_content must not be empty")

    result = extract_user_info_chain.invoke(
        {
            "resume_content": resume_content.strip(),
            "user_instruction": user_instruction.strip(),
            "format_instructions": parser.get_format_instructions(),
        }
    )

    return result