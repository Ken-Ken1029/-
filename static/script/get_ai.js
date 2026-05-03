import { createApp, reactive } from './vue.esm-browser.js';

createApp({
    setup() {
        const username = localStorage.getItem('username') || '';
        const data = reactive({
            messages : [
                { role: 'ai', content: '你好！' + username },
            ],
            userInput : '',
            button_text : '发送',
        });

        // 发送消息给AI
        const sendMessage = async () => {
            if (!data.userInput) return;
            const user_message = data.userInput;
            data.messages.push({ role: 'user', content: user_message });
            data.userInput = '';
            data.button_text = 'AI思考中...';

            try {
                // 修改：使用相对路径
                const response = await fetch('/ai', {
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
                    data.messages.push({ role: 'ai', content: result.message });
                } else {
                    data.messages.push({ role: 'ai', content: 'AI 回答失败，请稍后重试。' });
                }
            } catch (error) {
                data.messages.push({ role: 'ai', content: '网络错误，请检查连接。' });
            }

            data.button_text = '发送';
        };

        return {
            data,
            sendMessage
        };
    }
}).mount('#app');
