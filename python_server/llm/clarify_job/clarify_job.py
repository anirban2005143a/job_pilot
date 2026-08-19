import json
import os

from dotenv import load_dotenv
from pydantic import ValidationError

from langchain_huggingface import (
    HuggingFaceEndpoint,
    ChatHuggingFace,
)

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.exceptions import OutputParserException
from langchain_core.output_parsers import PydanticOutputParser
from langchain_classic.output_parsers import OutputFixingParser

from .clarify_job_prompt import CLARIFICATION_PROMPT
from .clarify_job_schema import JobClarificationResult

load_dotenv()


# =========================================================
# Model
# =========================================================

llm = HuggingFaceEndpoint(
    repo_id="meta-llama/Llama-3.1-8B-Instruct",
    huggingfacehub_api_token=os.environ["HUGGINGFACEHUB_API_TOKEN3"],
    max_new_tokens=1024,
    temperature=0.1,
)

model = ChatHuggingFace(llm=llm)


# =========================================================
# Pydantic Output Parser
# =========================================================

parser = PydanticOutputParser(
    pydantic_object=JobClarificationResult
)


# =========================================================
# Output Fixing Parser
# =========================================================

fixing_parser = OutputFixingParser.from_llm(
    parser=parser,
    llm=model,
    max_retries=2,
)


# =========================================================
# Prompt
# =========================================================

prompt = ChatPromptTemplate.from_template(
    CLARIFICATION_PROMPT
)


# =========================================================
# Chain
# =========================================================

clarification_chain = prompt | model | fixing_parser


# =========================================================
# Function
# =========================================================

def create_job_clarification(
    user_data: dict,
    job_data: dict,
    match_result: dict,
) -> JobClarificationResult:

    if not user_data:
        raise ValueError("user_data must not be empty")

    if not job_data:
        raise ValueError("job_data must not be empty")

    if not match_result:
        raise ValueError("match_result must not be empty")

    try:

        result = clarification_chain.invoke({
            "user_data": json.dumps(
                user_data,
                indent=2,
                ensure_ascii=False,
            ),

            "job_data": json.dumps(
                job_data,
                indent=2,
                ensure_ascii=False,
            ),

            "match_result": json.dumps(
                match_result,
                indent=2,
                ensure_ascii=False,
            ),

            "format_instructions": (
                parser.get_format_instructions()
            ),
        })

        return result

    except OutputParserException as e:

        print("Clarification output parser failed:")
        print(e)

        raise

    except ValidationError as e:

        print("Pydantic validation failed:")
        print(e)

        raise

    except Exception as e:

        print("Failed to generate clarification:")
        print(e)

        raise