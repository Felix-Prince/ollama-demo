# Gemma4 本地 LLM Node.js 客户端

这是一个用于调用本地运行的 Gemma4 大语言模型的 Node.js 客户端，通过 Ollama API 进行交互。

## 功能特性

- 🚀 简单易用的 API 封装
- 💬 交互式聊天界面
- ⚡ 支持流式输出
- 🔧 可配置的生成参数
- 📚 包含完整的使用示例

## 前置要求

1. **安装 Ollama**
   - 访问 https://ollama.com 下载并安装 Ollama

2. **拉取 Gemma4 模型**
   ```bash
   ollama pull gemma4:e4b
   ```

3. **确保 Ollama 服务正在运行**
   - 安装后 Ollama 会自动在后台运行

## 安装步骤

1. 克隆或下载此项目

2. 安装依赖：
   ```bash
   npm install
   ```

3. 配置环境变量（可选）：
   ```bash
   cp .env.example .env
   # 编辑 .env 文件修改配置
   ```

## 使用方法

### 1. 交互式聊天模式

启动交互式聊天界面：
```bash
npm start
# 或者
npm run chat
```

聊天命令：
- `/help` - 显示帮助信息
- `/clear` - 清空对话上下文
- `/history` - 显示对话历史
- `/exit` 或 `/quit` - 退出程序

### 2. 单次生成模式

直接生成回答：
```bash
node gemma4-client.js --mode complete --prompt "你好，请介绍一下你自己"
```

### 3. 运行演示

运行各种功能演示：
```bash
node gemma4-client.js --demo
```

## API 说明

### Gemma4Client 类

主要的客户端类，封装了所有与 Ollama API 的交互。

```javascript
const { Gemma4Client } = require('./gemma4-client');

const client = new Gemma4Client();
```

#### 方法

##### `checkService()`
检查 Ollama 服务是否可用。

##### `checkModel()`
检查指定模型是否已下载。

##### `generate(prompt, options)`
单次文本生成（非流式）。

```javascript
const response = await client.generate('你好', { 
  temperature: 0.7,
  maxTokens: 1024
});
```

##### `generateStream(prompt, options, onChunk)`
流式文本生成。

```javascript
await client.generateStream('写一首诗', {}, (chunk) => {
  process.stdout.write(chunk);
});
```

##### `chat(messages)`
多轮对话（带上下文）。

```javascript
const response = await client.chat([
  { role: 'user', content: '你好' },
  { role: 'assistant', content: '你好！有什么我可以帮助你的吗？' },
  { role: 'user', content: '介绍一下你自己' }
]);
```

## 配置说明

在 `.env` 文件中可以配置以下参数：

| 参数 | 说明 | 默认值 |
|------|------|--------|
| OLLAMA_HOST | Ollama API 地址 | http://localhost:11434 |
| MODEL_NAME | 使用的模型名称 | gemma4:e4b |
| TEMPERATURE | 温度参数 (0.0-2.0) | 0.7 |
| MAX_TOKENS | 最大生成 token 数 | 2048 |
| TOP_P | 核采样参数 (0.0-1.0) | 0.9 |

## 项目结构

```
ollama-demo/
├── gemma4-client.js    # 主程序文件，包含完整实现
├── package.json         # 项目配置和依赖
├── .env.example         # 环境变量示例
└── README.md           # 说明文档
```

## 常见问题

### Q: 提示无法连接到 Ollama 服务？
A: 请确保：
1. Ollama 已正确安装
2. Ollama 服务正在运行
3. `OLLAMA_HOST` 配置正确

### Q: 提示模型未找到？
A: 请运行 `ollama pull gemma4:e4b` 下载模型。

### Q: 如何更换其他模型？
A: 修改 `.env` 文件中的 `MODEL_NAME` 为你想使用的模型名称。

## 许可证

MIT License
