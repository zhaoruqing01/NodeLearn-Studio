const db = require("../db/index");
const OpenAI = require("openai");

// 此项目用于处理ai智能表单功能
// 主要技术点是 1.prompt工程 2.ai调用
const client = new OpenAI({
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  apiKey: process.env.API_KEY,
});
exports.aiFormHandler = async (req, res) => {
  try {
    const { prompt } = req.query;
    if (!prompt) {
      return res.status(400).json({ code: 400, message: "请输入prompt" });
    }
    // 设置 SSE 响应头给前端
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();
    // 优化prompt
    const optimizedPrompt = `
        作为企业邮件文案优化师，请按以下步骤优化句子:
        1. 分析原句为: ${prompt}
        2. 执行优化:
        - 目标: 在保留原有句式和核心意义的前提下，适配企业邮件发送要求（保持专业、清晰、信息完整，且返回字数大于30字）
        - 删除: 冗余副词、非必要修饰词及不影响语义的时间状语
        - 调整: 提升正式度，确保语气礼貌得体，信息传达无歧义
        3. 输出格式: 仅优化后句子，无格式（纯文本`;
    const completion = await client.chat.completions.create({
      model: "qwen-plus",
      messages: [
        {
          role: "user",
          content: optimizedPrompt,
        },
      ],
      stream: true, // 开启流式输出
    });
    let fullAnswer = "";
    // sse推送,没必要存库
    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta.content || "";
      if (!content) continue;
      fullAnswer += content;
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }

    // 流式传输完成后关闭连接
    res.end();
  } catch (error) {
    // 检查是否已经发送了头部信息，避免重复发送响应
    if (!res.headersSent) {
      res.status(500).json({
        code: 500,
        message: "请求失败",
        error: error.message,
      });
    } else {
      // 如果头部已发送，则直接结束响应并记录错误日志
      console.error("SSE Error:", error);
      res.end();
    }
  }
};
