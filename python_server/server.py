from fastapi import FastAPI, UploadFile, File, HTTPException
import pymupdf4llm
import pymupdf
import tempfile
from pathlib import Path

from api_models.summarize_resume import ResumeSummaryRequest, ResumeSummaryResponse
from llm.summarize.summarize_resume import summarize_resume

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