const express = require("express");
const router = express.Router();
const expressJoi = require("@escook/express-joi");
const { group_schema } = require("../schema/index");

// 导入处理函数
const group_handler = require("../router_handler/group");

/**
 * @swagger
 * /api/groupCreate:
 *   post:
 *     summary: 创建群聊
 *     tags:
 *       - 群聊管理
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               group_name:
 *                 type: string
 *                 description: 群聊名称
 *               owner_id:
 *                 type: number
 *                 description: 群聊创建人ID
 *               create_time:
 *                 type: string
 *                 description: 群聊创建时间
 *               is_deleted:
 *                 type: boolean
 *                 description: 是否删除
 *     responses:
 *       200:
 *         description: 创建成功
 *       400:
 *         description: 请求参数错误
 */
// 创建群聊
router.post(
  "/groupCreate",
  expressJoi(group_schema),
  group_handler.group_create_handler,
);

// 查询所有群聊
router.get("/groupList", group_handler.group_list_handler);

// 查询已加入的群聊列表-展示用
router.get("/groupOwnerInner", group_handler.group_owner_inner_handler);

// 删除群聊
router.post("/groupDelete/:groupId", group_handler.group_delete_handler);

// 添加群聊成员-加入群聊操作
router.post("/groupAddMember/:groupId", group_handler.group_add_member_handler);

// 删除群聊成员操作 - 退出群聊操作
router.post(
  "/groupDeleteMember/:groupId",
  group_handler.group_delete_member_handler,
);

// 查询聊天记录操作
router.get(
  "/groupChatRecord/:groupId",
  group_handler.group_chat_record_handler,
);

module.exports = router;
