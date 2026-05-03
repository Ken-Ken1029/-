import {createApp, reactive} from './vue.esm-browser.js'

createApp({
    setup() {
        const data = reactive({
            noteTitle: '',
            noteContent: '',
        });

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

        const clearStyles = () => {
            const noteContent = document.getElementById('noteContent');
            const spanElements = noteContent.querySelectorAll('span');

            spanElements.forEach(span => {
                const textNode = document.createTextNode(span.textContent);
                span.replaceWith(textNode);
            });
        };

        const updateNoteContent = (event) => {
            data.noteContent = event.target.innerHTML;
        };

        // 保存笔记
        const saveNote = async () => {
            const username = localStorage.getItem('username') || '';
            try {
                // 修改：使用相对路径
                const response = await fetch('/saveNote', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: username,
                        note_title: data.noteTitle,
                        note_content: data.noteContent,
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
