from PIL import Image, ImageOps
import os
import shutil

# ========== 只改这一行，换成你自己的照片文件夹路径 ==========
INPUT_FOLDER = r"./images"
# ========================================================

# 分类文件夹
HORIZONTAL = os.path.join(INPUT_FOLDER, "横屏照片")
VERTICAL = os.path.join(INPUT_FOLDER, "竖屏照片")
SQUARE = os.path.join(INPUT_FOLDER, "接近正方形")

os.makedirs(HORIZONTAL, exist_ok=True)
os.makedirs(VERTICAL, exist_ok=True)
os.makedirs(SQUARE, exist_ok=True)

# 支持图片格式
IMAGE_EXT = (".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp")

def get_real_wh(img_path):
    """读取图片 + 自动矫正EXIF旋转，返回真实宽、高"""
    img = Image.open(img_path)
    # 关键：自动根据EXIF旋转矫正方向
    img = ImageOps.exif_transpose(img)
    return img.width, img.height

total = 0
for file in os.listdir(INPUT_FOLDER):
    file_path = os.path.join(INPUT_FOLDER, file)
    
    # 跳过文件夹、非图片
    if os.path.isdir(file_path) or not file.lower().endswith(IMAGE_EXT):
        continue

    w, h = get_real_wh(file_path)
    ratio = w / h

    # 容错：宽高比接近1，归为正方形
    if 0.95 <= ratio <= 1.05:
        target = SQUARE
        tag = "正方形"
    elif w > h:
        target = HORIZONTAL
        tag = "横屏"
    else:
        target = VERTICAL
        tag = "竖屏"

    shutil.copy2(file_path, target)
    total += 1
    print(f"[{tag}] {file}  宽:{w} 高:{h}")

print(f"\n✅ 分类完成，共处理 {total} 张图片")
print(f"横屏：{HORIZONTAL}")
print(f"竖屏：{VERTICAL}")
print(f"正方形：{SQUARE}")