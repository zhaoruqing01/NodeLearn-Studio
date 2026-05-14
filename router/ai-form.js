const express = require("express");
const router = express.Router();
// 导入处理函数
const ai_form_handler = require("../router_handler/ai-form");

// 处理表单提交
router.post("/aiForm", ai_form_handler.aiFormHandler);

// 处理提示词生成
router.post("/promptEngine", ai_form_handler.aiTonePromptHandler);

// 处理使用提示词
router.post("/usePrompt", ai_form_handler.usePromptHandler);

// 处理保存提示词
router.post("/savePrompt", ai_form_handler.savePromptHandler);

// 处理获取提示词列表
router.get("/getPromptsList", ai_form_handler.getPromptsListHandler);

// 处理删除提示词
router.post("/deletePrompt", ai_form_handler.deletePromptHandler);

// 处理修改提示词
router.post("/updatePrompt", ai_form_handler.updatePromptHandler);

module.exports = router;
