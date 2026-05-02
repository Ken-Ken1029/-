from openai import OpenAI

# 初始化 DeepSeek 客户端
client = OpenAI(
    api_key="sk-39d29a18555d4be29d77204ba1ab250c",
    base_url="https://api.deepseek.com"
)

def chat_with_ai(prompt):  #此函数使用deepseek辅助编写
    """
    与 AI 进行问答（使用 DeepSeek API）
    :param prompt: 用户输入的问题
    :return: AI 的回答
    """
    try:
        # 系统提示，设定 AI 的角色
        system_prompt = """
        你是一个学习小助手，尽量用比较有趣的口吻回答问题，可以适当加一些表情,回答的要有条理，结果简洁明了。
        """

        # 使用 DeepSeek 客户端发起请求
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            stream=False
        )

        ai_response = response.choices[0].message.content

        # 清理响应（保持与原来相同的处理逻辑）
        if "<think>" in ai_response:
            ai_response = ai_response.split("</think>")[-1].strip()

        return ai_response

    except Exception as e:
        return f"发生错误: {e}"


def main():
    print("欢迎使用学习小助手！输入 '退出' 结束对话。")
    while True:
        # 获取用户输入
        user_input = input("你: ")
        if user_input.lower() in ["退出", "exit", "quit"]:
            print("学习小助手: 再见！记得每天进步一点点哦！")
            break
        # 获取 AI 的回答
        ai_response = chat_with_ai(user_input)
        print(f"学习小助手: {ai_response}")


if __name__ == "__main__":
    main()