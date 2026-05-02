import mysql.connector
from mysql.connector import Error
import random
from datetime import datetime
import os
import urllib.parse


class DBOperations:
    def __init__(self):
        """初始化数据库连接"""
        # 从环境变量获取数据库配置
        self.db_config = self._get_db_config()
        self.conn = None
        self._connect()

    def _get_db_config(self):
        """获取数据库配置（优先使用Railway环境变量）"""
        # 方式1: 使用Railway自动注入的 MYSQL_URL
        mysql_url = os.environ.get('MYSQL_URL') or os.environ.get('MYSQLPUBLIC_URL')

        if mysql_url:
            # 解析URL: mysql://user:password@host:port/database
            parsed = urllib.parse.urlparse(mysql_url)
            config = {
                'host': parsed.hostname,
                'port': parsed.port or 3306,
                'user': parsed.username,
                'password': parsed.password,
                'database': parsed.path.lstrip('/') if parsed.path else 'my_project'
            }
            print(f"使用Railway数据库配置: {config['host']}:{config['port']}")
            return config

        # 方式2: 使用单独的环境变量
        if os.environ.get('DB_HOST'):
            config = {
                'host': os.environ.get('DB_HOST'),
                'port': int(os.environ.get('DB_PORT', 3306)),
                'user': os.environ.get('DB_USER', 'root'),
                'password': os.environ.get('DB_PASSWORD', ''),
                'database': os.environ.get('DB_NAME', 'my_project')
            }
            print(f"使用环境变量数据库配置: {config['host']}:{config['port']}")
            return config

        # 方式3: 本地开发默认配置
        print("使用本地开发数据库配置: localhost:3306")
        return {
            'host': 'localhost',
            'user': 'root',
            'password': '123456',
            'database': 'my_project'
        }

    def _connect(self):
        """建立数据库连接"""
        try:
            self.conn = mysql.connector.connect(**self.db_config)
            print(f"数据库连接成功: {self.db_config['host']}:{self.db_config['port']}")
        except Error as e:
            print(f"数据库连接失败: {e}")
            print(
                f"尝试连接的配置: host={self.db_config.get('host')}, port={self.db_config.get('port')}, database={self.db_config.get('database')}")
            raise

    def _reconnect(self):
        """重新连接数据库"""
        if self.conn and self.conn.is_connected():
            self.conn.close()
        self._connect()

    def _execute_query(self, query, params=None, fetch_one=False, fetch_all=False):
        """执行SQL查询的通用方法"""
        cursor = None
        try:
            if not self.conn or not self.conn.is_connected():
                self._reconnect()

            cursor = self.conn.cursor(dictionary=True)
            cursor.execute(query, params or ())

            if fetch_one:
                result = cursor.fetchone()
            elif fetch_all:
                result = cursor.fetchall()
            else:
                result = None

            self.conn.commit()
            return result

        except Error as e:
            if self.conn:
                self.conn.rollback()
            print(f"数据库操作错误: {e}")
            raise
        finally:
            if cursor:
                cursor.close()

    def add_question(self, question, answer):
        """添加错题"""
        try:
            query = """
                INSERT INTO wrong_questions (question, answer, created_at) 
                VALUES (%s, %s, %s)
            """
            self._execute_query(query, (question, answer, datetime.now()))
            return {'success': True, 'message': '题目添加成功'}
        except Exception as e:
            return {'success': False, 'message': f'添加失败: {str(e)}'}

    def get_random_question(self):
        """随机获取一道错题"""
        try:
            # 先获取总数量
            count_query = "SELECT COUNT(*) as count FROM wrong_questions"
            count_result = self._execute_query(count_query, fetch_one=True)

            if not count_result or count_result['count'] == 0:
                return {'success': False, 'message': '没有错题可复习'}

            # 随机获取一道题
            offset = random.randint(0, count_result['count'] - 1)
            question_query = "SELECT * FROM wrong_questions LIMIT %s, 1"
            question = self._execute_query(question_query, (offset,), fetch_one=True)

            return {
                'success': True,
                'data': {
                    'id': question['id'],
                    'question': question['question'],
                    'answer': question['answer']
                }
            }
        except Exception as e:
            return {'success': False, 'message': f'获取题目失败: {str(e)}'}

    def move_to_bank(self, question_id):
        """将错题移入题库"""
        try:
            # 开启事务
            self._execute_query("START TRANSACTION")

            # 获取错题
            get_query = "SELECT * FROM wrong_questions WHERE id = %s FOR UPDATE"
            question = self._execute_query(get_query, (question_id,), fetch_one=True)

            if not question:
                self._execute_query("ROLLBACK")
                return {'success': False, 'message': '题目不存在'}

            # 插入题库
            insert_query = """
                INSERT INTO question_bank (question, answer, moved_at) 
                VALUES (%s, %s, %s)
            """
            self._execute_query(insert_query,
                                (question['question'], question['answer'], datetime.now()))

            # 删除错题
            delete_query = "DELETE FROM wrong_questions WHERE id = %s"
            self._execute_query(delete_query, (question_id,))

            # 提交事务
            self._execute_query("COMMIT")

            return {'success': True, 'message': '题目已移入题库'}
        except Exception as e:
            self._execute_query("ROLLBACK")
            return {'success': False, 'message': f'操作失败: {str(e)}'}

    def get_question_bank(self):
        """获取题库列表"""
        try:
            query = "SELECT * FROM question_bank ORDER BY moved_at DESC"
            questions = self._execute_query(query, fetch_all=True)

            return {
                'success': True,
                'data': questions
            }
        except Exception as e:
            return {'success': False, 'message': f'获取题库失败: {str(e)}'}

    def __del__(self):
        """析构函数，关闭数据库连接"""
        if self.conn and self.conn.is_connected():
            self.conn.close()