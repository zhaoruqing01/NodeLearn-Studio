const db = require("../db/index");

// 查询所有用户
exports.getAllFriends = async (req, res) => {
  try {
    const { username } = req.params;
    const [rows] = await db.query(
      "SELECT * FROM ev_user WHERE username LIKE ?",
      [`%${username}%`],
    );
    res.send({
      code: 200,
      message: "查询成功",
      data: rows,
    });
  } catch (error) {
    res.send({
      code: 400,
      message: "查询失败",
    });
  }
};

// 查出历史好友申请
exports.getHistoryFriendApply = async (req, res) => {
  try {
    const { userId } = req.params;

    const [rows] = await db.query(
      `
        SELECT
          f.id,
          f.user_id AS fromUserId,   
          u.username AS fromUsername,
          f.apply_msg,               
          f.create_time,          
          f.status                 
        FROM user_friends f
        LEFT JOIN ev_user u ON f.user_id = u.id
        WHERE f.friend_id = ?        
        AND f.status = 0          
        ORDER BY f.create_time DESC
      `,
      [userId],
    );

    res.send({
      code: 200,
      message: "查询成功",
      data: rows,
    });
  } catch (error) {
    res.send({
      code: 400,
      message: "查询失败",
    });
  }
};

// 查询已成为好友的列表
exports.getFriendsList = async (req, res) => {
  try {
    const { userId } = req.params;
    const [rows] = await db.query(
      `
        SELECT
          f.id,
          CASE WHEN f.user_id = ? THEN f.friend_id ELSE f.user_id END AS fromUserId,
          u.username AS fromUsername,
          u.last_online_time AS lastOnlineTime,
          f.apply_msg,
          f.create_time,
          f.status
        FROM user_friends f
        LEFT JOIN ev_user u ON u.id = CASE WHEN f.user_id = ? THEN f.friend_id ELSE f.user_id END
        WHERE 
          (f.user_id = ? OR f.friend_id = ?)
          AND f.status = 1
        ORDER BY f.create_time DESC
      `,
      [userId, userId, userId, userId], // 这里传4个 userId
    );

    // 去重
    const uniqueRows = rows.filter(
      (item, index, self) =>
        self.findIndex((i) => i.fromUserId === item.fromUserId) === index,
    );

    const onlineUserMap = req.app.onlineUserMap;
    const result = [...uniqueRows].map((item) => {
      const isOnline = onlineUserMap.has(item.fromUserId);
      return {
        ...item,
        isOnline,
      };
    });

    res.send({
      code: 200,
      message: "查询成功",
      data: result,
    });
  } catch (error) {
    console.error(error);
    res.send({
      code: 400,
      message: "查询好友列表失败",
    });
  }
};

// 获取好友聊天记录
exports.getFriendChatHistory = async (req, res) => {
  try {
    const { userId, friendUserId } = req.params;

    const [rows] = await db.query(
      `
        SELECT
          m.to_user_id AS toUserId,
          m.user_id AS fromUserId,
          m.username,
          m.content,
          m.send_time AS sendTime
        FROM messages m
        WHERE m.group_id = -1
        AND (
          (m.user_id = ? AND m.to_user_id = ?) 
          OR 
          (m.user_id = ? AND m.to_user_id = ?)
        )
        ORDER BY m.send_time ASC
      `,
      [userId, friendUserId, friendUserId, userId],
    );

    res.send({
      code: 200,
      message: "查询成功",
      data: rows,
    });
  } catch (error) {
    console.log(error);
    res.send({
      code: 400,
      message: "查询好友聊天记录失败",
    });
  }
};
