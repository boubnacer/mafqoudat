# Fish Audio TTS

Small CLI wrapper around the Fish Audio Python SDK (`fish-audio-sdk`, imported as `fishaudio`).

## Setup

```bash
cd tts
python -m venv venv
# Windows (PowerShell):
venv\Scripts\Activate.ps1
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

Get an API key at https://fish.audio/app/api-keys, then set it in `.env`:

```
FISH_API_KEY=your-fish-audio-api-key-here
```

(`.env` is gitignored — never commit real keys.)

## Usage

```bash
python speak.py --text "Hello from Fish Audio" --out output.mp3
```

Or pipe text via stdin:

```bash
echo "Hello from Fish Audio" | python speak.py --out output.mp3
```

Override the model (default is the free tier `s2.1-pro-free`):

```bash
python speak.py --text "Hi" --model s2.1-pro --out output.mp3
```

Prints the saved file path and the byte count of the input text.

## Voice cloning

Clone a voice once, get back a `reference_id`, reuse it for any future text:

```bash
python clone_voice.py --title "My Voice" \
  --audio sample1.wav sample2.wav \
  --text "Exact transcript of sample1." "Exact transcript of sample2." \
  --description "Cloned from studio sample"
```

Prints `Voice model created: <id>`. Audio formats: `.wav`, `.mp3`, `.m4a`, `.opus`. Transcript per clip must match what's actually said, in order — this is what the clone quality is trained on.

Then generate speech in that voice:

```bash
python speak.py --text "Now I speak in the cloned voice." --reference-id <id> --out clone_test.mp3
```

The model persists on Fish Audio's side — `<id>` works in any future run, no need to re-clone.
