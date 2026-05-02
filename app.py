import io
import os
from datetime import datetime
import mysql.connector
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from urllib.parse import urlparse

from get_ai import chat_with_ai
from get_text import get_texts
from speech_to_text import speech_to_text, allowed_file
from mistakes import DBOperations

app = Flask(__name__,
            static_folder='static',
            static_url_path='/static',
            template_folder='templates')

db = DBOperations()
CORS(app)


# ========== 数据库配置 ==========
def get_db_config():
    """获取数据库配置，优先使用 Railway 环境变量"""
    mysql_url = os.getenv('MYSQL_URL')

    if mysql_url:
        # Railway 部署环境
        parsed = urlparse(mysql_url)
        return {
            'host': parsed.hostname,
            'port': parsed.port or 3306,
            'user': parsed.username,
            'password': parsed.password,
            'database': parsed.path.lstrip('/')
        }
    else:
        # 本地开发环境
        return {
            'host': 'localhost',
            'user': 'root',
            'password': '123456',  # 改为你的本地密码
            'database': 'my_project'
        }


def get_db_connection():
    """获取数据库连接"""
    config = get_db_config()
    return mysql.connector.connect(**config)


# ========== 自动创建数据库表（关键函数）==========
def init_database():
    """自动创建所有数据表（如果不存在）"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        print("🔧 开始检查并创建数据表...")

        # 1. 创建 users 表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(20) NOT NULL UNIQUE,
                password VARCHAR(64) NOT NULL,
                realname VARCHAR(50) DEFAULT '',
                class VARCHAR(50) DEFAULT '',
                studentid VARCHAR(20) DEFAULT '*'
            )
        """)
        print("✅ users 表已就绪")

        # 2. 创建 userdata 表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS userdata (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(20) NOT NULL UNIQUE,
                sign_time DATE,
                last_time DATE
            )
        """)
        print("✅ userdata 表已就绪")

        # 3. 创建 notedata 表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS notedata (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(20) NOT NULL,
                note_title TEXT,
                note_content TEXT,
                save_time DATE
            )
        """)
        print("✅ notedata 表已就绪")

        # 4. 创建 wrong_questions 表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS wrong_questions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                question TEXT NOT NULL,
                answer TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✅ wrong_questions 表已就绪")

        # 5. 创建 question_bank 表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS question_bank (
                id INT AUTO_INCREMENT PRIMARY KEY,
                question TEXT NOT NULL,
                answer TEXT NOT NULL,
                moved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✅ question_bank 表已就绪")

        conn.commit()
        cursor.close()
        conn.close()

        print("🎉 所有数据表创建/检查完成！")

    except Exception as e:
        print(f"⚠️ 数据库初始化警告: {e}")
        print("💡 提示: 如果是首次部署，请确保 MySQL 服务已完全启动（通常需要等待30秒）")


# ========== 静态文件路由 ==========
@app.route('/')
def index_page():
    """访问根路径时返回登录页面"""
    return send_from_directory('static', 'login.html')


@app.route('/<path:filename>')
def static_files(filename):
    """提供静态文件服务"""
    if filename.startswith('templates/'):
        actual_file = filename.replace('templates/', '')
        return send_from_directory('templates', actual_file)
    return send_from_directory('static', filename)


# ========== 用户相关 API ==========
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    isLogin = data.get('isLogin')
    username = data.get('username')
    password = data.get('password')

    if len(username) < 4 or len(username) > 20:
        return jsonify({"success": False, "message": "用户名长度必须在4到20个字符之间"}), 400
    if len(password) < 6 or len(password) > 20:
        return jsonify({"success": False, "message": "密码长度必须在6到20个字符之间"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    if isLogin:
        cursor.execute(
            "SELECT * FROM users WHERE username = %s AND password = SHA2(%s, 256)",
            (username, password)
        )
        user = cursor.fetchone()
        cursor.close()
        conn.close()

        if user:
            return jsonify({"success": True, "message": "登录成功"})
        else:
            return jsonify({"success": False, "message": "用户名或密码错误"}), 401
    else:
        cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()

        if user:
            cursor.close()
            conn.close()
            return jsonify({"success": False, "message": "用户名已存在"}), 400
        else:
            now = datetime.now()
            now_time = now.strftime('%Y-%m-%d')
            cursor.execute(
                "INSERT INTO users (username, password, realname, class, studentid) VALUES (%s, SHA2(%s, 256), %s, %s, %s)",
                (username, password, '*', '*', '*')
            )
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"success": True, "message": "注册成功"})


@app.route('/index', methods=['POST'])
def index():
    data = request.get_json()
    username = data.get('username')

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM userdata WHERE username = %s", (username,))
    userdata = cursor.fetchone()

    now = datetime.now()
    now_time = now.strftime('%Y-%m-%d')

    if userdata:
        cursor.execute("UPDATE userdata SET last_time = %s WHERE username = %s", (now_time, username))
        conn.commit()
    else:
        cursor.execute("INSERT INTO userdata (username, sign_time, last_time) VALUES (%s, %s, %s)",
                       (username, now_time, now_time))
        userdata = {'username': username, 'sign_time': now_time, 'last_time': now_time}
        conn.commit()

    cursor.close()
    conn.close()

    return jsonify({"success": True, "username": userdata['username'],
                    "sign_time": userdata['sign_time'], "last_time": userdata['last_time']})


# ========== 笔记管理 API ==========
@app.route('/saveNote', methods=['POST'])
def saveNote():
    data = request.get_json()
    username = data.get('username')
    note_title = data.get('note_title')
    note_content = data.get('note_content')

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    now = datetime.now()
    save_time = now.strftime('%Y-%m-%d')
    cursor.execute("INSERT INTO notedata (username, note_title, note_content, save_time) VALUES (%s, %s, %s, %s)",
                   (username, note_title, note_content, save_time))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"success": True})


@app.route('/historyNote', methods=['POST'])
def historyNote():
    data = request.get_json()
    username = data.get('username')

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM notedata WHERE username = %s", (username,))
    notedata = cursor.fetchall()
    cursor.close()
    conn.close()

    if notedata:
        return jsonify({"success": True, "notedata": notedata})
    else:
        return jsonify({"success": False})


@app.route('/delNote', methods=['POST'])
def delNote():
    data = request.get_json()
    username = data.get('username')
    note_title = data.get('note_title')

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("DELETE FROM notedata WHERE username = %s AND note_title = %s", (username, note_title))
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"success": True})


@app.route('/alterNote', methods=['POST'])
def alterNote():
    data = request.get_json()
    username = data.get('username')
    note_title = data.get('note_title')

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM notedata WHERE username = %s AND note_title = %s", (username, note_title))
    alterNote = cursor.fetchone()
    cursor.close()
    conn.close()

    if alterNote:
        return jsonify({"success": True, "note_title": alterNote['note_title'],
                        "note_content": alterNote['note_content'], "id": alterNote['id']})
    else:
        return jsonify({"success": False})


@app.route('/save_alterNote', methods=['POST'])
def save_alterNote():
    data = request.get_json()
    username = data.get('username')
    note_title = data.get('note_title')
    note_content = data.get('note_content')
    id = data.get('id')

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("UPDATE notedata SET note_title = %s, note_content = %s WHERE username = %s AND id = %s",
                   (note_title, note_content, username, id))
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"success": True})


# ========== OCR 文字识别 ==========
UPLOAD_FOLDER = './static/get_text_image'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)


@app.route('/ocr', methods=['POST'])
def ocr():
    file = request.files['image']

    for filename in os.listdir(UPLOAD_FOLDER):
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        if os.path.isfile(file_path):
            os.remove(file_path)

    if file:
        filename = 'image.jpg'
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)

    img_Text = get_texts()
    if img_Text:
        return jsonify({"success": True, "have_text": True, "img_Text": img_Text})
    else:
        return jsonify({"success": True, "have_text": False, "img_Text": "未识别到文字！"})


# ========== AI 对话 ==========
@app.route('/ai', methods=['POST'])
def ai():
    data = request.json
    user_message = data.get('message')
    ai_response = chat_with_ai(user_message)
    return jsonify({
        'success': True,
        'message': ai_response
    })


# ========== 语音转文本 ==========
@app.route('/speech-to-text', methods=['POST'])
def handle_speech_recognition():
    try:
        if 'audio' in request.files:
            audio_file = request.files['audio']
            if audio_file.filename == '':
                return jsonify({"success": False, "error": "未选择文件"})

            if not allowed_file(audio_file.filename):
                return jsonify({"success": False, "error": "不支持的文件格式"})

            text, error = speech_to_text(audio_file=audio_file)

        elif request.data:
            live_audio = io.BytesIO(request.data)
            text, error = speech_to_text(live_audio=live_audio)

        else:
            return jsonify({"success": False, "error": "未提供有效的音频输入"})

        if error:
            return jsonify({"success": False, "error": error})

        return jsonify({
            "success": True,
            "text": text
        })

    except Exception as e:
        return jsonify({"success": False, "error": f"服务器错误: {str(e)}"})


# ========== 个人主页 API ==========
@app.route('/update_password', methods=['POST'])
def update_password():
    data = request.get_json()
    username = data.get('username')
    old_password = data.get('old_password')
    new_password = data.get('new_password')

    if len(new_password) < 6 or len(new_password) > 20:
        return jsonify({'success': False, 'message': '密码长度必须在6-20个字符之间'}), 400

    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT * FROM users WHERE username = %s AND password = SHA2(%s, 256)",
            (username, old_password)
        )
        user = cursor.fetchone()
        if not user:
            return jsonify({'success': False, 'message': '原密码不正确'}), 401

        cursor.execute(
            "UPDATE users SET password = SHA2(%s, 256) WHERE username = %s",
            (new_password, username)
        )
        conn.commit()
        return jsonify({'success': True, 'message': '密码修改成功'})

    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'服务器错误: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/update_profile', methods=['POST'])
def update_profile():
    data = request.get_json()
    username = data.get('username')
    field = data.get('field')
    value = data.get('value')

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        query = f"UPDATE users SET {field} = %s WHERE username = %s"
        cursor.execute(query, (value, username))
        conn.commit()
        return jsonify({'success': True, 'message': '修改成功'})

    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'服务器错误: {str(e)}'}), 500
    finally:
        conn.close()


@app.route('/get_user_data', methods=['POST'])
def get_user_data():
    data = request.get_json()
    username = data.get('username')

    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT username, realname, class, studentid 
            FROM users 
            WHERE username = %s
        """, (username,))
        user = cursor.fetchone()
        user_data = {
            'username': user['username'],
            'realname': user['realname'] or '未设置',
            'class': user['class'] or '未设置',
            'studentid': user['studentid'] or '未设置'
        }
        return jsonify({'success': True, 'user': user_data})

    except Exception as e:
        return jsonify({'success': False, 'message': f'服务器错误: {str(e)}'}), 500
    finally:
        conn.close()


# ========== 错题集模块 ==========
@app.route('/add_question', methods=['POST'])
def add_question():
    question = request.form.get('question')
    answer = request.form.get('answer')
    if not question or not answer:
        return jsonify({'success': False, 'message': '题目和答案不能为空'})
    result = db.add_question(question, answer)
    return jsonify(result)


@app.route('/get_random_question')
def get_random_question():
    result = db.get_random_question()
    return jsonify(result)


@app.route('/move_to_bank', methods=['POST'])
def move_to_bank():
    question_id = request.form.get('id')
    if not question_id:
        return jsonify({'success': False, 'message': '缺少题目ID'})
    result = db.move_to_bank(question_id)
    return jsonify(result)


@app.route('/get_question_bank')
def get_question_bank():
    result = db.get_question_bank()
    return jsonify(result)


# ========== 主入口 ==========
if __name__ == '__main__':
    # 关键：启动前自动创建所有数据表
    print("🚀 正在初始化云笔记系统...")
    init_database()

    # 获取端口（Railway 会自动提供 PORT 环境变量）
    port = int(os.getenv('PORT', 5000))

    # 启动应用（必须监听 0.0.0.0）
    print(f"✨ 系统启动成功！访问地址: http://0.0.0.0:{port}")
    app.run(debug=False, host='0.0.0.0', port=port)