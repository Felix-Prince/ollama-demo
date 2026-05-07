import ollama
import os

# ========= 配置只改这里 =========
CHAT_TXT_PATH = r"./chat.txt"  # 你微信导出的txt路径
MODEL_NAME = "gemma4:e4b"
# ==============================

# 读取微信聊天文本
with open(CHAT_TXT_PATH, "r", encoding="utf-8") as f:
    chat_content = f.read()

# 限制输入长度，避免超出模型上下文
max_len = 12000
if len(chat_content) > max_len:
    chat_content = chat_content[:max_len]

# 构造提示词
prompt = f"""
你现在是聊天内容分析助手，请对下面微信聊天记录做三件事：
1. 整体内容简要总结
2. 梳理里面关键事件和时间线
3. 提取所有待办、约定、需要后续做的事情

聊天记录：
{chat_content}
"""

# 调用本地模型总结
print("正在本地AI分析微信聊天记录，请稍候...")
res = ollama.generate(model=MODEL_NAME, prompt=prompt)
result = res["response"]

# 保存结果
out_path = os.path.join(os.path.dirname(CHAT_TXT_PATH), "聊天总结_结果.txt")
with open(out_path, "w", encoding="utf-8") as f:
    f.write(result)

print("✅ 总结完成！")
print(f"📄 结果已保存到：{out_path}")
print("\n===== 聊天总结结果 =====\n")
print(result)