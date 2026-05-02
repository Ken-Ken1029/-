import { createApp, reactive } from './vue.esm-browser.js';

createApp({
    setup() {
        const username = localStorage.getItem('username') || '';
        const data = reactive({
            messages : [
                { role: 'ai', content: '你好！' + username },
            ],
            userInput : '', // 用户输入
            button_text : '发送', // 按钮文字
        });

        // 发送消息给AI
        const sendMessage = async () => {
            if (!data.userInput) return;
            const user_message = data.userInput;
            // 添加用户消息
            data.messages.push({ role: 'user', content: user_message });
            // 清空输入框
            data.userInput = '';
            // 禁用按钮
            data.button_text = 'AI思考中...';

            // 调用AI接口
            try {
                const response = await fetch('http://127.0.0.1:5000/ai', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: user_message
                    })
                });

                const result = await response.json();

                if (result.success) {
                    // 添加AI回复
                    data.messages.push({ role: 'ai', content: result.message });
                } else {
                    data.messages.push({ role: 'ai', content: 'AI 回答失败，请稍后重试。' });
                }
            } catch (error) {
                data.messages.push({ role: 'ai', content: '网络错误，请检查连接。' });
            }

            // 启用按钮
            data.button_text = '发送';
        };

        return {
            data,
            sendMessage
        };
    }
}).mount('#app');