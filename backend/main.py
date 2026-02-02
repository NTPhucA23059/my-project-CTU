import os
import shutil
import uvicorn
import time
import subprocess
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from deep_translator import GoogleTranslator

# --- STT BACKEND ---
STT_BACKEND = "openai_whisper"
model = None

try:
    from faster_whisper import WhisperModel
    STT_BACKEND = "faster_whisper"
    print(">> Su dung Backend: Faster-Whisper")
except ImportError:
    import whisper
    STT_BACKEND = "openai_whisper"
    print(">> Su dung Backend: OpenAI-Whisper (Fallback)")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "https://ntphuca23059.github.io", "https://my-project-ctu.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- RAM SAFE MODEL ---
MODEL_SIZE = os.environ.get("WHISPER_MODEL", "tiny")  # tiny de song 512MB

def load_model():
    global model
    if model is not None:
        return

    print(f"Dang tai model ({STT_BACKEND}) size '{MODEL_SIZE}'...")
    if STT_BACKEND == "faster_whisper":
        model = WhisperModel(
            MODEL_SIZE,
            device="cpu",
            compute_type="int8",
            cpu_threads=int(os.environ.get("CPU_THREADS", "2")),
        )
    else:
        model = whisper.load_model(MODEL_SIZE)

    print("Model da san sang!")

def ensure_wav_16k(input_path: str) -> str:
    """
    Convert ve WAV 16k mono bang ffmpeg (nhe hon librosa, it RAM).
    """
    out_path = input_path + "_16k.wav"
    cmd = [
        "ffmpeg", "-y",
        "-i", input_path,
        "-ac", "1",
        "-ar", "16000",
        out_path
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    return out_path

@app.get("/")
def read_root():
    return {"message": f"STT API running with {STT_BACKEND} (model={MODEL_SIZE})"}
@app.get("/health")
def health():
    return {"status": "ok"}
@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    try:
        load_model()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Khong tai duoc model: {e}")

    start_time = time.time()
    raw_path = f"raw_{int(time.time())}_{file.filename}"
    wav_path = None

    try:
        with open(raw_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Convert ve 16k wav (giam loi dinh dang + nhe RAM)
        wav_path = ensure_wav_16k(raw_path)

        transcribed_text = ""
        detect_lang = "vi"

        if STT_BACKEND == "faster_whisper":
            segments, info = model.transcribe(
                wav_path,
                language="vi",
                beam_size=1,
                vad_filter=True,
            )
            detect_lang = info.language or "vi"
            for seg in segments:
                transcribed_text += seg.text + " "
        else:
            result = model.transcribe(wav_path, language="vi")
            transcribed_text = result.get("text", "")

        process_time = time.time() - start_time

        return {
            "text": transcribed_text.strip(),
            "language": detect_lang,
            "processing_time": f"{process_time:.2f}s",
            "backend": STT_BACKEND,
            "noise_filtered": False
        }

    except subprocess.CalledProcessError:
        raise HTTPException(status_code=400, detail="Khong convert duoc audio. File khong hop le hoac ffmpeg loi.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        for p in [raw_path, wav_path]:
            if p and os.path.exists(p):
                try:
                    os.remove(p)
                except:
                    pass

class TranslationRequest(BaseModel):
    text: str
    target_lang: str

@app.post("/translate")
async def translate_text(request: TranslationRequest):
    try:
        translated = GoogleTranslator(source="auto", target=request.target_lang).translate(request.text)
        return {"translated_text": translated}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
