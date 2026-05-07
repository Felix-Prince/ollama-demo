from PIL import Image, ImageOps
import ollama
import os
import shutil

# ===================== 【只需修改这里】 =====================
INPUT_FOLDER = r"./images"  # 你的照片文件夹路径
MODEL = "gemma4:e4b"           # 你本地的多模态模型
# ==========================================================

# 自动创建分类文件夹
CATEGORIES = ["人物", "风景", "宠物", "建筑", "其他"]
# 分类目录：横屏、竖屏、正方形（容错）
ORIENTATIONS = ["横屏", "竖屏", "正方形"]

for orient in ORIENTATIONS:
    for cat in CATEGORIES:
        os.makedirs(os.path.join(INPUT_FOLDER, orient, cat), exist_ok=True)

# 支持的所有图片格式
IMAGE_EXT = (".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp")

def get_real_orientation(img_path):
    """
    核心修复：读取EXIF旋转信息，矫正图片后，返回真实方向
    解决手机拍照竖图被识别为横图的问题
    """
    with Image.open(img_path) as img:
        # 自动根据照片EXIF旋转信息矫正方向（关键修复代码）
        img = ImageOps.exif_transpose(img)
        width, height = img.size
        ratio = width / height

        # 宽高比接近1 → 正方形（容错处理）
        if 0.95 <= ratio <= 1.05:
            return "正方形"
        # 宽度大于高度 → 横屏
        elif width > height:
            return "横屏"
        # 高度大于宽度 → 竖屏
        else:
            return "竖屏"

def ai_recognize_image(img_path):
    """调用Gemma4:e4b AI识别图片内容"""
    try:
        res = ollama.generate(
            model=MODEL,
            prompt="这张图片的主要内容是什么？请从以下选项中选择一个：人物、风景、宠物、建筑、其他。只回答所选类别，不要添加任何额外文字。",
            images=[img_path]
        )
        content = res["response"].strip()
        # 校验分类，无效则归为其他
        return content if content in CATEGORIES else "其他"
    except Exception as e:
        print(f"⚠️ 识别失败: {img_path} | 错误: {str(e)}")
        return "其他"

# 批量处理主程序
total_count = 0
print("开始批量处理照片...\n")

for file in os.listdir(INPUT_FOLDER):
    file_path = os.path.join(INPUT_FOLDER, file)
    
    # 跳过文件夹、非图片文件
    if os.path.isdir(file_path) or not file.lower().endswith(IMAGE_EXT):
        continue

    # 1. 获取真实横竖屏方向（已修复EXIF）
    orientation = get_real_orientation(file_path)
    # 2. AI识别图片内容
    content_type = ai_recognize_image(file_path)
    # 3. 目标保存路径
    target_folder = os.path.join(INPUT_FOLDER, orientation, content_type)
    # 4. 复制文件（保留原图元数据，不修改原图）
    shutil.copy2(file_path, target_folder)
    
    total_count += 1
    print(f"✅ [{orientation} | {content_type}] {file}")

# 完成提示
print(f"\n🎉 全部处理完成！")
print(f"📊 总计处理照片：{total_count} 张")
print(f"📂 分类结果保存在：{INPUT_FOLDER}")