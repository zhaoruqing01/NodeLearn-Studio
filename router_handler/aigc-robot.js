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
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();
    // 存库用
    let fullAnswer = "";
    // 为当前这次 AI 对话生成一个唯一的消息 ID
    const msgId =
      "ai_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4);
    // 获取 socket.io 实例
    const io = req.app.get("io");
    try {
      // 调用OpenAI封装好的 API获取回复
      // completion 流式输出对象，并非直接返回完整内容，而是分块返回
      const completion = await client.chat.completions.create({
        model: "qwen-turbo",
        messages: [{ role: "user", content: prompt }],
        stream: true, // 开启流式输出
      });
      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta.content || "";
        if (!content) continue; // 跳过空内容，优化性能

        // 1. SSE 推送（核心，必须优先同步执行）
        res.write(`data: ${JSON.stringify({ content, msgId })}\n\n`);

        // 2. 🔥 Node.js 原生强制刷新缓冲区（让SSE立即发出去）
        res.cork();
        res.uncork();

        // 3. 拼接完整内容
        fullAnswer += content;

        // 4. 🔥 关键：Socket广播改为异步微任务，不阻塞SSE发送
        process.nextTick(() => {
          if (io) {
            io.to("public").emit("receivePublicMsg", {
              msgId,
              userId: -1,
              username: "小艺",
              content: content,
              isStreaming: true,
              sendTime: new Date(),
            });
          }
        });
      }

      // ai输出结束后，存储到数据库中
      await db.query(
        "INSERT INTO messages (group_id, user_id, username, content) VALUES (0, ?, ?, ?)",
        [-1, "小艺", fullAnswer || ""],
      );
      // 通知前端ai输出结束
      res.write(`data: ${JSON.stringify({ done: true, msgId })}\n\n`);

      // 同步广播结束状态到公共群聊
      if (io) {
        io.to("public").emit("receivePublicMsg", {
          msgId,
          userId: -1,
          username: "小艺",
          content: "",
          isStreaming: false,
          done: true,
          sendTime: new Date(),
        });
      }

      res.end();
    } catch (error) {
      console.error("AI生成失败:", error);
    }
  } catch (error) {
    return res.cc(error);
  }
};
