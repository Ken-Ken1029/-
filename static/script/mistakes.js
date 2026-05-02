document.addEventListener('DOMContentLoaded', function() {
    // 元素引用
    const addBtn = document.getElementById('add-btn');
    const reviewBtn = document.getElementById('review-btn');
    const bankBtn = document.getElementById('bank-btn');
    const reviewSection = document.getElementById('review-section');
    const bankSection = document.getElementById('bank-section');
    const submitAnswerBtn = document.getElementById('submit-answer-btn');
    const answerSection = document.querySelector('.answer-section');
    const correctBtn = document.getElementById('correct-btn');
    const tryAgainBtn = document.getElementById('try-again-btn');
    const userAnswerTextarea = document.getElementById('user-answer');
    const resultFeedback = document.querySelector('.result-feedback');

    let currentQuestion = null;

    // 添加错题
    addBtn.addEventListener('click', function() {
        const question = document.getElementById('question').value.trim();
        const answer = document.getElementById('answer').value.trim();

        if (!question || !answer) {
            alert('题目和答案不能为空');
            return;
        }

        fetch('/add_question', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `question=${encodeURIComponent(question)}&answer=${encodeURIComponent(answer)}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('题目添加成功');
                document.getElementById('question').value = '';
                document.getElementById('answer').value = '';
            } else {
                alert(data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('添加失败，请稍后重试');
        });
    });

    // 复习错题
    reviewBtn.addEventListener('click', function() {
        bankSection.classList.add('hidden');
        reviewSection.classList.remove('hidden');
        answerSection.classList.add('hidden');
        userAnswerTextarea.value = '';
        loadRandomQuestion();
    });

    // 提交答案
    submitAnswerBtn.addEventListener('click', function() {
        const userAnswer = userAnswerTextarea.value.trim();
        if (!userAnswer) {
            alert('请输入你的答案');
            return;
        }

        answerSection.classList.remove('hidden');
        const correctAnswer = currentQuestion.answer;

        // 简单比较答案（实际应用中可能需要更复杂的比较逻辑）
        if (userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
            resultFeedback.innerHTML = '<p class="correct">回答正确！</p>';
            correctBtn.classList.remove('hidden');
        } else {
            resultFeedback.innerHTML = '<p class="wrong">回答错误！</p>';
            correctBtn.classList.add('hidden');
        }
    });

    // 回答正确(移入题库)
    correctBtn.addEventListener('click', function() {
        if (!currentQuestion) return;

        fetch('/move_to_bank', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `id=${currentQuestion.id}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('题目已移入题库');
                reviewBtn.click(); // 自动获取下一题
            } else {
                alert(data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('操作失败');
        });
    });

    // 再试一次
    tryAgainBtn.addEventListener('click', function() {
        answerSection.classList.add('hidden');
        userAnswerTextarea.value = '';
        userAnswerTextarea.focus();
    });

    // 查看题库
    bankBtn.addEventListener('click', function() {
        reviewSection.classList.add('hidden');
        bankSection.classList.remove('hidden');
        loadQuestionBank();
    });

    // 加载随机题目
    function loadRandomQuestion() {
        fetch('/get_random_question')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                currentQuestion = data.data;
                document.getElementById('review-question').textContent = data.data.question;
                document.getElementById('review-answer').textContent = data.data.answer;
            } else {
                alert(data.message);
                document.getElementById('review-question').textContent = '没有错题可复习';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('获取题目失败');
        });
    }

    // 加载题库
    function loadQuestionBank() {
        fetch('/get_question_bank')
        .then(response => response.json())
        .then(data => {
            const bankContainer = document.getElementById('question-bank');
            bankContainer.innerHTML = '';

            if (data.success && data.data.length > 0) {
                data.data.forEach(item => {
                    const bankItem = document.createElement('div');
                    bankItem.className = 'bank-item';
                    bankItem.innerHTML = `
                        <div class="bank-question">${item.question}</div>
                        <div class="bank-answer">${item.answer}</div>
                    `;
                    bankContainer.appendChild(bankItem);
                });
            } else {
                bankContainer.innerHTML = '<p>题库为空</p>';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('获取题库失败');
        });
    }
});