import { createApp, reactive } from './vue.esm-browser.js';

createApp({
    setup() {
        const data = reactive({
            imageSrc: null,          // 上传的图片的 Base64 数据
            have_text: false,        // 是否有文字
            recognizedText: '',     // 识别出的文字
            processedImageSrc: null,
        });

        // 处理文件上传
        const handleFileUpload = (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    data.imageSrc = e.target.result;
                    sendImageToServer(file);
                };
                reader.readAsDataURL(file);
            }
        };


        const loadProcessedImage = async (imagePath) => {
            try {
                // 读取处理后的图片文件并转换为 Base64
                const response = await fetch(imagePath);
                const blob = await response.blob();
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result); // 返回 Base64 数据
                    reader.onerror = (e) => reject(e); // 处理错误
                    reader.readAsDataURL(blob);
                });
            } catch (error) {
                console.error('加载处理后的图片失败:', error);
                return null;
            }
        };

        // 发送图片到服务器进行文字识别
        const sendImageToServer = async (file) => {
            data.processedImageSrc = null;
            data.have_text = false;
            const formData = new FormData();
            formData.append('image', file);

            try {
                const response = await fetch('http://127.0.0.1:5000/ocr', {
                    method: 'POST',
                    body: formData, // 直接传入 formData
                });
                const result = await response.json();

                if (result.success) {
                    data.have_text = result.have_text;
                    data.recognizedText = result.img_Text;
                    // 加载处理后的图片
                    const processedImageSrc = await loadProcessedImage('./get_text_image/image_getText.jpg');
                    if (processedImageSrc) {
                        data.processedImageSrc = processedImageSrc; // 更新处理后的图片
                    } else {
                        alert('加载处理后的图片失败！');
                    }
                } else {
                    alert('识别失败！');
                }
            } catch (error) {
                alert('访问失败！');
            }
        };

        return {
            data,
            handleFileUpload,
        };
    },
}).mount('#app');