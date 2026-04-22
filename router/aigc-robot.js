const express = require("express");
const router = express.Router();
// 导入处理函数
const aigc_robot_handler = require("../router_handler/aigc-robot");

router.get("/robotChat", aigc_robot_handler.getRobotChatHandler);

module.exports = router;
