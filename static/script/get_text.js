import { createApp, reactive } from './vue.esm-browser.js';

createApp({
    setup() {
        const data = reactive({
            imageSrc: null,
            have_text: false,
            recognizedText: '',
            processedImageSrc: null,
        });

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
                const response = await fetch(imagePath);
                const blob = await response.blob();
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.onerror = (e) => reject(e);
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
                // 修改：使用相对路径
                const response = await fetch('/ocr', {
                    method: 'POST',
                    body: formData,
                });
                const result = await response.json();

                if (result.success) {
                    data.have_text = result.have_text;
                    data.recognizedText = result.img_Text;
                    const processedImageSrc = await loadProcessedImage('./get_text_image/image_getText.jpg');
                    if (processedImageSrc) {
                        data.processedImageSrc = processedImageSrc;
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
