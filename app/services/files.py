import tempfile
from pathlib import Path

from fastapi import BackgroundTasks, UploadFile


async def save_upload_file(upload: UploadFile) -> Path:
    """Persist an uploaded file to a temporary location and return the path."""
    target_suffix = Path(upload.filename or "upload").suffix or ".bin"
    with tempfile.NamedTemporaryFile(delete=False, suffix=target_suffix) as temp_file:
        contents = await upload.read()
        temp_file.write(contents)
        return Path(temp_file.name)


def schedule_cleanup(background_tasks: BackgroundTasks | None, paths: list[Path]) -> None:
    """Schedule cleanup for temporary files."""
    def _remove(path: Path) -> None:
        path.unlink(missing_ok=True)

    tasks = background_tasks or BackgroundTasks()
    for path in paths:
        tasks.add_task(_remove, path)
