
import os
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEndpoint, ChatHuggingFace
from langchain_core.prompts import ChatPromptTemplate
from .summary_prompt import SUMMARY_PROMPT

load_dotenv()

# ---------------------------------------------------------
# Model
# ---------------------------------------------------------

llm = HuggingFaceEndpoint(
    repo_id="meta-llama/Llama-3.1-8B-Instruct",
    huggingfacehub_api_token=os.environ["HUGGINGFACEHUB_API_TOKEN5"],
    max_new_tokens=4096,
)

model = ChatHuggingFace(llm=llm)

# ---------------------------------------------------------
# Prompt
# ---------------------------------------------------------

prompt = ChatPromptTemplate.from_template(SUMMARY_PROMPT)


# ---------------------------------------------------------
# Function
# ---------------------------------------------------------

def summarize_resume(
    content: str,
    user_instruction: str = ""
) -> str:
    """
    Convert user-provided professional content into a detailed,
    job-matching-oriented professional capability profile.

    Args:
        content:
            The source content describing the user. This can be a resume,
            LinkedIn profile, experience description, project description,
            portfolio content, etc.

        user_instruction:
            Optional additional instruction controlling the summarization.

    Returns:
        A detailed professional capability profile optimized for
        matching against job descriptions.
    """

    if not content or not content.strip():
        raise ValueError("content must not be empty")

    messages = prompt.invoke({
        "content": content,
        "user_instruction": user_instruction.strip() if user_instruction else "No additional instruction."
    })

    response = model.invoke(messages)

    return response.content.strip()