const express = require("express");
const router = express.Router();
// 导入处理函数
const ai_form_handler = require("../router_handler/ai-form");

router.post("/aiForm", ai_form_handler.aiFormHandler);

module.exports = router;
