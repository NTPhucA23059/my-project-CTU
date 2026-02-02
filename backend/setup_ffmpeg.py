import os
import sys
import zipfile
import urllib.request
import shutil

FFMPEG_URL = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
DEST_DIR = os.path.join(os.getcwd(), "ffmpeg_bin")

def download_ffmpeg():
    if os.path.exists(DEST_DIR):
        print("Folder ffmpeg_bin đã tồn tại. Bỏ qua tải xuống.")
        return

    print(f"Đang tải FFmpeg từ {FFMPEG_URL}...")
    print("Vui lòng đợi (khoảng 20-50MB)...")
    
    zip_path = "ffmpeg.zip"
    try:
        urllib.request.urlretrieve(FFMPEG_URL, zip_path)
        print("Tải xong. Đang giải nén...")
        
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall("temp_ffmpeg")
            
        # Tìm file ffmpeg.exe trong thư mục vừa giải nén
        found = False
        for root, dirs, files in os.walk("temp_ffmpeg"):
            if "ffmpeg.exe" in files:
                bin_path = root
                shutil.move(bin_path, DEST_DIR)
                found = True
                break
        
        if found:
            print(f"Đã cài đặt FFmpeg vào {DEST_DIR}")
        else:
            print("Không tìm thấy ffmpeg.exe trong file zip!")

    except Exception as e:
        print(f"Lỗi: {e}")
    finally:
        if os.path.exists(zip_path):
            os.remove(zip_path)
        if os.path.exists("temp_ffmpeg"):
            shutil.rmtree("temp_ffmpeg")

if __name__ == "__main__":
    download_ffmpeg()
