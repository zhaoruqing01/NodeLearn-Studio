const db = require("../db/index");
const OpenAI = require("openai");

// 干两件事
// 1. 调用千问API，获取回复
// 2. 存储人机说的话

// 调用千问API，获取回复,并且在SSE结束后存储到数据库
const client = new OpenAI({
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  apiKey: process.env.API_KEY,
});
exports.getRobotChatHandler = async (req, res) => {
  try {
    const { prompt } = req.query;
    if (!prompt) {
      return res.cc({ message: "请输入问题" });
    }
    // 设置 SSE 响应头给前端
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.flushHeaders();
    // 存库用
    let fullAnswer = "";
    try {
      // 调用OpenAI封装好的 API获取回复
      // completion 流式输出对象，并非直接返回完整内容，而是分块返回
      const completion = await client.chat.completions.create({
        model: "qwen-turbo",
        messages: [{ role: "user", content: prompt }],
        stream: true, // 开启流式输出
      });
      for await (const chunk of completion) {
        // 取出ai返回的内容片段
        const content = chunk.choices[0].delta.content || "";
        // 存库用
        fullAnswer += content;
        // 每次把片段推送给前端，流式输出有固定格式data: 内容\n\n
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }

      // ai输出结束后，存储到数据库中
      await db.query(
        "INSERT INTO messages (group_id, user_id, username, content) VALUES (0, ?, ?, ?)",
        [-1, "小艺", fullAnswer || ""],
      );
      // 通知前端ai输出结束
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);

      res.end();
    } catch (error) {}
  } catch (error) {
    return res.cc(error);
  }
};
