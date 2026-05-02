import { createApp, reactive } from './vue.esm-browser.js'

createApp({
    setup() {
        const data = reactive({
            isNewNote: false,       // 是否新建笔记
            isHistoryNote: false,    // 是否查看历史笔记
            isGetText: false,        // 是否进行文字识别
            isAIQuestion: false,     // 是否进行AI问答
            isSpeechToText: false, // 是否进行语音识别
            isMistakes: false,     //是否进入错题集
            isPersonal: false,       // 新增：是否显示个人主页
            isIndex: true,           // 是否为主界面
            username: '未知',        // 用户名
            userData: null,          // 用户数据
            sign_time: null,         // 注册时间
            last_time: null,         // 上次登录时间
        })

        // 从 localStorage 中获取用户名
        data.username = localStorage.getItem('username') || '未知';

        // 页面加载时调用后端接口获取用户数据
        const fetchUserData = async () => {
            if (data.username === '未知') {
                return;
            }

            try {
                const response = await fetch('http://127.0.0.1:5000/index', {
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
                    // 可以在这里存储更多用户数据
                    data.userData = result.userData || null;
                } else {
                    data.username = '未知错误！'
                }
            } catch (error) {
                console.error('获取用户数据失败:', error);
                data.username = '访问失败！'
            }
        }

        // 页面加载时调用
        fetchUserData()

        // 打开个人主页
        const openPersonal = () => {
            // 隐藏其他所有页面
            resetAllViews();
            // 显示个人主页
            data.isPersonal = true;

            // 可以在这里添加加载个人数据的逻辑
            //loadPersonalData();
        }

        // 重置所有视图状态
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
            openPersonal,  // 暴露openPersonal方法
            resetAllViews // 可选：如果需要外部调用
        }
    }
}).mount('#app')