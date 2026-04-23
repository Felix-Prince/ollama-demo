/**
 * 简单测试 Demo
 *
 * 这是一个简化版的演示，展示如何快速调用 Gemma4 模型
 */

const axios = require('axios');

// 配置
const OLLAMA_HOST = 'http://localhost:11434';
// const MODEL_NAME = 'gemma4:e4b';
const MODEL_NAME = 'frontend-ai';

/**
 * 简单的文本生成函数
 */
async function generateText(prompt) {
  try {
    console.log(`\n🤔 正在询问: ${prompt}`);
    console.log('🤖 正在思考...\n');

    const response = await axios.post(`${OLLAMA_HOST}/api/generate`, {
      model: MODEL_NAME,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.7,
        max_tokens: 1024
      }
    });

    console.log('💬 回答:');
    console.log(response.data.response);
    console.log('\n' + '-'.repeat(50));

    return response.data.response;
  } catch (error) {
    console.error('❌ 错误:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('   请确保 Ollama 服务正在运行！');
    }
    throw error;
  }
}

/**
 * 主函数 - 运行一系列测试
 */
async function main() {
  console.log('='.repeat(50));
  console.log('🚀 Gemma4 简单测试 Demo');
  console.log('='.repeat(50));

  try {
    // 测试 1: 简单问候
    await generateText('你好，请简单介绍一下你自己。');

    // 测试 2: 知识问答
    await generateText('请用 3 句话解释什么是人工智能。');

    // 测试 3: 创意写作
    await generateText('请写一句关于春天的诗句。');

    console.log('\n✅ 所有测试完成！');
    console.log('\n提示: 运行 "npm start" 可以启动交互式聊天模式');

  } catch (error) {
    console.error('\n❌ 测试失败，请检查 Ollama 是否安装并运行了 gemma4:e4b 模型');
    console.log('\n安装模型命令: ollama pull gemma4:e4b');
  }
}

// 运行主函数
main();
