import json
import subprocess
from pathlib import Path
from typing import Optional


def _run_command(args: list[str]) -> None:
    process = subprocess.run(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if process.returncode != 0:
        raise RuntimeError(process.stderr.strip() or "ffmpeg command failed")


def run_trim(input_path: Path, output_path: Path, *, start_time: str, duration: Optional[str]) -> None:
    args = [
        "ffmpeg",
        "-y",
        "-ss",
        start_time,
        "-i",
        str(input_path),
    ]

    if duration:
        args += ["-t", duration]

    args += ["-c", "copy", str(output_path)]
    _run_command(args)


def run_resize(input_path: Path, output_path: Path, *, width: int, height: int) -> None:
    args = [
        "ffmpeg",
        "-y",
        "-i",
        str(input_path),
        "-vf",
        f"scale={width}:{height}",
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-crf",
        "23",
        str(output_path),
    ]
    _run_command(args)


def extract_metadata(input_path: Path) -> dict:
    args = [
        "ffprobe",
        "-v",
        "error",
        "-show_entries",
        "format=duration,bit_rate:stream=index,codec_name,codec_type,width,height",
        "-of",
        "json",
        str(input_path),
    ]

    process = subprocess.run(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if process.returncode != 0:
        raise RuntimeError(process.stderr.strip() or "ffprobe command failed")

    try:
        payload = json.loads(process.stdout)
    except json.JSONDecodeError as exc:  # pragma: no cover - defensive
        raise RuntimeError("Failed to parse ffprobe output") from exc

    return payload
