// 文件上传处理
let selectedFile = null;

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    // 检查文件类型
    const allowedExtensions = ['wav', 'mp3', 'ogg', 'm4a'];
    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
        alert('不支持的音频格式');
        return;
    }

    selectedFile = file;
    const fileInfo = document.getElementById('fileInfo');
    fileInfo.innerHTML = `
        <p>已选择文件: <strong>${file.name}</strong></p>
        <p>大小: ${(file.size / 1024 / 1024).toFixed(2)} MB</p>
    `;
    fileInfo.style.display = 'block';
    document.getElementById('transcribeBtn').disabled = false;
}

// 上传音频转录
async function transcribeAudio() {
    if (!selectedFile) return;

    const resultDiv = document.getElementById('result');
    const resultText = document.getElementById('resultText');
    const transcribeBtn = document.getElementById('transcribeBtn');

    resultDiv.style.display = 'block';
    resultText.innerHTML = '<p class="status">处理中，请稍候...</p>';
    transcribeBtn.disabled = true;
    transcribeBtn.textContent = '处理中...';

    const formData = new FormData();
    formData.append('audio', selectedFile);

    try {
        const response = await fetch('/speech-to-text', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.error) {
            resultText.innerHTML = `<p class="error">错误: ${data.error}</p>`;
        } else {
            resultText.innerHTML = `<p>${data.text}</p>`;
            document.getElementById('copyBtn').disabled = false;
        }
    } catch (error) {
        resultText.innerHTML = `<p class="error">请求失败: ${error.message}</p>`;
    } finally {
        transcribeBtn.disabled = false;
        transcribeBtn.textContent = '开始识别';
    }
}

// 实时录音处理
let mediaRecorder;
let audioChunks = [];
let audioContext;
let analyser;
let canvasCtx;
let animationId;
let recognition; // 用于Web Speech API
let finalTranscript = '';
let interimTranscript = '';

async function startRecording() {
    try {
        // 初始化Web Speech API
        if ('webkitSpeechRecognition' in window) {
            recognition = new webkitSpeechRecognition();
        } else if ('SpeechRecognition' in window) {
            recognition = new SpeechRecognition();
        } else {
            throw new Error('您的浏览器不支持语音识别');
        }

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'zh-CN';

        recognition.onresult = (event) => {
            interimTranscript = '';
            finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            document.getElementById('liveResultText').innerHTML += finalTranscript;
            document.getElementById('interimResult').innerHTML = interimTranscript;
            document.getElementById('copyLiveBtn').disabled = false;
        };

        recognition.onerror = (event) => {
            console.error('识别错误:', event.error);
            document.getElementById('status').innerHTML = `<span class="error">识别错误: ${event.error}</span>`;
        };

        recognition.onend = () => {
            if (document.getElementById('stopBtn').style.display !== 'none') {
                recognition.start();
            }
        };

        // 开始语音识别
        recognition.start();

        // 音频上下文和可视化
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            cancelAnimationFrame(animationId);
            const canvas = document.getElementById('visualizer');
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        };

        audioChunks = [];
        mediaRecorder.start(100);

        document.getElementById('startBtn').style.display = 'none';
        document.getElementById('stopBtn').style.display = 'inline-block';
        document.getElementById('status').textContent = "录音中...点击'停止录音'结束";
        document.getElementById('copyLiveBtn').disabled = true;

        initVisualizer();
        drawWaveform();

    } catch (error) {
        console.error('录音错误:', error);
        document.getElementById('status').innerHTML = `<span class="error">录音错误: ${error.message}</span>`;
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }

    if (recognition) {
        recognition.stop();
    }

    document.getElementById('startBtn').style.display = 'inline-block';
    document.getElementById('stopBtn').style.display = 'none';
    document.getElementById('status').textContent = "录音完成";
}

function clearTranscript() {
    finalTranscript = '';
    interimTranscript = '';
    document.getElementById('liveResultText').innerHTML = '';
    document.getElementById('interimResult').innerHTML = '';
    document.getElementById('copyLiveBtn').disabled = true;
    document.getElementById('status').textContent = "点击开始转录，麦克风已关闭。";
}

// 初始化音频可视化
function initVisualizer() {
    const canvas = document.getElementById('visualizer');
    canvasCtx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}

// 绘制音频波形
function drawWaveform() {
    animationId = requestAnimationFrame(drawWaveform);

    const canvas = document.getElementById('visualizer');
    const width = canvas.width;
    const height = canvas.height;

    if (!analyser) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);

    canvasCtx.fillStyle = 'rgb(240, 240, 240)';
    canvasCtx.fillRect(0, 0, width, height);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'rgb(76, 175, 80)';
    canvasCtx.beginPath();

    const sliceWidth = width * 1.0 / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * height / 2;

        if (i === 0) {
            canvasCtx.moveTo(x, y);
        } else {
            canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
    }

    canvasCtx.lineTo(width, height / 2);
    canvasCtx.stroke();
}

// 复制结果功能
function copyResult() {
    const resultText = document.getElementById('resultText').textContent;
    navigator.clipboard.writeText(resultText).then(() => {
        alert('识别结果已复制到剪贴板');
    }).catch(err => {
        console.error('复制失败:', err);
        alert('复制失败，请手动选择文本复制');
    });
}

function copyLiveResult() {
    const resultText = document.getElementById('liveResultText').textContent;
    navigator.clipboard.writeText(resultText).then(() => {
        alert('识别结果已复制到剪贴板');
    }).catch(err => {
        console.error('复制失败:', err);
        alert('复制失败，请手动选择文本复制');
    });
}

// 拖放功能
document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.querySelector('.upload-area');

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#4CAF50';
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '#ccc';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#ccc';

        if (e.dataTransfer.files.length) {
            document.getElementById('fileInput').files = e.dataTransfer.files;
            handleFileSelect({ target: document.getElementById('fileInput') });
        }
    });

    initVisualizer();
});