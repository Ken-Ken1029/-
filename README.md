# 云笔记系统
Cloud Note-Taking System

#### 本作品是一个多功能云笔记系统，主界面集成个人主页、笔记管理、文字识别、AI问答、语音转文本、错题集等八大模块。通过HTML+CSS实现前端界面，JavaScript与后端Flask路由交互，模块化Python文件处理功能逻辑，后端使用mysql数据库储存数据，帮助用户管理知识

### 项目准备：
版本：python-3以上的版本，mysql-8以上的版本  
第三方库：安装flask、mysql-connector-python、flask_cors、requests、torch、werkzeug、pydub、imgoc等库

### 在mysql中建立数据库：
#### 创建数据库
CREATE DATABASE my_project;

#### 创建表
USE my_project;

-- 用户表（存储用户名和密码）  
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(20) NOT NULL UNIQUE,
    password VARCHAR(64) NOT NULL,
    realname VARCHAR(50) DEFAULT '*',
    class VARCHAR(50) DEFAULT '*',
    studentid VARCHAR(20) DEFAULT '*'
);

-- 用户数据表（存储注册和登录时间）  
CREATE TABLE userdata (  
    id INT AUTO_INCREMENT PRIMARY KEY,  
    username VARCHAR(20) NOT NULL UNIQUE,  
    sign_time DATE,  
    last_time DATE  
);

-- 笔记表  
CREATE TABLE notedata (  
    id INT AUTO_INCREMENT PRIMARY KEY,  
    username VARCHAR(20) NOT NULL,  
    note_title TEXT,  
    note_content TEXT,  
    save_time DATE  
);  

-- 错题表   
CREATE TABLE wrong_questions (  
    id INT AUTO_INCREMENT PRIMARY KEY,  
    question TEXT NOT NULL,  
    answer TEXT NOT NULL,  
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 题库表   
CREATE TABLE question_bank (   
    id INT AUTO_INCREMENT PRIMARY KEY,   
    question TEXT NOT NULL,   
    answer TEXT NOT NULL,  
    moved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

### 模型的选择
1、DeepSeek-V3.2（非思考模式：deepseek-chat），擅长领域：通用问答、学习辅导、代码、逻辑推理，价格：输入 0.2元/百万tokens，输出 2元/百万tokens  
2、Whisper base是OpenAI开源的中等规模语音识别模型（74M参数），支持多语言（含英语专用版base.en）。训练数据达68万小时，适用于实时ASR和语音翻译，词错误率约4.27%（英语）。比large模型快16倍，适合移动端/嵌入式设备，可通过Hugging Face或命令行调用，平衡速度与准确性。
### 项目结构
云笔记系统  
├── static/ # 静态资源目录  
│ ├── img/ # 系统图片资源  
│ │ ├── 0.jpg # 示例图片  
│ │ ├── 1.jpg  
│ │ ├── 2.jpg  
│ │ ├── 3.jpg  
│ │ ├── 4.jpg  
│ │ ├── home.jpg # 主页背景图  
│ │ └── login.jpg # 登录页背景图  
│ │  
│ ├── get_text_image/ # OCR图片上传目录  
│ ├── audio_uploads/ # 语音文件上传目录  
│ ├── ffmpeg-7.0.2-essentials_build/ # 语音处理文件
│ │   
│ └── css/ # 样式表目录  
│&nbsp;&nbsp;&nbsp;&nbsp;├── login.css # 登录页样式  
│&nbsp;&nbsp;&nbsp;&nbsp;├── index.css # 主页样式  
│&nbsp;&nbsp;&nbsp;&nbsp;├── note.css # 笔记页样式  
│&nbsp;&nbsp;&nbsp;&nbsp;├── history.css # 历史笔记样式  
│&nbsp;&nbsp;&nbsp;&nbsp;├── get_text.css # 文字识别页样式  
│&nbsp;&nbsp;&nbsp;&nbsp;├── get_ai.css # AI问答页样式  
│&nbsp;&nbsp;&nbsp;&nbsp;├── speech_to_text.css # 语音转文字页样式  
│&nbsp;&nbsp;&nbsp;&nbsp;├── mistakes.css # 错题页样式  
│&nbsp;&nbsp;&nbsp;&nbsp;└── personal.css # 个人主页样式  
│  
├── templates/ # HTML模板目录  
│ ├── login.html # 登录页模板  
│ ├── index.html # 主页模板  
│ ├── note.html # 笔记编辑模板  
│ ├── history.html # 历史笔记模板  
│ ├── get_text.html # 文字识别模板  
│ ├── get_ai.html # AI问答模板  
│ ├── speech_to_text.html # 语音转文字模板  
│ ├── mistakes.html # 错题管理模板  
│ └── personal.html # 个人主页模板  
│  
├── app.py # Flask主应用入口（含笔记模块和个人主页模块）  
├── get_text.py # OCR文字识别模块  
├── get_ai.py # AI问答模块  
├── speech_to_text.py # 语音转文字模块  
├── mistakes.py # 错题管理模块  
│  
├── my_project.sql # MySQL数据库导出文件   
├── readme.txt #第三方库的说明  
└── README.md # 项目说明文档  
### 运行项目
做完所有准备之后运行app.py文件  
从http://127.0.0.1:5000端口进入项目的网页界面