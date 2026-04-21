const express = require("express");
const router_handler = require("../router_handler/userFriends");
const router = express.Router();

// 查询所有用户
router.get("/allFriends/:username", router_handler.getAllFriends);

// 查出历史好友申请
router.get("/historyApply/:userId", router_handler.getHistoryFriendApply);

// 查询已成为好友的列表
router.get("/friendsList/:userId", router_handler.getFriendsList);

// 获取好友聊天记录
router.get(
  "/chatHistory/:userId/:friendUserId",
  router_handler.getFriendChatHistory,
);

module.exports = router;
