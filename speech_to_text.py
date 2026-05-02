import os
import io
import torch
import whisper
from werkzeug.utils import secure_filename
from pydub import AudioSegment
import tempfile  # 用于管理临时文件
import opencc

# 配置上传文件夹
UPLOAD_FOLDER = './static/audio_uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# 加载Whisper模型
MODEL = whisper.load_model("base")  # 可以是"tiny", "base", "small", "medium", "large"

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'wav', 'mp3', 'ogg', 'm4a'}

def convert_to_wav(audio_path):
    """将音频文件转换为WAV格式"""
    try:
        sound = AudioSegment.from_file(audio_path)
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_wav:
            sound.export(temp_wav.name, format="wav")
            return temp_wav.name
    except Exception as e:
        print(f"音频转换失败: {str(e)}")
        return None

def speech_to_text(audio_file=None, live_audio=None):  #此函数使用deepseek辅助编写
    """
    使用Whisper进行语音转文本
    """
    try:
        if audio_file:  # 处理上传的音频文件
            filename = secure_filename(audio_file.filename)
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            audio_file.save(file_path)

            wav_path = convert_to_wav(file_path)
            if not wav_path:
                return None, "不支持的音频格式"

            result = MODEL.transcribe(wav_path, language='zh')

            # 使用OpenCC将文本转换为简体中文
            converter = opencc.OpenCC('t2s.json')  # 繁体转简体
            simplified_text = converter.convert(result['text'])

            return simplified_text, None

        elif live_audio:  # 处理实时音频
            with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as temp_audio:
                temp_audio.write(live_audio)
                wav_path = convert_to_wav(temp_audio.name)
                if not wav_path:
                    return None, "实时音频转换失败"

                result = MODEL.transcribe(wav_path, language='zh')
                return result['text'], None

    except Exception as e:
        return None, f"处理音频时出错: {str(e)}"

    return None, "未提供有效的音频输入"