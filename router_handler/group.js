const db = require("../db/index");

// 创建群聊
exports.group_create_handler = async (req, res) => {
  try {
    // 群聊字段
    const { group_name, owner_id, create_time, is_deleted } = req.body;

    // 查询群聊名称是否重复
    const [group] = await db.query(
      "SELECT * FROM  `groups` WHERE group_name = ?",
      [group_name],
    );
    if (group.length > 0) {
      return res.status(400).json({ code: 400, message: "群聊名称已存在" });
    }

    // 查询群聊创建人是否存在
    const [user] = await db.query("SELECT * FROM ev_user WHERE id = ?", [
      owner_id,
    ]);
    if (user.length === 0) {
      return res.status(400).json({ code: 400, message: "群聊创建人不存在" });
    }

    // ======================
    // ✅ 修复 1：必须接收插入结果
    // ======================
    const [insertResult] = await db.query("INSERT INTO  `groups` SET ?", {
      group_name,
      owner_id,
      create_time,
      is_deleted,
    });

    // ======================
    // ✅ 修复 2：从 insertResult 拿 insertId,主键自增从这里拿id而不是group_id
    // ======================
    const group_id = insertResult.insertId;

    // 创建群聊后默认将群聊创建人作为群聊成员加入群聊
    await db.query("INSERT INTO  `group_members` SET ?", {
      group_id: group_id, // 这里用正确的ID
      user_id: owner_id,
      status: 1,
    });

    return res.status(200).json({ code: 200, message: "success" });
  } catch (error) {
    console.error("创建群聊失败:", error);
    return res.status(500).json({ code: 500, message: "服务器内部错误" });
  }
};

// 查询全部的群聊列表-搜索用
exports.group_list_handler = async (req, res) => {
  try {
    const groupName = req.query.groupName || "";

    const [groups] = await db.query(
      "SELECT * FROM  `groups` WHERE is_deleted = ? AND group_name LIKE ? ORDER BY create_time DESC",
      [0, `%${groupName}%`],
    );
    return res
      .status(200)
      .json({ code: 200, message: "success", data: groups });
  } catch (error) {
    console.error("查询群聊列表失败:", error);
    return res.status(500).json({ code: 500, message: "服务器内部错误" });
  }
};

// 查询已加入的群聊列表-展示用
exports.group_owner_inner_handler = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ code: 401, message: "未授权，请先登录" });
    }
    const userId = req.user.id;
    const sql =
      "SELECT g.group_id, g.group_name, g.owner_id " +
      "FROM group_members m " +
      "JOIN `groups` g ON m.group_id = g.group_id " +
      "WHERE m.user_id = ? " +
      "AND m.status = 1 " +
      "AND g.is_deleted = 0";
    const [groups] = await db.query(sql, [userId]);
    return res
      .status(200)
      .json({ code: 200, message: "success", data: groups });
  } catch (error) {
    console.error("查询已加入群聊失败:", error);
    return res.status(500).json({ code: 500, message: "服务器内部错误" });
  }
};

// 删除群聊
exports.group_delete_handler = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const sql = "DELETE FROM `groups` WHERE group_id = ? AND is_deleted = ?";
    const [result] = await db.query(sql, [groupId, 0]);
    if (result.affectedRows === 0) {
      return res.status(400).json({ code: 400, message: "群聊不存在" });
    }
    if (result.affectedRows > 0) {
      return res.status(200).json({ code: 200, message: "删除成功" });
    }
    return res.status(400).json({ code: 400, message: "删除失败" });
  } catch (error) {
    return res.status(500).json({ code: 500, message: "服务器内部错误" });
  }
};

// 添加群聊成员-加入群聊操作
exports.group_add_member_handler = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const userId = req.user.id;
    await db.query("INSERT INTO  `group_members` SET ?", {
      group_id: groupId, // 这里用正确的ID
      user_id: userId,
      status: 1,
    });
    return res.status(200).json({ code: 200, message: "success" });
  } catch (error) {
    console.error("添加群聊成员失败:", error);
    return res.status(500).json({ code: 500, message: "服务器内部错误" });
  }
};

// 查询群聊成员

// 删除群聊成员操作 - 退出群聊操作
exports.group_delete_member_handler = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const userId = req.user.id;
    const sql =
      "DELETE FROM `group_members` WHERE group_id = ? AND user_id = ?";
    const [result] = await db.query(sql, [groupId, userId]);
    if (result.affectedRows === 0) {
      return res.status(400).json({ code: 400, message: "退出群聊失败" });
    }
    return res.status(200).json({ code: 200, message: "退出群聊成功" });
  } catch (error) {
    console.error("退出群聊失败:", error);
    return res.status(500).json({ code: 500, message: "服务器内部错误" });
  }
};

// 查询聊天记录操作
exports.group_chat_record_handler = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const sql =
      "SELECT * FROM `messages` WHERE group_id = ?  ORDER BY send_time ASC";
    const [records] = await db.query(sql, [groupId]);
    return res
      .status(200)
      .json({ code: 200, message: "success", data: records });
  } catch (error) {
    console.error("查询聊天记录失败:", error);
    return res.status(500).json({ code: 500, message: "服务器内部错误" });
  }
};
