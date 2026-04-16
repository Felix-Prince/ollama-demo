/**
 * Gemma4 本地 LLM 调用客户端
 *
 * 本程序演示如何通过 Ollama API 调用本地运行的 Gemma4 模型
 *
 * 前置要求：
 * 1. 已安装 Ollama (https://ollama.com)
 * 2. 已拉取 Gemma4 模型: `ollama pull gemma2` 或 `ollama pull gemma:2b`
 * 3. Ollama 服务正在运行中
 */

// 导入所需模块
const axios = require('axios');
const readline = require('readline');
require('dotenv').config();

/**
 * 配置类 - 管理所有配置参数
 */
class Config {
  constructor() {
    // Ollama API 地址，默认本地地址
    this.OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';

    // 模型名称，默认使用 gemma4:e4b，也可以是 gemma:2b, gemma:7b 等
    this.MODEL_NAME = process.env.MODEL_NAME || 'gemma4:e4b';

    // 生成参数
    this.TEMPERATURE = parseFloat(process.env.TEMPERATURE) || 0.7;  // 温度参数，越高越随机
    this.MAX_TOKENS = parseInt(process.env.MAX_TOKENS) || 2048;     // 最大生成 token 数
    this.TOP_P = parseFloat(process.env.TOP_P) || 0.9;               // 核采样参数
  }
}

/**
 * Gemma4 客户端类 - 封装与 Ollama API 的交互
 */
class Gemma4Client {
  constructor() {
    this.config = new Config();

    // 创建 axios 实例，设置基础 URL 和超时
    this.client = axios.create({
      baseURL: this.config.OLLAMA_HOST,
      timeout: 120000, // 2分钟超时
    });
  }

  /**
   * 检查 Ollama 服务是否可用
   * @returns {Promise<boolean>} 服务是否可用
   */
  async checkService() {
    try {
      await this.client.get('/api/tags');
      console.log('✅ Ollama 服务连接成功');
      return true;
    } catch (error) {
      console.error('❌ 无法连接到 Ollama 服务');
      console.error('   请确保:');
      console.error('   1. Ollama 已安装: https://ollama.com');
      console.error('   2. Ollama 服务正在运行');
      console.error('   3. 服务地址配置正确:', this.config.OLLAMA_HOST);
      return false;
    }
  }

  /**
   * 检查指定模型是否已下载
   * @returns {Promise<boolean>} 模型是否存在
   */
  async checkModel() {
    try {
      const response = await this.client.get('/api/tags');
      const models = response.data.models || [];

      // 检查模型是否在列表中
      const modelExists = models.some(m => m.name === this.config.MODEL_NAME);

      if (modelExists) {
        console.log(`✅ 模型 ${this.config.MODEL_NAME} 已就绪`);
        return true;
      } else {
        console.error(`❌ 模型 ${this.config.MODEL_NAME} 未找到`);
        console.error(`   可用模型: ${models.map(m => m.name).join(', ')}`);
        console.error(`   请运行: ollama pull ${this.config.MODEL_NAME}`);
        return false;
      }
    } catch (error) {
      console.error('❌ 检查模型时出错:', error.message);
      return false;
    }
  }

  /**
   * 单次文本生成（非流式）
   * @param {string} prompt - 输入提示词
   * @param {object} options - 可选参数
   * @returns {Promise<string>} 生成的文本
   */
  async generate(prompt, options = {}) {
    try {
      console.log('🤔 正在思考...');

      const requestBody = {
        model: this.config.MODEL_NAME,
        prompt: prompt,
        stream: false,  // 非流式输出
        options: {
          temperature: options.temperature || this.config.TEMPERATURE,
          max_tokens: options.maxTokens || this.config.MAX_TOKENS,
          top_p: options.topP || this.config.TOP_P,
        },
      };

      const response = await this.client.post('/api/generate', requestBody);
      return response.data.response;
    } catch (error) {
      console.error('❌ 生成文本时出错:', error.message);
      throw error;
    }
  }

  /**
   * 流式文本生成（逐字输出）
   * @param {string} prompt - 输入提示词
   * @param {object} options - 可选参数
   * @param {function} onChunk - 每收到一段文本时的回调函数
   */
  async generateStream(prompt, options = {}, onChunk) {
    try {
      console.log('🤔 正在思考...\n');

      const requestBody = {
        model: this.config.MODEL_NAME,
        prompt: prompt,
        stream: true,  // 流式输出
        options: {
          temperature: options.temperature || this.config.TEMPERATURE,
          max_tokens: options.maxTokens || this.config.MAX_TOKENS,
          top_p: options.topP || this.config.TOP_P,
        },
      };

      const response = await this.client.post('/api/generate', requestBody, {
        responseType: 'stream',
      });

      let fullResponse = '';

      // 处理流式响应
      for await (const chunk of response.data) {
        const lines = chunk.toString().split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.response) {
              fullResponse += data.response;
              if (onChunk) {
                onChunk(data.response);
              }
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }

      return fullResponse;
    } catch (error) {
      console.error('❌ 流式生成文本时出错:', error.message);
      throw error;
    }
  }

  /**
   * 多轮对话（带上下文记忆）
   * @param {Array} messages - 消息历史数组
   * @returns {Promise<string>} 助手回复
   */
  async chat(messages) {
    try {
      console.log('🤔 正在思考...');

      const requestBody = {
        model: this.config.MODEL_NAME,
        messages: messages,
        stream: false,
        options: {
          temperature: this.config.TEMPERATURE,
        },
      };

      const response = await this.client.post('/api/chat', requestBody);
      return response.data.message.content;
    } catch (error) {
      console.error('❌ 对话时出错:', error.message);
      throw error;
    }
  }
}

/**
 * 交互式聊天界面
 */
class ChatInterface {
  constructor(client) {
    this.client = client;
    this.messages = [];
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  /**
   * 启动聊天界面
   */
  async start() {
    console.log('\n' + '='.repeat(50));
    console.log('💬 Gemma4 交互式聊天');
    console.log('   输入 /help 查看命令');
    console.log('   输入 /exit 或 /quit 退出');
    console.log('='.repeat(50) + '\n');

    await this.chatLoop();
  }

  /**
   * 聊天主循环
   */
  async chatLoop() {
    const question = (prompt) => new Promise(resolve => this.rl.question(prompt, resolve));

    while (true) {
      const input = await question('👤 你: ');
      const trimmedInput = input.trim();

      // 处理命令
      if (trimmedInput === '/exit' || trimmedInput === '/quit') {
        console.log('👋 再见！');
        this.rl.close();
        break;
      }

      if (trimmedInput === '/help') {
        this.showHelp();
        continue;
      }

      if (trimmedInput === '/clear') {
        this.messages = [];
        console.log('✅ 上下文已清空\n');
        continue;
      }

      if (trimmedInput === '/history') {
        this.showHistory();
        continue;
      }

      if (!trimmedInput) {
        continue;
      }

      // 添加用户消息到历史
      this.messages.push({ role: 'user', content: trimmedInput });

      try {
        // 使用流式输出
        process.stdout.write('🤖 Gemma4: ');
        await this.client.generateStream(trimmedInput, {}, (chunk) => {
          process.stdout.write(chunk);
        });
        console.log('\n');

        // 注意：流式 generate 不会自动更新对话历史
        // 如果需要完整的对话历史，可以改用 chat 方法
      } catch (error) {
        console.error('\n❌ 出错了，请重试\n');
      }
    }
  }

  /**
   * 显示帮助信息
   */
  showHelp() {
    console.log('\n📖 可用命令:');
    console.log('   /help     - 显示帮助信息');
    console.log('   /clear    - 清空对话上下文');
    console.log('   /history  - 显示对话历史');
    console.log('   /exit     - 退出程序\n');
  }

  /**
   * 显示对话历史
   */
  showHistory() {
    console.log('\n📜 对话历史:');
    if (this.messages.length === 0) {
      console.log('   (暂无消息)\n');
      return;
    }
    this.messages.forEach((msg, index) => {
      const role = msg.role === 'user' ? '👤 你' : '🤖 Gemma4';
      console.log(`   ${index + 1}. ${role}: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`);
    });
    console.log('');
  }
}

/**
 * 演示函数 - 展示各种使用方式
 */
async function runDemos(client) {
  console.log('\n' + '='.repeat(50));
  console.log('📚 Gemma4 API 演示');
  console.log('='.repeat(50));

  // 演示 1: 简单的文本生成
  console.log('\n--- 演示 1: 简单文本生成 ---');
  try {
    const response = await client.generate('请用一句话介绍你自己。');
    console.log('Gemma4:', response);
  } catch (error) {
    console.log('演示 1 失败');
  }

  // 演示 2: 流式输出
  console.log('\n--- 演示 2: 流式输出 ---');
  try {
    await client.generateStream('请写一首关于 AI 的短诗。', {}, (chunk) => {
      process.stdout.write(chunk);
    });
    console.log('');
  } catch (error) {
    console.log('演示 2 失败');
  }

  // 演示 3: 不同的温度参数
  console.log('\n--- 演示 3: 不同温度参数的对比 ---');
  console.log('温度 = 0.1 (更确定):');
  try {
    const response1 = await client.generate('说一句问候语', { temperature: 0.1 });
    console.log('>', response1);
  } catch (error) {
    console.log('生成失败');
  }

  console.log('\n温度 = 1.5 (更随机):');
  try {
    const response2 = await client.generate('说一句问候语', { temperature: 1.5 });
    console.log('>', response2);
  } catch (error) {
    console.log('生成失败');
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 Gemma4 本地 LLM 客户端启动中...\n');

  // 创建客户端实例
  const client = new Gemma4Client();

  // 检查服务和模型
  const serviceOk = await client.checkService();
  if (!serviceOk) {
    process.exit(1);
  }

  const modelOk = await client.checkModel();
  if (!modelOk) {
    process.exit(1);
  }

  // 解析命令行参数
  const args = process.argv.slice(2);
  const mode = args.includes('--mode') ? args[args.indexOf('--mode') + 1] : 'interactive';
  const isDemo = args.includes('--demo') || args.includes('-d');

  if (isDemo) {
    // 运行演示
    await runDemos(client);
  } else if (mode === 'chat' || mode === 'interactive') {
    // 启动交互式聊天
    const chatInterface = new ChatInterface(client);
    await chatInterface.start();
  } else if (mode === 'complete' && args.length > 0) {
    // 单次生成模式
    const promptIndex = args.indexOf('--prompt');
    if (promptIndex !== -1 && args[promptIndex + 1]) {
      const prompt = args[promptIndex + 1];
      const response = await client.generate(prompt);
      console.log('\n🤖 Gemma4:', response);
    } else {
      console.log('使用方法: node gemma4-client.js --mode complete --prompt "你的问题"');
    }
  }
}

// 程序入口
main().catch((error) => {
  console.error('❌ 程序出错:', error);
  process.exit(1);
});

module.exports = {
  Config,
  Gemma4Client,
  ChatInterface,
};
