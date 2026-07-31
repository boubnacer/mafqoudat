#!/usr/bin/env python3
import argparse
import sys

from dotenv import load_dotenv
from fishaudio import FishAudio
from fishaudio.utils import save

DEFAULT_MODEL = "s2.1-pro-free"


def parse_args():
    parser = argparse.ArgumentParser(description="Synthesize speech with Fish Audio TTS")
    parser.add_argument("--text", help="Text to synthesize (reads stdin if omitted)")
    parser.add_argument("--text-file", help="Read text from a UTF-8 file instead of --text/stdin (safest for non-Latin scripts on Windows)")
    parser.add_argument("--out", default="output.mp3", help="Output MP3 path (default: output.mp3)")
    parser.add_argument("--model", default=DEFAULT_MODEL, help=f"Model to use (default: {DEFAULT_MODEL})")
    parser.add_argument("--reference-id", help="Cloned voice model id (from clone_voice.py) to speak in that voice")
    return parser.parse_args()


def main():
    load_dotenv()
    args = parse_args()

    if args.text_file:
        with open(args.text_file, "r", encoding="utf-8") as f:
            text = f.read()
    elif args.text is not None:
        text = args.text
    else:
        text = sys.stdin.read()
    text = text.strip()
    if not text:
        print("error: no text provided (use --text or pipe via stdin)", file=sys.stderr)
        sys.exit(1)

    client = FishAudio()  # reads FISH_API_KEY from environment
    kwargs = {"text": text, "model": args.model}
    if args.reference_id:
        kwargs["reference_id"] = args.reference_id
    audio = client.tts.convert(**kwargs)
    save(audio, args.out)

    print(f"Saved audio to: {args.out}")
    print(f"Input text byte count: {len(text.encode('utf-8'))}")


if __name__ == "__main__":
    main()
