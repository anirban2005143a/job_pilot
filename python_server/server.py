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
from api_models.extract_user_info import ExtractUserInfoRequest

from llm.summarize.summarize_resume import summarize_resume
from llm.match_job.match_job import match_user_to_job
from llm.match_job.match_job_schema import JobMatchResult
from llm.clarify_job.clarify_job_schema import JobClarificationResult
from llm.clarify_job.clarify_job import create_job_clarification
from llm.create_resume.create_resume_schema import CreateResumeResponse
from llm.create_resume.create_resume import create_resume
from llm.create_cover_letter.create_cover_letter import create_cover_letter
from llm.extract_user_info.extract_user_info_schema import UserInformation
from llm.extract_user_info.extract_user_info_prompt import EXTRACT_USER_INFO_PROMPT
from llm.extract_user_info.extract_user_info import extract_user_information

app = FastAPI(
    title="Resume Parser API",
    description="PDF to Markdown parser",
    version="1.0.0",
)


@app.get("/")
def health():
    print("[GET /] Health check")
    result = {"status": "ok"}
    print("[GET /] Response:", result)
    return result


@app.post("/parse")
async def parse_resume(file: UploadFile = File(...)):
    print(f"[POST /parse] Request received - filename: {file.filename}")

    # Validate file type
    if not file.filename:
        print("[POST /parse] ERROR: No filename provided")
        raise HTTPException(
            status_code=400,
            detail="No filename provided",
        )

    suffix = Path(file.filename).suffix.lower()

    if suffix != ".pdf":
        print(f"[POST /parse] ERROR: Invalid file type: {suffix}")
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported",
        )

    # Read uploaded file
    content = await file.read()

    print(f"[POST /parse] File read - size: {len(content)} bytes")

    if not content:
        print("[POST /parse] ERROR: Uploaded file is empty")
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty",
        )

    temp_path = None

    try:
        print("[POST /parse] Creating temporary PDF file...")

        with tempfile.NamedTemporaryFile(
            suffix=".pdf",
            delete=False,
        ) as temp_file:
            temp_file.write(content)
            temp_path = Path(temp_file.name)

        print(f"[POST /parse] Temporary file created: {temp_path}")

        print("[POST /parse] Parsing PDF to Markdown...")

        markdown = pymupdf4llm.to_markdown(
            str(temp_path),
            use_ocr=False,
        )

        print(
            f"[POST /parse] PDF parsed successfully - "
            f"markdown length: {len(markdown)} characters"
        )

        return {
            "filename": file.filename,
            "markdown": markdown,
        }

    except Exception as e:
        print(f"[POST /parse] ERROR: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse PDF: {str(e)}",
        )

    finally:
        if temp_path and temp_path.exists():
            temp_path.unlink(missing_ok=True)
            print(f"[POST /parse] Temporary file deleted: {temp_path}")


@app.post(
    "/summarize-resume",
    response_model=ResumeSummaryResponse,
)
def api_summarize_resume(request: ResumeSummaryRequest):

    print("[POST /summarize-resume] Request received")

    try:
        print("[POST /summarize-resume] Calling summarize_resume...")

        summary = summarize_resume(
            content=request.content,
            user_instruction=request.user_instruction,
        )

        print(
            f"[POST /summarize-resume] Success - "
            f"summary length: {len(summary)} characters"
        )

        return ResumeSummaryResponse(
            summary=summary
        )

    except Exception as e:
        print(f"[POST /summarize-resume] ERROR: {e}")

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

    print("[POST /match-job] Request received")

    try:
        print("[POST /match-job] Calling match_user_to_job...")

        result = match_user_to_job(
            user_summary=request.user_summary,
            job=request.job,
            user_instruction=request.user_instruction,
        )

        print("[POST /match-job] Job matching successful")

        return result

    except ValueError as e:
        print(f"[POST /match-job] Validation ERROR: {e}")

        raise HTTPException(
            status_code=400,
            detail=str(e),
        )

    except Exception as e:
        print(f"[POST /match-job] ERROR: {e}")

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

    print("[POST /clarify-job] Request received")

    try:
        user_data = {
            "summary": request.user_data.get("summary", ""),
            "preferences": request.user_data.get("preferences", {}),
        }

        print("[POST /clarify-job] User data prepared")
        print("[POST /clarify-job] Calling create_job_clarification...")

        result = create_job_clarification(
            user_data=user_data,
            job_data=request.job_data,
            match_result=request.match_result,
        )

        print("[POST /clarify-job] Job clarification successful")

        return result

    except ValueError as e:
        print(f"[POST /clarify-job] Validation ERROR: {e}")

        raise HTTPException(
            status_code=400,
            detail=str(e),
        )

    except Exception as e:
        print(f"[POST /clarify-job] ERROR: {e}")

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

    print("[POST /create-resume] Request received")

    try:
        user_data = {
            "name": request.user_data.get("name", ""),
            "email": request.user_data.get("email", ""),
            "phone": request.user_data.get("phone", ""),
            "linkedin": request.user_data.get("linkedin", ""),
            "github": request.user_data.get("github", ""),
            "portfolio": request.user_data.get("portfolio", ""),
        }

        print(
            f"[POST /create-resume] User data prepared - "
            f"name: {user_data['name']}"
        )

        print("[POST /create-resume] Calling create_resume...")

        result = create_resume(
            user=user_data,
            resume=request.resumes,
            job=request.job_data,
            user_instruction=request.user_instruction,
        )

        print("[POST /create-resume] Resume generation successful")

        return result

    except ValueError as e:
        print(f"[POST /create-resume] Validation ERROR: {e}")

        raise HTTPException(
            status_code=400,
            detail=str(e),
        )

    except Exception as e:
        print(f"[POST /create-resume] ERROR: {e}")

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

    print("[POST /create-cover-letter] Request received")

    try:
        print("[POST /create-cover-letter] Calling create_cover_letter...")

        result = create_cover_letter(
            user=request.user_data,
            resume=request.resume,
            job=request.job_data,
            user_instruction=request.user_instruction,
        )

        print("[POST /create-cover-letter] Cover letter generation successful")

        return result

    except ValueError as e:
        print(f"[POST /create-cover-letter] Validation ERROR: {e}")

        raise HTTPException(
            status_code=400,
            detail=str(e),
        )

    except Exception as e:
        print(f"[POST /create-cover-letter] ERROR: {e}")

        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate cover letter. {e}",
        )
        

@app.post(
    "/extract-user-info",
    response_model=UserInformation,
)
async def extract_user_info_endpoint(
    request: ExtractUserInfoRequest,
):

    print("[POST /extract-user-info] Request received")

    try:
        print("[POST /extract-user-info] Calling extract_user_information...")

        result = extract_user_information(
            resume_content=request.resume,
            user_instruction=request.user_instruction,
        )

        print(
            "[POST /extract-user-info] "
            "User information extraction successful"
        )

        return result

    except ValueError as e:
        print(
            f"[POST /extract-user-info] Validation ERROR: {e}"
        )

        raise HTTPException(
            status_code=400,
            detail=str(e),
        )

    except Exception as e:
        print(
            f"[POST /extract-user-info] ERROR: {e}"
        )

        raise HTTPException(
            status_code=500,
            detail=f"Failed to extract user information. {e}",
        )