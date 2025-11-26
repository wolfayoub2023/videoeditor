from fastapi import FastAPI

from app.routers import video

app = FastAPI(title="Video Editor API", version="0.1.0")


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    """Health check endpoint to confirm service availability."""
    return {"status": "ok"}


app.include_router(video.router, prefix="/api/v1/videos", tags=["videos"])
