from fastapi import FastAPI, UploadFile, File, HTTPException
import pymupdf4llm
import pymupdf
import tempfile
from pathlib import Path

from api_models.summarize_resume import ResumeSummaryRequest, ResumeSummaryResponse
from api_models.match_job import MatchJobRequest
from api_models.clarify_job import JobClarificationRequest
from api_models.create_resume import CreateResumeRequest
from api_models.create_cover_letter import CreateCoverLetterRequest,CreateCoverLetterResponse
from llm.summarize.summarize_resume import summarize_resume
from llm.match_job.match_job import match_user_to_job
from llm.match_job.match_job_schema import JobMatchResult
from llm.clarify_job.clarify_job_schema import JobClarificationResult
from llm.clarify_job.clarify_job import create_job_clarification
from llm.create_resume.create_resume_schema import CreateResumeResponse
from llm.create_resume.create_resume import create_resume
from llm.create_cover_letter.create_cover_letter import create_cover_letter


app = FastAPI(
    title="Resume Parser API",
    description="PDF to Markdown parser",
    version="1.0.0",
)


@app.get("/")
def health():
    return {"status": "ok"}


@app.post("/parse")
async def parse_resume(file: UploadFile = File(...)):
    # Validate file type
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No filename provided",
        )

    suffix = Path(file.filename).suffix.lower()

    if suffix != ".pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported",
        )

    # Read uploaded file
    content = await file.read()

    if not content:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty",
        )

    temp_path = None

    try:
        # Save temporarily because pymupdf4llm works with a PDF path
        with tempfile.NamedTemporaryFile(
            suffix=".pdf",
            delete=False,
        ) as temp_file:
            temp_file.write(content)
            temp_path = Path(temp_file.name)

        # Parse PDF → Markdown
        markdown = pymupdf4llm.to_markdown(
            str(temp_path),
            use_ocr=False,
        )

        return {
            "filename": file.filename,
            "markdown": markdown,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse PDF: {str(e)}",
        )

    finally:
        # Delete temporary file
        if temp_path and temp_path.exists():
            temp_path.unlink(missing_ok=True)

@app.post(
    "/summarize-resume",
    response_model=ResumeSummaryResponse,
)
def api_summarize_resume(request: ResumeSummaryRequest):

    try:
        summary = summarize_resume(
            content=request.content,
            user_instruction=request.user_instruction,
        )

        return ResumeSummaryResponse(
            summary=summary
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to summarize resume: {str(e)}",
        )
        
@app.post(
    "/match-job",
    response_model=JobMatchResult,
)
def match_job(
    request: MatchJobRequest,
):

    try:

        result = match_user_to_job(
            user_summary=request.user_summary,
            job=request.job,
            user_instruction=request.user_instruction,
        )

        return result

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e),
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Job matching failed: {str(e)}",
        )
        
       
@app.post(
    "/clarify-job",
    response_model=JobClarificationResult,
)
def generate_job_clarification(
    request: JobClarificationRequest,
) -> JobClarificationResult:

    try:
        user_data = {
            "summary": request.user_data.get("summary", ""),
            "preferences": request.user_data.get("preferences", {}),
        }

        return create_job_clarification(
            user_data=user_data,
            job_data=request.job_data,
            match_result=request.match_result,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Failed to generate job clarification.",
        )
        
        
@app.post(
    "/create-resume",
    response_model=CreateResumeResponse,
)
def generate_resume(
    request: CreateResumeRequest,
) -> CreateResumeResponse:

    try:
        user_data = {
            "name": request.user_data.get("name", ""),
            "email": request.user_data.get("email", ""),
            "phone": request.user_data.get("phone", ""),
            "linkedin": request.user_data.get("linkedin", ""),
            "github": request.user_data.get("github", ""),
            "portfolio": request.user_data.get("portfolio", ""),
        }
        
        return create_resume(
            user=user_data,
            resume=request.resumes,
            job=request.job_data,
            user_instruction=request.user_instruction,
        )

    except ValueError as e:
        print(e)
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )

    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate resume. {e}",
        )
        

@app.post(
    "/create-cover-letter",
    response_model=CreateCoverLetterResponse,
)
async def create_cover_letter_endpoint(
    request: CreateCoverLetterRequest,
):
    try:
        result = create_cover_letter(
            user=request.user_data,
            resume=request.resume,
            job=request.job_data,
            user_instruction=request.user_instruction,
        )

        return result

    except ValueError as e:
        print(e)
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )

    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate resume. {e}",
        )