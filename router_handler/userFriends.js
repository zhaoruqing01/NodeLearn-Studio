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
          f.user_id AS fromUserId,   
          u.username AS fromUsername,
          u.last_online_time as lastOnlineTime,
          f.apply_msg,               
          f.create_time,          
          f.status                 
        FROM user_friends f
        LEFT JOIN ev_user u ON f.user_id = u.id
        WHERE f.friend_id = ?        
        AND f.status = 1          
        ORDER BY f.create_time DESC
      `,
      [userId],
    );

    const onlineUserMap = req.app.onlineUserMap;
    const result = [...rows].map((item) => {
      const isOnline = onlineUserMap.has(item.userId);
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
    res.send({
      code: 400,
      message: "查询好友列表失败",
    });
  }
};
