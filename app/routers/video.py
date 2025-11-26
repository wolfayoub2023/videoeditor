from pathlib import Path
import tempfile
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse

from app.services.ffmpeg import extract_metadata, run_trim, run_resize
from app.services.files import save_upload_file, schedule_cleanup

router = APIRouter()


@router.post("/trim")
async def trim_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    start_time: str = Form(..., description="Start timestamp (e.g. 00:00:05)"),
    duration: Optional[str] = Form(None, description="Duration to keep (e.g. 5 for 5 seconds)"),
) -> FileResponse:
    """Trim a clip from the uploaded video and return the processed file."""
    if not start_time:
        raise HTTPException(status_code=400, detail="start_time is required")

    input_path = await save_upload_file(file)
    output_path = Path(tempfile.mkstemp(suffix=Path(file.filename).suffix or ".mp4")[1])

    try:
        run_trim(input_path, output_path, start_time=start_time, duration=duration)
    except RuntimeError as exc:  # pragma: no cover - defensive
        schedule_cleanup(background_tasks, [input_path, output_path])
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    schedule_cleanup(background_tasks, [input_path, output_path])
    return FileResponse(path=output_path, filename=output_path.name)


@router.post("/resize")
async def resize_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    width: int = Form(..., description="Target width"),
    height: int = Form(..., description="Target height"),
) -> FileResponse:
    """Resize the uploaded video to the requested width and height."""
    if width <= 0 or height <= 0:
        raise HTTPException(status_code=400, detail="width and height must be positive integers")

    input_path = await save_upload_file(file)
    output_path = Path(tempfile.mkstemp(suffix=Path(file.filename).suffix or ".mp4")[1])

    try:
        run_resize(input_path, output_path, width=width, height=height)
    except RuntimeError as exc:  # pragma: no cover - defensive
        schedule_cleanup(background_tasks, [input_path, output_path])
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    schedule_cleanup(background_tasks, [input_path, output_path])
    return FileResponse(path=output_path, filename=output_path.name)


@router.post("/metadata")
async def video_metadata(file: UploadFile = File(...)) -> dict:
    """Return ffprobe metadata for the uploaded file."""
    input_path = await save_upload_file(file)
    try:
        return extract_metadata(input_path)
    finally:
        input_path.unlink(missing_ok=True)
