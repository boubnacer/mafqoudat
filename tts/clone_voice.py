#!/usr/bin/env python3
import argparse
import sys

from dotenv import load_dotenv
from fishaudio import FishAudio
from fishaudio.exceptions import APIError


def parse_args():
    parser = argparse.ArgumentParser(description="Create a persistent Fish Audio voice model from sample clips")
    parser.add_argument("--title", required=True, help="Name for the voice model")
    parser.add_argument("--audio", nargs="+", required=True, help="One or more reference audio files (.wav/.mp3/.m4a/.opus)")
    parser.add_argument("--text", nargs="+", help="Exact transcript for each audio file, same order. Omit to auto-transcribe via ASR")
    parser.add_argument("--description", default="", help="Optional description")
    parser.add_argument("--visibility", default="private", choices=["private", "public", "unlist"], help="Voice model visibility (default: private)")
    return parser.parse_args()


def main():
    load_dotenv()
    args = parse_args()

    if args.text and len(args.audio) != len(args.text):
        print("error: --audio and --text must have the same number of entries (one transcript per clip)", file=sys.stderr)
        sys.exit(1)

    voice_bytes = [open(path, "rb").read() for path in args.audio]

    client = FishAudio()  # reads FISH_API_KEY from environment

    if args.text:
        texts = args.text
    else:
        texts = []
        for path, data in zip(args.audio, voice_bytes):
            try:
                result = client.asr.transcribe(audio=data)
                print(f"Transcribed {path}: {result.text}")
                texts.append(result.text)
            except APIError as e:
                print(f"warning: auto-transcribe failed for {path} (HTTP {e.status}: {e.message}); continuing without transcript", file=sys.stderr)
                texts.append("")

    voice = client.voices.create(
        title=args.title,
        voices=voice_bytes,
        texts=texts,
        description=args.description,
        visibility=args.visibility,
    )

    print(f"Voice model created: {voice.id}")
    print(f"State: {voice.state}")
    print(f"Use it: python speak.py --text-file yourtext.txt --reference-id {voice.id}")


if __name__ == "__main__":
    main()
