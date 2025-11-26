# Video Editor API

A minimal FastAPI-powered video editing API using FFmpeg. It supports trimming, resizing, and extracting metadata from uploaded
video files. A React-powered template builder is included to help you assemble curl commands for each workflow.

## Prerequisites
- Python 3.11+
- FFmpeg/ffprobe available on your system PATH
- Node.js 18+ (for the optional React UI)

## Installation
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Running the API
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Available endpoints
- `GET /health`: simple health check
- `POST /api/v1/videos/trim`: trim a clip from an uploaded video (form fields: `file`, `start_time`, optional `duration`)
- `POST /api/v1/videos/resize`: resize an uploaded video to given `width` and `height`
- `POST /api/v1/videos/metadata`: return ffprobe metadata for an uploaded file

Each endpoint returns the processed file (except metadata, which returns JSON) and schedules cleanup of temporary files.

## Example: trim a clip
```bash
curl -X POST "http://localhost:8000/api/v1/videos/trim" \
  -F "file=@/path/to/video.mp4" \
  -F "start_time=00:00:05" \
  -F "duration=3" \
  --output trimmed.mp4
```

## Frontend template builder (React)
A small React UI lives in `frontend/` to generate ready-to-run curl commands for trim, resize, and metadata requests.

1. Install dependencies and start the dev server:
   ```bash
   cd frontend
   npm install
   npm run dev -- --host --port 4173
   ```
2. Open the printed URL (defaults to http://localhost:4173) in your browser.
3. Choose an operation, fill in the parameters, and copy the generated curl command.

The UI does not make API calls itself; it simply prepares a reusable command that targets your running FastAPI instance.

## Deploying to Render
Render can deploy both the FastAPI backend and the static React UI using the included `render.yaml` blueprint.

1. Push this repository to GitHub (or another supported Git provider).
2. In Render, choose **New +** → **Blueprint** and point it at the repo URL.
3. Review the services defined in `render.yaml`:
   - `video-editor-api` (web service): installs FFmpeg and Python dependencies, then starts `uvicorn app.main:app` bound to the provided `$PORT`.
   - `video-editor-template-ui` (static site): builds the React app from `frontend/` and publishes the `frontend/dist` directory.
4. Click **Apply** to create both services. Deploys will automatically rebuild when you push changes to the repo.

### Render start command
Render runs the following start command for the API service (the `$PORT` variable is provided automatically):

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Notes for Render
- FFmpeg is installed during the API build step via `apt-get`; no extra setup is required.
- If you want to skip the UI, you can disable or delete the `video-editor-template-ui` service after creating the blueprint.
