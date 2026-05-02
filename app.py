import io
import os
from datetime import datetime
import mysql.connector
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS  # 跨境资源调取

from get_ai import chat_with_ai
from get_text import get_texts
from speech_to_text import speech_to_text, allowed_file  # 自己添加的
from mistakes import DBOperations #!!!

app = Flask(__name__)
db = DBOperations() #!!!

CORS(app)  # 启用 CORS

# 提供静态文件
@app.route('/')
def none():
    return send_from_directory('static', 'login.html')

@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory('static', filename)

# 用户数据库
db_config = {
    'host': 'localhost',      # 数据库服务器地址
    'user': 'root',           # 数据库用户名
    'password': '123456',  # 数据库密码
    'database': 'my_project'    # 数据库名称
}
def get_db_connection():
    return mysql.connector.connect(**db_config)


@app.route('/login', methods=['POST']) #此函数使用deepseek辅助编写
def login():
    data = request.get_json()
    isLogin = data.get('isLogin')
    username = data.get('username')
    password = data.get('password')

    # 检查用户名和密码的长度
    if len(username) < 4 or len(username) > 20:
        return jsonify({"success": False, "message": "用户名长度必须在4到20个字符之间"}), 400
    if len(password) < 6 or len(password) > 20:
        return jsonify({"success": False, "message": "密码长度必须在6到20个字符之间"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    if isLogin:
        # 修改后：使用SHA2加密验证密码X
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
        # 检查用户名是否已存在
        cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()

        if user:
            cursor.close()
            conn.close()
            return jsonify({"success": False, "message": "用户名已存在"}), 400
        else:
            now = datetime.now()
            now_time = now.strftime('%Y-%m-%d')
            # 修改后：使用SHA2加密存储密码
            cursor.execute(
                "INSERT INTO users (username, password, realname, class, studentid) VALUES (%s, SHA2(%s, 256), %s, %s, %s)",
                (username, password, '*', '*', '*')
            )
            conn.commit()  # 确保提交事务
            cursor.close()
            conn.close()
            return jsonify({"success": True, "message": "注册成功"})

@app.route('/index', methods=['POST'])
def index():
    data = request.get_json()
    username = data.get('username')

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    #查询用户数据
    cursor.execute("SELECT * FROM userdata WHERE username = %s", (username,))
    userdata = cursor.fetchone()

    # 更新最后登录时间
    now = datetime.now()
    now_time = now.strftime('%Y-%m-%d')
    print(now_time)
    if userdata:
        cursor.execute("UPDATE userdata SET last_time = %s WHERE username = %s", (now_time, username))
        conn.commit()
    else:
        cursor.execute("INSERT INTO userdata (username, sign_time, last_time) VALUES (%s, %s, %s)", (username, now_time, now_time))
        userdata = {'username': username, 'sign_time': now_time, 'last_time': now_time}
        conn.commit()

    cursor.close()
    conn.close()

    return jsonify({"success": True, "username": userdata['username'], "sign_time": userdata['sign_time'], "last_time": userdata['last_time']})

#保存新笔记
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
    cursor.execute("INSERT INTO notedata (username, note_title, note_content, save_time) VALUES (%s, %s, %s, %s)", (username, note_title, note_content, save_time))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"success": True})

#获取所有笔记
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

#删除笔记
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

#进入修改笔记页面
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
        return jsonify({"success": True, "note_title": alterNote['note_title'], "note_content": alterNote['note_content'], "id": alterNote['id']})
    else:
        return jsonify({"success": False})

#保存修改的笔记
@app.route('/save_alterNote', methods=['POST'])
def save_alterNote():
    data = request.get_json()
    username = data.get('username')
    note_title = data.get('note_title')
    note_content = data.get('note_content')
    id = data.get('id')

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("UPDATE notedata SET note_title = %s, note_content = %s WHERE username = %s AND id = %s", (note_title, note_content, username, id))
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"success": True})

#文字识别
UPLOAD_FOLDER = './static/get_text_image'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

#响应前端文字识别
@app.route('/ocr', methods=['POST'])
def ocr():
    file = request.files['image']

    # 删除 get_text_image 目录下的所有文件
    for filename in os.listdir(UPLOAD_FOLDER):
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        if os.path.isfile(file_path):
            os.remove(file_path)

    if file:
        # 保存文件
        filename = 'image.jpg'  # 固定文件名为 image.jpg
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)

    img_Text = get_texts()
    if img_Text:
        return jsonify({"success": True, "have_text": True, "img_Text": img_Text})
    else:
        return jsonify({"success": True, "have_text": False, "img_Text": "未识别到文字！"})

#ai对话
@app.route('/ai', methods=['POST'])
def ai():
    data = request.json
    user_message = data.get('message')

    ai_response = chat_with_ai(user_message)

    return jsonify({
        'success': True,
        'message': ai_response
    })


# 语音转文本（支持文件上传和实时音频流）
@app.route('/speech-to-text', methods=['POST']) #此函数使用deepseek辅助编写
def handle_speech_recognition():
    try:
        # 检查是否是文件上传
        if 'audio' in request.files:
            audio_file = request.files['audio']
            if audio_file.filename == '':
                return jsonify({"success": False, "error": "未选择文件"})

            if not allowed_file(audio_file.filename):
                return jsonify({"success": False, "error": "不支持的文件格式"})

            # 调用语音转文本函数（文件模式）
            text, error = speech_to_text(audio_file=audio_file)

        # 检查是否是实时音频流（通过请求体直接发送）
        elif request.data:
            # 获取原始音频数据
            live_audio = io.BytesIO(request.data)

            # 调用语音转文本函数（实时模式）
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


# 个人主页相关API
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

        # 修改后：使用SHA2加密验证旧密码
        cursor.execute(
            "SELECT * FROM users WHERE username = %s AND password = SHA2(%s, 256)",
            (username, old_password)
        )
        user = cursor.fetchone()
        if not user:
            return jsonify({'success': False, 'message': '原密码不正确'}), 401

        # 修改后：使用SHA2加密存储新密码
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

        # 使用参数化查询防止SQL注入
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

        # 处理可能为NULL的字段
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

#错题集模块
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

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)