#!/usr/bin/env python3
"""Generate voice-over and phoneme-derived word timings with Kokoro ONNX."""

from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.request
from pathlib import Path
from typing import Any

MODEL_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/kokoro-v1.0.onnx"
VOICES_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/voices-v1.0.bin"
MODEL_NAME = "kokoro-v1.0.onnx"
VOICES_NAME = "voices-v1.0.bin"

VOICE_LANGUAGES = {
    "es": {"ef_dora", "em_alex", "em_santa"},
    "en-us": {"af_heart", "af_sarah"},
}


def download_once(url: str, destination: Path) -> None:
    if destination.is_file() and destination.stat().st_size > 0:
        return
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_suffix(destination.suffix + ".part")
    try:
        request = urllib.request.Request(url, headers={"User-Agent": "AI-Video-Studio/1.0"})
        with urllib.request.urlopen(request, timeout=60) as response, temporary.open("wb") as output:
            while chunk := response.read(1024 * 1024):
                output.write(chunk)
        if temporary.stat().st_size == 0:
            raise RuntimeError(f"Downloaded an empty model file from {url}")
        temporary.replace(destination)
    finally:
        temporary.unlink(missing_ok=True)


def phoneme_groups(timings: list[Any]) -> list[list[Any]]:
    """Split per-phoneme timestamps at spaces while retaining punctuation."""
    groups: list[list[Any]] = []
    current: list[Any] = []
    for item in timings:
        phoneme = str(item.phoneme)
        if phoneme.isspace():
            if current:
                groups.append(current)
                current = []
        else:
            current.append(item)
    if current:
        groups.append(current)
    return groups


def map_words(kokoro: Any, text: str, language: str, timings: list[Any]) -> list[dict[str, Any]]:
    words = re.findall(r"\S+", text)
    groups = phoneme_groups(timings)
    if not words or not groups:
        raise RuntimeError("Kokoro did not return usable word timing data.")

    if len(groups) == len(words):
        allocation = [1] * len(words)
    else:
        # eSpeak may expand numerals and abbreviations into multiple spoken groups.
        allocation = []
        for word in words:
            phonemes = kokoro.tokenizer.phonemize(word, language)
            allocation.append(max(1, len(phonemes.split())))
        if sum(allocation) != len(groups):
            raise RuntimeError(
                "Could not map Kokoro's phoneme timings back to the original words "
                f"({len(words)} written words, {len(groups)} phoneme groups). "
                "Spell out numbers or abbreviations and retry; timestamps will not be guessed."
            )

    aligned: list[dict[str, Any]] = []
    cursor = 0
    for index, (word, count) in enumerate(zip(words, allocation, strict=True)):
        word_groups = groups[cursor : cursor + count]
        cursor += count
        word_timings = [item for group in word_groups for item in group]
        start = min(float(item.start) for item in word_timings)
        end = max(float(item.end) for item in word_timings)
        if start < 0 or end <= start:
            raise RuntimeError(f"Kokoro returned an invalid time span for word {word!r}.")
        aligned.append({
            "index": index,
            "text": word,
            "startSeconds": round(start, 4),
            "endSeconds": round(end, 4),
        })
    return aligned


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", required=True, type=Path)
    parser.add_argument("--project-dir", required=True, type=Path)
    parser.add_argument("--model-dir", required=True, type=Path)
    args = parser.parse_args()

    config = json.loads(args.config.read_text(encoding="utf-8"))
    if not isinstance(config, dict) or config.get("schemaVersion") != 1:
        raise ValueError("Narration config must be a JSON object with schemaVersion: 1.")

    text = config.get("text")
    language = config.get("language", "es")
    speed = config.get("speed", 1.0)
    voice = config.get("voice", "ef_dora" if language == "es" else "af_heart")
    if not isinstance(text, str) or not text.strip() or len(text) > 6000:
        raise ValueError("text must contain 1-6000 characters.")
    if language not in VOICE_LANGUAGES:
        raise ValueError("language must be 'es' or 'en-us' for this initial provider adapter.")
    if voice not in VOICE_LANGUAGES[language]:
        raise ValueError(f"voice {voice!r} is not an approved {language} voice.")
    if isinstance(speed, bool) or not isinstance(speed, (int, float)) or not 0.5 <= speed <= 1.5:
        raise ValueError("speed must be a number between 0.5 and 1.5.")

    model_dir = args.model_dir.expanduser().resolve()
    model_path = model_dir / MODEL_NAME
    voices_path = model_dir / VOICES_NAME
    download_once(MODEL_URL, model_path)
    download_once(VOICES_URL, voices_path)

    try:
        import soundfile as sf
        from kokoro_onnx import Kokoro
    except ImportError as error:
        raise RuntimeError(
            "Narration dependencies are missing. Install requirements-tts.txt first."
        ) from error

    kokoro = Kokoro(str(model_path), str(voices_path))
    if voice not in kokoro.voices:
        raise RuntimeError(f"Voice {voice!r} is not present in the downloaded Kokoro voice pack.")
    if not kokoro.has_timings:
        raise RuntimeError(
            "The selected Kokoro model does not expose phoneme durations; "
            "refusing to invent subtitle timings."
        )

    audio, sample_rate, phoneme_timings = kokoro.create_timed(
        text.strip(),
        voice=voice,
        speed=float(speed),
        lang=language,
    )
    words = map_words(kokoro, text.strip(), language, phoneme_timings)
    duration_seconds = len(audio) / sample_rate
    if not duration_seconds > 0:
        raise RuntimeError("Kokoro generated an empty narration track.")
    if words[-1]["endSeconds"] > duration_seconds + 0.05:
        raise RuntimeError("Kokoro's final word timing extends beyond the generated audio.")

    audio_path = args.project_dir / "assets" / "audio" / "narration.wav"
    alignment_path = args.project_dir / "production" / "narration-alignment.json"
    audio_path.parent.mkdir(parents=True, exist_ok=True)
    alignment_path.parent.mkdir(parents=True, exist_ok=True)
    sf.write(audio_path, audio, sample_rate, subtype="PCM_16")

    result = {
        "schemaVersion": 1,
        "engine": "kokoro-onnx",
        "model": MODEL_NAME,
        "language": language,
        "voice": voice,
        "speed": float(speed),
        "sampleRate": int(sample_rate),
        "durationSeconds": round(duration_seconds, 4),
        "text": text.strip(),
        "words": words,
    }
    alignment_path.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        f"Generated {duration_seconds:.2f}s narration ({len(words)} aligned words) "
        f"with {voice} [{language}]."
    )
    print(f"Audio: {audio_path}")
    print(f"Alignment: {alignment_path}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"Narration generation failed: {error}", file=sys.stderr)
        raise SystemExit(1)
