import { createApp, reactive } from './vue.esm-browser.js'

createApp({
    setup() {
        const data = reactive({
            isNewNote: false,
            isHistoryNote: false,
            isGetText: false,
            isAIQuestion: false,
            isSpeechToText: false,
            isMistakes: false,
            isPersonal: false,
            isIndex: true,
            username: '未知',
            userData: null,
            sign_time: null,
            last_time: null,
        })

        data.username = localStorage.getItem('username') || '未知';

        // 页面加载时调用后端接口获取用户数据
        const fetchUserData = async () => {
            if (data.username === '未知') {
                return;
            }

            try {
                // 修改：使用相对路径
                const response = await fetch('/index', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: data.username,
                    })
                })

                const result = await response.json()

                if (result.success) {
                    data.username = result.username
                    data.sign_time = result.sign_time
                    data.last_time = result.last_time
                    data.userData = result.userData || null;
                } else {
                    data.username = '未知错误！'
                }
            } catch (error) {
                console.error('获取用户数据失败:', error);
                data.username = '访问失败！'
            }
        }

        fetchUserData()

        const openPersonal = () => {
            resetAllViews();
            data.isPersonal = true;
        }

        const resetAllViews = () => {
            data.isIndex = false;
            data.isNewNote = false;
            data.isHistoryNote = false;
            data.isGetText = false;
            data.isAIQuestion = false;
            data.isSpeechToText = false;
            data.isMistakes = false;
            data.isPersonal = false;
        }

        const isNewNote = () => {
            resetAllViews();
            data.isNewNote = true;
        }

        const isHistoryNote = () => {
            resetAllViews();
            data.isHistoryNote = true;
        }

        const isGetText = () => {
            resetAllViews();
            data.isGetText = true;
        }

        const isAIQuestion = () => {
            resetAllViews();
            data.isAIQuestion = true;
        }

        const isSpeechToText = () => {
            resetAllViews();
            data.isSpeechToText = true;
        }

        const isMistakes = () => {
            resetAllViews();
            data.isMistakes = true;
        }

        const goHome = () => {
            resetAllViews();
            data.isIndex = true;
        }

        return {
            data,
            isNewNote,
            isHistoryNote,
            isGetText,
            isAIQuestion,
            isSpeechToText,
            isMistakes,
            goHome,
            openPersonal,
            resetAllViews
        }
    }
}).mount('#app')
