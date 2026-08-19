import os
import json
from enum import Enum

from dotenv import load_dotenv
from pydantic import BaseModel, Field, ValidationError

from langchain_huggingface import (
    HuggingFaceEndpoint,
    ChatHuggingFace,
)

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.exceptions import OutputParserException
from langchain_core.output_parsers import PydanticOutputParser
from langchain_classic.output_parsers import OutputFixingParser

from .match_job_prompt import MATCH_PROMPT
from .match_job_schema import JobMatchResult


load_dotenv()

# ---------------------------------------------------------
# Model
# ---------------------------------------------------------

llm = HuggingFaceEndpoint(
    repo_id="meta-llama/Llama-3.1-8B-Instruct",
    huggingfacehub_api_token=os.environ["HUGGINGFACEHUB_API_TOKEN4"],
    max_new_tokens=1024,
    temperature=0.1,
)

model = ChatHuggingFace(llm=llm)


# =========================================================
# Pydantic Output Parser
# =========================================================

parser = PydanticOutputParser(
    pydantic_object=JobMatchResult
)


# =========================================================
# Output Fixing Parser
# =========================================================

fixing_parser = OutputFixingParser.from_llm(
    parser=parser,
    llm=model,
    max_retries=2,
)


# ---------------------------------------------------------
# Prompt
# ---------------------------------------------------------

prompt = ChatPromptTemplate.from_template(MATCH_PROMPT)

# =========================================================
# Chain
# =========================================================

match_chain = prompt | model | fixing_parser

# ---------------------------------------------------------
# Function
# ---------------------------------------------------------

def match_user_to_job(
    user_summary: str,
    job: dict,
    user_instruction: str = "",
) -> JobMatchResult:

    if not user_summary or not user_summary.strip():
        raise ValueError("user_summary must not be empty")

    if not job:
        raise ValueError("job must not be empty")

    try:

        result = match_chain.invoke({
            "user_summary": user_summary.strip(),

            "job_object": json.dumps(
                job,
                indent=2,
                ensure_ascii=False,
            ),

            "user_instruction": (
                user_instruction.strip()
                if user_instruction
                else "No additional instruction."
            ),

            "format_instructions": (
                parser.get_format_instructions()
            ),
        })

        # print(result.result.value)
        # print(result.match_score)
        # print(result.reason)
        # print(result.matching_skills)
        # print(result.missing_or_unclear)
        # print(result.critical_gaps)
        # print(result.future_work_experience)

        return result

    except OutputParserException as e:

        print("Output parser failed:")
        print(e)

        raise

    except ValidationError as e:

        print("Pydantic validation failed:")
        print(e)

        raise

    except Exception as e:

        print("Failed to parse model output:")
        print(e)

        raise