import time
import sys
import os
import shutil
from imgocr import ImgOcr
from imgocr import draw_ocr_boxes


def get_texts():
    read_path = "./static/get_text_image/image.jpg"
    save_path = "./static/get_text_image/image_getText.jpg"
    img_Test = ""
    m = ImgOcr(use_gpu=False, is_efficiency_mode=True)
    # img_path = r"img.jpg"
    s = time.time()
    result = m.ocr(read_path)
    e = time.time()
    print("total time: {:.4f} s".format(e - s))
    print("result:", result)
    if not result:
        return None
    for line in result:
        text = line.get('text')
        img_Test += text + '\n'

    print("识别到的文字:", img_Test)

    draw_ocr_boxes(read_path, result, save_path)
    print('识别后的图片已保存为 image_getText.jpg')
    return img_Test

if __name__ == "__main__":
    img_text = get_texts()