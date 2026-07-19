#!/usr/bin/env python3
"""Generate the Hamster Private Room mascot sprite through OpenRouter."""

from __future__ import annotations

import argparse
import base64
import io
import json
import urllib.error
import urllib.request
from pathlib import Path

from PIL import Image


OPENROUTER_URL = "https://openrouter.ai/api/v1/images"
DEFAULT_ENV = Path("/Users/hsahn/Desktop/works/chat-prompt-maker/deploy/.env.backend.docker")
DEFAULT_MODEL = "openai/gpt-5.4-image-2"

PROMPT = """
Use case: stylized-concept
Asset type: animated web-app mascot sprite sheet
Primary request: Create one perfectly aligned horizontal sprite sheet of the same golden dwarf hamster performing a cute rhythmic dance in place.
Subject: one round golden dwarf hamster with warm honey and cream fur, tiny pink paws, glossy black eyes, small round ears, and a very short tail. The hamster carries no object and wears no clothes.
Style/medium: polished 2D storybook game sprite with clean cel-painted shapes, smooth controlled fur edges, a crisp silhouette, minimal internal texture, charming but not childish, production-ready UI mascot. Do not render wispy or flyaway fur.
Composition/framing: exactly SIX equal-width animation frames in one single horizontal row, left to right. Every frame is a straight-on FRONT VIEW with both eyes visible and the body facing the camera. Keep the head size, body size, foot baseline, lighting, colors, camera, and center position identical in all frames. Create a seamless dance loop: 1 neutral bounce, 2 step left with left paw raised, 3 both paws raised, 4 step right with right paw raised, 5 paws clap together, 6 settle bounce returning to frame 1. The pose changes must be clearly visible while the character identity stays identical. Generous equal padding inside every frame.
Scene/backdrop: perfectly flat solid #00FF00 chroma-key background across the entire image.
Lighting/mood: soft diffuse daylight, cheerful and lively.
Color palette: honey gold, warm cream, pale pink, near-black eyes. Do not use green in the hamster.
Constraints: exactly six frames; exactly one hamster per frame; front-facing in all frames; no profile or three-quarter view; no frame borders; no labels; no text; no watermark; no cast shadow; no floor; no props; no cropped ears, paws, or feet; no camera movement; consistent character identity and scale; perfectly uniform green background touching every outer image edge.
Avoid: extra limbs, duplicate hamsters inside a frame, walking or running poses, side view, perspective changes, realistic flyaway fur, green rim light, gradients or texture in the green background, white background, checkerboard, grid lines, captions, accessories.
""".strip()


def load_key(env_path: Path) -> str:
    if not env_path.exists():
        raise RuntimeError(f"OpenRouter env file not found: {env_path}")
    for raw in env_path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        if key.strip() == "PROMPTMAKER_OPENROUTER_API_KEY":
            return value.strip().strip('"').strip("'")
    raise RuntimeError("PROMPTMAKER_OPENROUTER_API_KEY not found")


def download_image(payload: dict, output: Path) -> None:
    images = payload.get("data") or []
    if not images:
        raise RuntimeError(f"OpenRouter returned no image: {list(payload.keys())}")
    image = images[0]
    if image.get("b64_json"):
        output.write_bytes(base64.b64decode(str(image["b64_json"])))
        return
    if image.get("url"):
        with urllib.request.urlopen(str(image["url"]), timeout=180) as response:
            output.write_bytes(response.read())
        return
    raise RuntimeError(f"Unsupported image response: {list(image.keys())}")


def generate(api_key: str, model: str, output: Path) -> None:
    body = {
        "model": model,
        "prompt": PROMPT,
        "resolution": "2K",
        "aspect_ratio": "8:1",
        "output_format": "png",
    }
    request = urllib.request.Request(
        OPENROUTER_URL,
        json.dumps(body).encode("utf-8"),
        {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/hobi2k/hamster-private-room",
            "X-Title": "Hamster Private Room",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=420) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"OpenRouter HTTP {error.code}: {detail[:900]}") from error
    output.parent.mkdir(parents=True, exist_ok=True)
    download_image(payload, output)


def remove_green(raw: Path, output: Path) -> None:
    image = Image.open(raw).convert("RGBA")
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            red, green, blue, _ = pixels[x, y]
            green_strength = green - max(red, blue)
            key_distance = max(red, abs(255 - green), blue)
            if key_distance <= 48 or (green > 132 and green_strength >= 48):
                pixels[x, y] = (0, 0, 0, 0)
                continue
            if green > 105 and green_strength > 8:
                alpha = max(0, min(255, int(255 * (1 - (green_strength - 8) / 52))))
                if alpha <= 12:
                    pixels[x, y] = (0, 0, 0, 0)
                    continue
                pixels[x, y] = (red, min(green, max(red, blue)), blue, alpha)
                continue
            pixels[x, y] = (red, min(green, max(red, blue)) if green_strength > 0 else green, blue, 255)
    alpha_box = image.getchannel("A").getbbox()
    if not alpha_box:
        raise RuntimeError("Background removal produced an empty sprite")
    top = max(0, alpha_box[1] - 36)
    bottom = min(image.height, alpha_box[3] + 36)
    image = image.crop((0, top, image.width, bottom))
    image = align_frames(image)
    validate_sprite(image)
    output.parent.mkdir(parents=True, exist_ok=True)
    image.save(output, optimize=True)


def align_frames(image: Image.Image) -> Image.Image:
    alpha = image.getchannel("A")
    occupied = [alpha.crop((x, 0, x + 1, image.height)).getbbox() is not None for x in range(image.width)]
    runs: list[tuple[int, int]] = []
    start: int | None = None
    for x, active in enumerate([*occupied, False]):
        if active and start is None:
            start = x
        if not active and start is not None:
            runs.append((start, x))
            start = None
    if len(runs) != 6:
        raise RuntimeError(f"Expected six separated sprite silhouettes, found {len(runs)}")

    frame_width = image.width // 6
    subjects: list[Image.Image] = []
    bottoms: list[int] = []
    for left, right in runs:
        run = image.crop((left, 0, right, image.height))
        box = run.getchannel("A").getbbox()
        if not box:
            raise RuntimeError("Found an empty sprite silhouette")
        subject = run.crop(box)
        if subject.width > frame_width:
            raise RuntimeError(f"Sprite silhouette is wider than one frame: {subject.width}px")
        subjects.append(subject)
        bottoms.append(box[3])

    baseline = max(bottoms)
    aligned = Image.new("RGBA", image.size, (0, 0, 0, 0))
    for frame, subject in enumerate(subjects):
        left = frame * frame_width + (frame_width - subject.width) // 2
        aligned.alpha_composite(subject, (left, baseline - subject.height))
    return aligned


def validate_sprite(image: Image.Image) -> None:
    if image.mode != "RGBA":
        raise RuntimeError(f"Sprite must be RGBA, got {image.mode}")
    if image.width % 6:
        raise RuntimeError(f"Sprite width must divide into six frames: {image.width}")
    corners = ((0, 0), (image.width - 1, 0), (0, image.height - 1), (image.width - 1, image.height - 1))
    if any(image.getpixel(point)[3] != 0 for point in corners):
        raise RuntimeError("Sprite corners are not fully transparent")
    live_green = 0
    frame_coverage: list[float] = []
    frame_centers: list[float] = []
    frame_bottoms: list[int] = []
    frame_width = image.width // 6
    for frame in range(6):
        frame_image = image.crop((frame * frame_width, 0, (frame + 1) * frame_width, image.height))
        frame_box = frame_image.getchannel("A").getbbox()
        if not frame_box:
            raise RuntimeError(f"Animation frame {frame + 1} is empty")
        frame_centers.append((frame_box[0] + frame_box[2]) / 2)
        frame_bottoms.append(frame_box[3])
        visible = 0
        for y in range(image.height):
            for x in range(frame * frame_width, (frame + 1) * frame_width):
                red, green, blue, alpha = image.getpixel((x, y))
                if alpha == 0:
                    if red or green or blue:
                        raise RuntimeError("Transparent background contains non-zero RGB residue")
                    continue
                visible += 1
                if green > max(red, blue) + 8:
                    live_green += 1
        frame_coverage.append(visible / (frame_width * image.height))
    if live_green:
        raise RuntimeError(f"Detected {live_green} visible green-spill pixels")
    if min(frame_coverage) < 0.08:
        raise RuntimeError(f"At least one animation frame is nearly empty: {frame_coverage}")
    if max(frame_coverage) / min(frame_coverage) > 1.85:
        raise RuntimeError(f"Frame subject scale is inconsistent: {frame_coverage}")
    if max(abs(center - frame_width / 2) for center in frame_centers) > 1:
        raise RuntimeError(f"Frame silhouettes are not centered: {frame_centers}")
    if max(frame_bottoms) - min(frame_bottoms) > 1:
        raise RuntimeError(f"Frame baselines are not aligned: {frame_bottoms}")
    print(
        f"validated alpha; frame coverage={[round(value, 3) for value in frame_coverage]}; "
        f"centers={frame_centers}; baseline={frame_bottoms[0]}"
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--env-file", type=Path, default=DEFAULT_ENV)
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--raw", type=Path, default=Path("/private/tmp/hamster-sprite-raw.png"))
    parser.add_argument("--output", type=Path, default=Path("public/assets/hamster-walk.png"))
    parser.add_argument("--from-raw", action="store_true")
    args = parser.parse_args()

    if not args.from_raw:
        generate(load_key(args.env_file), args.model, args.raw)
    remove_green(args.raw, args.output)
    with Image.open(args.output) as image:
        print(f"wrote {args.output} ({image.width}x{image.height}, {image.mode})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
