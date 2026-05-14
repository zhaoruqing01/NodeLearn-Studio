const db = require("../db/index");
const OpenAI = require("openai");

// 此项目用于处理ai智能表单功能
// 主要技术点是 1.prompt工程 2.ai调用
const client = new OpenAI({
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  apiKey: process.env.API_KEY,
});
// 优化文本
exports.aiFormHandler = async (req, res) => {
  try {
    const { prompt, userId } = req.body;
    if (!prompt) {
      return res.status(400).json({ code: 400, message: "请输入prompt" });
    }

    // 查询当前用户is_use为1的提示词
    let role = "";
    if (userId) {
      const sql =
        "SELECT * FROM prompts WHERE user_id = ? AND is_use = 1 LIMIT 1";
      const [prompts] = await db.query(sql, [userId]);
      if (prompts && prompts.length > 0) {
        role = prompts[0].prompt || "";
      }
    }

    // 设置 SSE 响应头给前端
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();
    const initPrompt = `
      请作为专业企业邮件文案优化师，针对用户提供的原始邮件内容，
      进行正式化、礼貌化与精准化润色。重点提升语言的专业性与得体性，
      避免口语化、模糊表述及潜在歧义；
      确保称谓恰当、逻辑清晰、主次分明、语气谦和且不失权威感；
      统一使用规范书面语，慎用缩略语，必要时补充背景说明以增强可读性与接受度；
      检查敬语使用（如“敬请”“烦请”“感谢您的支持与配合”等）是否得当，时间、数据、责任主体等关键信息务必准确无误；
      最终输出简洁凝练、符合商务场景的正式邮件文本，长度适中，便于高效沟通与专业形象塑造。`;
    // 优化prompt
    const optimizedPrompt = `
          你的角色为${role || initPrompt},
          用户输入句子为${prompt},
          执行优化: 
          - 你要根据你的角色和用户输入的句子进行优化,输出要与角色相符
          - 删除: 冗余副词、非必要修饰词及不影响语义的时间状语,信息传达无歧义
          - 基于原句,比原句多输30字,确保内容充实,这是硬性要求
          只输出优化后的句子,无格式(纯文本,也不要任何表情符号)
      `;
    console.log(optimizedPrompt, "optimizedPrompt");

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
      res.end();
    }
  }
};

// 智能提示词生成
exports.aiTonePromptHandler = async (req, res) => {
  try {
    const { role, tone } = req.body;
    if (!role || !tone) {
      return res
        .status(400)
        .json({ code: 400, message: "请输入期望角色和语气" });
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
    你是一个AI提示词专家,你需要生成一个专业提示词,
    根据用户输入的角色和语气，生成一个专业提示词,用于描述用户角色和语气,侧重于语气的描述,请只输出提示词,其余内容请勿输出,普通文本,不需要加粗或代码块或表情符号
    若用户输出的角色为姓名则侧重与输出语气描述,不用给用户强加角色描述
    角色为${role}，语气为${tone}，请正常输出专业提示词,150字左右
        `;
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
      res.end();
    }
  }
};

// 使用提示词
exports.usePromptHandler = async (req, res) => {
  try {
    const { prompt, role, tone, userId, id } = req.body;
    if (!userId) {
      return res.status(400).json({ code: 400, message: "用户ID不能为空" });
    }

    // 先将该用户所有提示词的is_use设置为0
    await db.query("UPDATE prompts SET is_use = 0 WHERE user_id = ?", [userId]);

    if (id) {
      // 如果传递了id，更新已有提示词的is_use为1
      const sql = "UPDATE prompts SET is_use = 1 WHERE id = ? AND user_id = ?";
      await db.query(sql, [id, userId]);
      res.json({ code: 200, message: "使用成功" });
    } else if (prompt) {
      // 如果传递了prompt，插入新的提示词并将is_use设置为1
      const sql =
        "INSERT INTO prompts (user_id, role, tone, prompt, is_use , is_show) VALUES (?, ?, ?, ?, 1 , 0)";
      await db.query(sql, [userId, role, tone, prompt]);
      res.json({ code: 200, message: "使用成功" });
    } else {
      return res
        .status(400)
        .json({ code: 400, message: "请提供提示词内容或提示词ID" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ code: 500, message: "请求失败", error: error.message });
  }
};

// 保存提示词
exports.savePromptHandler = async (req, res) => {
  try {
    const { prompt, tone, role, userId } = req.body;
    if (!prompt || !tone || !role) {
      return res.status(400).json({ code: 400, message: "请输入提示词和语气" });
    }
    const sql =
      "INSERT INTO prompts (user_id, prompt, tone, role) VALUES (?, ?, ?, ?)";
    await db.query(sql, [userId, prompt, tone, role]);
    res.json({ code: 200, message: "保存成功" });
  } catch (error) {
    res
      .status(500)
      .json({ code: 500, message: "保存失败", error: error.message });
  }
};

// 获取当前用户的提示词列表
exports.getPromptsListHandler = async (req, res) => {
  try {
    const { userId } = req.query;
    // 根据用户的id查询提示词列表
    const sql =
      "SELECT * FROM prompts WHERE user_id = ? ORDER BY updated_at DESC";
    const [prompts] = await db.query(sql, [userId]);
    res.json({ code: 200, message: "获取成功", data: prompts });
  } catch (error) {
    res
      .status(500)
      .json({ code: 500, message: "获取失败", error: error.message });
  }
};

// 删除提示词
exports.deletePromptHandler = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ code: 400, message: "提示词ID不能为空" });
    }
    // 根据id和用户id删除提示词
    const sql = "DELETE FROM prompts WHERE id = ?";
    await db.query(sql, [id]);
    res.json({ code: 200, message: "删除成功" });
  } catch (error) {
    res
      .status(500)
      .json({ code: 500, message: "删除失败", error: error.message });
  }
};

// 修改提示词
exports.updatePromptHandler = async (req, res) => {
  try {
    const { prompt, tone, role, id } = req.body;
    if (!prompt || !tone || !role || !id) {
      return res
        .status(400)
        .json({ code: 400, message: "请输入提示词和语气和ID" });
    }
    const sql =
      "UPDATE prompts SET prompt = ?, tone = ? , role = ? WHERE id = ?";
    await db.query(sql, [prompt, tone, role, id]);
    res.json({ code: 200, message: "修改成功" });
  } catch (error) {
    res
      .status(500)
      .json({ code: 500, message: "修改失败", error: error.message });
  }
};
