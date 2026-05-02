import {createApp, reactive} from './vue.esm-browser.js'

createApp({
    setup() {
        const data = reactive({
            noteTitle: '', // 笔记标题
            noteContent: '', // 笔记内容
        });

        // 格式化文本
        const formatText = (command) => {
            const selection = window.getSelection();
            if (!selection.rangeCount) return;

            const range = selection.getRangeAt(0);
            const span = document.createElement('span');

            switch (command) {
                case 'bold':
                    span.style.fontWeight = 'bold';
                    break;
                case 'italic':
                    span.style.fontStyle = 'italic';
                    break;
                case 'underline':
                    span.style.textDecoration = 'underline';
                    break;
                default:
                    break;
            }

            range.surroundContents(span);
            selection.removeAllRanges();
            selection.addRange(range);
        };

        // 改变文字颜色
        const changeColor = (color) => {
            const selection = window.getSelection();
            if (!selection.rangeCount) return;

            const range = selection.getRangeAt(0);
            const span = document.createElement('span');
            span.style.color = color;

            range.surroundContents(span);
            selection.removeAllRanges();
            selection.addRange(range);
        };

        // 改变文字大小
        const changeSize = (size) => {
            const selection = window.getSelection();
            if (!selection.rangeCount) return;

            const range = selection.getRangeAt(0);
            const span = document.createElement('span');
            span.style.fontSize = size;

            range.surroundContents(span);
            selection.removeAllRanges();
            selection.addRange(range);
        };

        // 清空样式
        const clearStyles = () => {
            const noteContent = document.getElementById('noteContent');
            const spanElements = noteContent.querySelectorAll('span');

            spanElements.forEach(span => {
                // 创建一个文本节点，内容为 <span> 的文本
                const textNode = document.createTextNode(span.textContent);
                // 用文本节点替换 <span> 标签
                span.replaceWith(textNode);
            });
        };

        // 更新笔记内容
        const updateNoteContent = (event) => {
            data.noteContent = event.target.innerHTML;
        };

        // 保存笔记
        const saveNote = async () => {
            const username = localStorage.getItem('username') || '';
            try {
                const response = await fetch('http://127.0.0.1:5000/saveNote', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: username,
                        note_title: data.noteTitle,
                        note_content: data.noteContent, // 包含样式的 HTML 内容
                    })
                })

                const result = await response.json()

                if (result.success) {
                    alert('笔记已保存！');
                } else {
                    alert('保存失败！');
                }
            } catch (error) {
                alert('访问失败！');
            }
        };

        return {
            data,
            formatText,
            changeColor,
            changeSize,
            clearStyles,
            updateNoteContent,
            saveNote,
        };
    },
}).mount('#app');