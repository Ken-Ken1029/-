import { createApp, reactive, onMounted } from './vue.esm-browser.js';

createApp({
    setup() {
        const data = reactive({
            isLook: false,
            isHistoryNote: true,
            historyNotes: [],
            noteTitle: '',
            noteContent: '',
            id: 0,
        });

        const username = localStorage.getItem('username') || '';

        // 设置 noteTitle
        const setNoteTitle = (title) => {
            data.noteTitle = title;
        };

        // 查询历史笔记
        const historyNote = async () => {
            try {
                const response = await fetch('http://127.0.0.1:5000/historyNote', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: username,
                    })
                });

                const result = await response.json();

                if (result.success) {
                    data.historyNotes = result.notedata;
                } else {
                    data.historyNotes = [{note_title: "暂无", save_time: "未知" }];
                }
            } catch (error) {
                alert('访问失败！');
            }
        };

        // 初始化加载历史笔记
        historyNote();

        // 点击修改按钮
        const alterNote = async () => {
            if (data.noteTitle === '暂无') return;
            try {
                const response = await fetch('http://127.0.0.1:5000/alterNote', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: username,
                        note_title: data.noteTitle,
                    })
                });

                const result = await response.json();
                if (result.success) {
                    data.noteTitle = result.note_title;
                    data.noteContent = result.note_content;
                    data.id = result.id;
                    data.isHistoryNote = false;

                    // 设置内容到可编辑区域
                    const noteContentEl = document.getElementById('noteContent');
                    if (noteContentEl) {
                        noteContentEl.innerHTML = result.note_content || '';
                    }
                } else {
                    alert('获取笔记失败！');
                }
            } catch (error) {
                alert('访问失败！');
            }
        };

        // 点击删除按钮
        const delNote = async () => {
            if (data.noteTitle === '暂无') return;
            if (!confirm('确定要删除此笔记吗？')) return;

            try {
                const response = await fetch('http://127.0.0.1:5000/delNote', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: username,
                        note_title: data.noteTitle,
                    })
                });

                const result = await response.json();
                if (result.success) {
                    alert('删除成功！');
                    historyNote();
                } else {
                    alert('删除失败！');
                }
            } catch (error) {
                alert('访问失败！');
            }
        };

        // 点击直接查看
        const lookNote = () => {
            data.isLook = true;
            alterNote();
        };

        // 格式化文本
        const formatText = (command) => {
            document.execCommand(command, false, null);
            updateNoteContent();
        };

        // 改变文字颜色
        const changeColor = (color) => {
            document.execCommand('foreColor', false, color);
            updateNoteContent();
        };

        // 改变文字大小
        const changeSize = (size) => {
            document.execCommand('fontSize', false, '7'); // 7是最大的预设值
            const fontElements = document.querySelectorAll('font[size="7"]');
            fontElements.forEach(el => {
                el.removeAttribute('size');
                el.style.fontSize = size;
            });
            updateNoteContent();
        };

        // 清空样式
        const clearStyles = () => {
            const noteContentEl = document.getElementById('noteContent');
            if (noteContentEl) {
                const text = noteContentEl.innerText;
                noteContentEl.innerHTML = text;
                updateNoteContent();
            }
        };

        // 更新笔记内容
        const updateNoteContent = () => {
            const noteContentEl = document.getElementById('noteContent');
            if (noteContentEl) {
                data.noteContent = noteContentEl.innerHTML;
            }
        };

        // 返回历史记录
        const goBack = () => {
            data.isHistoryNote = true;
            data.isLook = false;
        };

        // 保存笔记
        const save_alterNote = async () => {
            if (!data.noteTitle.trim()) {
                alert('请输入笔记标题！');
                return;
            }

            try {
                const response = await fetch('http://127.0.0.1:5000/save_alterNote', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: username,
                        note_title: data.noteTitle,
                        note_content: data.noteContent,
                        id: data.id,
                    })
                });

                const result = await response.json();

                if (result.success) {
                    alert('笔记已修改！');
                    historyNote();
                    data.isHistoryNote = true;
                } else {
                    alert('修改失败！');
                }
            } catch (error) {
                alert('访问失败！');
            }
        };

        return {
            data,
            setNoteTitle,
            alterNote,
            delNote,
            lookNote,
            formatText,
            changeColor,
            changeSize,
            clearStyles,
            updateNoteContent,
            goBack,
            save_alterNote,
        };
    },
}).mount('#app');