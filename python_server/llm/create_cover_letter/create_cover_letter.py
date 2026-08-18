import os
import json

from dotenv import load_dotenv
from pydantic import ValidationError

from langchain_huggingface import (
    HuggingFaceEndpoint,
    ChatHuggingFace,
)

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from langchain_classic.output_parsers import OutputFixingParser
from langchain_core.exceptions import OutputParserException

from .create_cover_letter_prompt import CREATE_COVER_LETTER_PROMPT
from .create_cover_letter_schema import CreateCoverLetterResponse


load_dotenv()


# =========================================================
# Model
# =========================================================

llm = HuggingFaceEndpoint(
    repo_id="meta-llama/Llama-3.1-8B-Instruct",
    huggingfacehub_api_token=os.environ["HUGGINGFACEHUB_API_TOKEN"],
    max_new_tokens=900,
    temperature=0.1,
)

model = ChatHuggingFace(llm=llm)


# =========================================================
# Pydantic Output Parser
# =========================================================

parser = PydanticOutputParser(
    pydantic_object=CreateCoverLetterResponse
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
    CREATE_COVER_LETTER_PROMPT
)


# =========================================================
# Chain
# =========================================================

create_cover_letter_chain = (
    prompt
    | model
    | fixing_parser
)


# =========================================================
# Function
# =========================================================

def create_cover_letter(
    user: dict,
    resume: str,
    job: dict,
    user_instruction: str = "",
) -> CreateCoverLetterResponse:

    if not user:
        raise ValueError("user must not be empty")

    if not resume or not resume.strip():
        raise ValueError("resume must not be empty")

    if not job:
        raise ValueError("job must not be empty")

    # -----------------------------------------------------
    # Keep only useful candidate information
    # -----------------------------------------------------

    safe_user = {
        "full_name": user.get("full_name", ""),
        "email": user.get("email", ""),
        "phone": user.get("phone", ""),
        "linkedin_url": user.get("linkedin_url", ""),
        "github_url": user.get("github_url", ""),
        "portfolio_url": user.get("portfolio_url", ""),
    }
    
    safe_job = {
        "title": job.get("title", ""),
        "company": job.get("company", ""),
        "cities": job.get("cities", []),
        "countries": job.get("countries", []),
        "is_remote": job.get("is_remote", False),
        "is_hybride": job.get("is_hybride", False),
        "is_onsite": job.get("is_onsite", False),
        "required_skills": job.get("required_skills", []),
        "description": job.get("description", ""),
    }

    # -----------------------------------------------------
    # Generate cover letter
    # -----------------------------------------------------

    try:

        result = create_cover_letter_chain.invoke(
            {
                "user_object": json.dumps(
                    safe_user,
                    indent=2,
                    ensure_ascii=False,
                    default=str,
                ),

                "existing_resume": resume.strip(),

                "job_object": json.dumps(
                    safe_job,
                    indent=2,
                    ensure_ascii=False,
                    default=str,
                ),

                "user_instruction": (
                    user_instruction.strip()
                    if user_instruction
                    else "No additional instruction."
                ),

                "format_instructions": (
                    parser.get_format_instructions()
                ),
            }
        )

        return result

    except OutputParserException as e:

        print("Cover letter output parser failed:")
        print(e)

        raise

    except ValidationError as e:

        print("Cover letter Pydantic validation failed:")
        print(e)

        raise

    except Exception as e:

        print("Failed to generate cover letter:")
        print(e)

        raise