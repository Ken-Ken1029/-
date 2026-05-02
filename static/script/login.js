import {createApp, reactive} from './vue.esm-browser.js'

createApp({
    setup(){
        const data = reactive({
            username: '',
            password: '',
            ispassword: '',
            error: '',
            isLogin: true
        })

        const isLogin = () => {
            data.isLogin = !data.isLogin
            data.error = ''
            // 清空密码字段
            data.password = ''
            data.ispassword = ''
        }

        const validateInputs = () => {
            if (!data.username || !data.password) {
                data.error = '账号和密码不能为空'
                return false
            }

            // 添加长度验证
            if (data.username.length < 4 || data.username.length > 20) {
                data.error = '用户名长度必须在4到20个字符之间'
                return false
            }

            if (data.password.length < 6 || data.password.length > 20) {
                data.error = '密码长度必须在6到20个字符之间'
                return false
            }

            return true
        }

        const login = async () => {
            if (!validateInputs()) return

            try {
                const response = await fetch('http://127.0.0.1:5000/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        isLogin: true,
                        username: data.username,
                        password: data.password
                    })
                })

                const result = await response.json()

                if (result.success) {
                    localStorage.setItem('username', data.username)
                    window.location.href = 'index.html'
                } else {
                    data.error = result.message || '登录失败'
                }
            } catch (error) {
                data.error = '登录请求失败，请稍后重试'
                console.error('登录错误:', error)
            }
        }

        const sign = async () => {
            if (!validateInputs()) return

            if (data.password !== data.ispassword) {
                data.error = '两次密码不一致'
                return
            }

            try {
                const response = await fetch('http://127.0.0.1:5000/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        isLogin: false,
                        username: data.username,
                        password: data.password
                    })
                })

                const result = await response.json()

                if (result.success) {
                    data.isLogin = true
                    data.error = '注册成功，请登录'
                    // 清空确认密码字段
                    data.ispassword = ''
                } else {
                    data.error = result.message || '注册失败'
                }
            } catch (error) {
                data.error = '注册请求失败，请稍后重试'
                console.error('注册错误:', error)
            }
        }

        return {
            data,
            isLogin,
            login,
            sign
        }
    }
}).mount('#app')