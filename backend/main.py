import shutil
import os
import time
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import soundfile as sf
import noisereduce as nr
import librosa
import numpy as np
from deep_translator import GoogleTranslator
from pydantic import BaseModel

# --- DUAL BACKEND IMPORT ---
STT_BACKEND = "openai_whisper" # default
try:
    from faster_whisper import WhisperModel
    STT_BACKEND = "faster_whisper"
    print(">> Sử dụng Backend: Faster-Whisper (Tốc độ cao)")
except ImportError:
    import whisper
    STT_BACKEND = "openai_whisper"
    print(">> Sử dụng Backend: OpenAI-Whisper (Fallback - Tương thích cao)")

app = FastAPI()

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CẤU HÌNH FFMPEG (Giữ nguyên) ---
local_ffmpeg_codepath = os.path.join(os.getcwd(), "ffmpeg_bin")
if os.path.exists(os.path.join(local_ffmpeg_codepath, "ffmpeg.exe")):
    os.environ["PATH"] += os.pathsep + local_ffmpeg_codepath
else:
    local_ffmpeg_bin = os.path.join(os.getcwd(), "ffmpeg_bin", "bin")
    if os.path.exists(os.path.join(local_ffmpeg_bin, "ffmpeg.exe")):
         os.environ["PATH"] += os.pathsep + local_ffmpeg_bin

if shutil.which("ffmpeg") is None:
    print("CẢNH BÁO: Không tìm thấy 'ffmpeg' trong hệ thống!")

# --- LOAD MODEL STRATEGY ---
model = None
MODEL_SIZE = "small"

try:
    print(f"Đang tải model ({STT_BACKEND}) size '{MODEL_SIZE}'...")
    if STT_BACKEND == "faster_whisper":
        # int8 faster whisper
        model = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8")
    else:
        # standard openai whisper
        model = whisper.load_model(MODEL_SIZE)
    print("Model đã sẵn sàng!")
except Exception as e:
    print(f"Lỗi tải model nghiêm trọng: {e}")
    # Thử fallback lần cuối nếu faster whisper fail lúc init
    if STT_BACKEND == "faster_whisper":
        print("Fallback về OpenAI Whisper do lỗi init Faster-Whisper...")
        try:
            import whisper
            STT_BACKEND = "openai_whisper"
            model = whisper.load_model(MODEL_SIZE)
            print("Model Fallback đã sẵn sàng!")
        except Exception as  ex:
             print(f"Không thể khởi tạo cả 2 model: {ex}")

def filter_noise(input_path, output_path):
    """
    Đọc file âm thanh, khử nhiễu nền và lưu ra file mới.
    """
    try:
        print(f"Đang xử lý tạp âm cho: {input_path}")
        # Load audio (dùng librosa để hỗ trợ nhiều định dạng, sampling rate 16k cho whisper)
        data, rate = librosa.load(input_path, sr=16000)
        
        # Thực hiện khử nhiễu (Dùng đoạn đầu yên tĩnh làm mẫu nhiễu hoặc tự động)
        reduced_noise = nr.reduce_noise(y=data, sr=rate, prop_decrease=0.8, stationery=True)
        
        # Lưu lại file đã xử lý
        sf.write(output_path, reduced_noise, rate)
        print("Đã khử nhiễu xong.")
        return True
    except Exception as e:
        print(f"Lỗi khử nhiễu: {e}")
        return False

@app.get("/")
def read_root():
    return {"message": f"STT API running with {STT_BACKEND} + Noise Reduction"}

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    if model is None:
        raise HTTPException(status_code=500, detail="Model chưa tải xong.")

    start_time = time.time()
    
    original_filename = f"raw_{file.filename}"
    clean_filename = f"clean_{file.filename}.wav"

    try:
        with open(original_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Khử tạp âm
        is_clean = filter_noise(original_filename, clean_filename)
        target_file = clean_filename if is_clean else original_filename

        # Transcribe Logic tùy backend
        transcribed_text = ""
        detect_lang = ""

        if STT_BACKEND == "faster_whisper":
            segments, info = model.transcribe(
                target_file, 
                beam_size=5, 
                language="vi",
                initial_prompt="Xin chào, đây là hội thoại tiếng Việt."
            )
            detect_lang = info.language
            for segment in segments:
                transcribed_text += segment.text + " "
        else:
            # OpenAI Whisper
            # prompt="Xin chào..." (openai whisper dùng param 'prompt' hoặc 'initial_prompt' tùy version, 'initial_prompt' là chuẩn cho decode)
            result = model.transcribe(
                target_file, 
                language='vi',
                initial_prompt="Xin chào, đây là hội thoại tiếng Việt."
            )
            transcribed_text = result["text"]
            detect_lang = "vi" # OpenAI whisper 'transcribe' method doesn't return info object same way, assume vi enforced

        process_time = time.time() - start_time
        print(f"Xử lý xong trong {process_time:.2f}s (Cleaned: {is_clean}). Text: {transcribed_text.strip()[:50]}...")

        return {
            "text": transcribed_text.strip(),
            "language": detect_lang,
            "processing_time": f"{process_time:.2f}s",
            "backend": STT_BACKEND,
            "noise_filtered": is_clean
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(original_filename):
            try: os.remove(original_filename)
            except: pass
        if os.path.exists(clean_filename):
             try: os.remove(clean_filename)
             except: pass

class TranslationRequest(BaseModel):
    text: str
    target_lang: str

@app.post("/translate")
async def translate_text(request: TranslationRequest):
    try:
        translated = GoogleTranslator(source='auto', target=request.target_lang).translate(request.text)
        return {"translated_text": translated}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
