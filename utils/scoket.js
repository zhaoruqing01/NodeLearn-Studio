const { Server } = require("socket.io");
const db = require("../db");

// 通知该用户的所有好友：在线/离线

const initSocket = (server, app) => {
  const onlineUserMap = app.onlineUserMap;
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });
  async function notifyFriendsStatus(userId, isOnline) {
    // 1. 查询该用户的所有在线好友ID
    const [friendList] = await db.query(
      `SELECT friend_id FROM user_friends 
     WHERE user_id = ? AND status = 1`,
      [userId],
    );

    // 2. 挨个推送状态给好友
    friendList.forEach((item) => {
      const friendId = item.friend_id;
      io.to(`user_${friendId}`).emit("friend:status:change", {
        targetUserId: userId,
        isOnline: isOnline,
      });
    });
  }
  io.on("connection", (socket) => {
    console.log("新用户连接: ", socket.id);
    socket.join("public");

    // 1. 加入群聊
    socket.on("joinGroup", async (groupId, userId) => {
      const roomName = `group_${groupId}`;
      socket.join(roomName);
      const sql = "SELECT username FROM ev_user WHERE id = ?";
      const [rows] = await db.query(sql, [userId]);
      const username = rows[0]?.username || "用户";
      socket.to(roomName).emit("systemMsg", {
        content: `${username}加入群聊`,
        type: "join",
      });
    });

    // 2. 退出群聊
    socket.on("quitGroup", (groupId) => {
      const roomName = `group_${groupId}`;
      socket.leave(roomName);
      socket
        .to(roomName)
        .emit("systemMsg", { content: "成员退出群聊", type: "quit" });
    });

    // 3. 公共消息
    socket.on("sendPublicMsg", async (data) => {
      try {
        const { userId, username, content } = data;

        // 分别处理下普通用户数据和ai流式数据
        if (userId !== -1) {
          await db.query(
            "INSERT INTO messages (group_id, user_id, username, content) VALUES (0, ?, ?, ?)",
            [userId, username, content],
          );
          io.to("public").emit("receivePublicMsg", {
            userId,
            username,
            content,
            isStreaming: false,
            sendTime: new Date(),
          });
        } else {
          // 如果是机器人消息，直接广播（存库逻辑在 aigc-robot.js 中处理，避免重复存库）
          // io.to("public").emit("receivePublicMsg", {
          //   userId,
          //   username,
          //   content,
          //   isStreaming: true,
          //   sendTime: new Date(),
          // });
        }
      } catch (err) {
        console.log("公共消息发送失败", err);
      }
    });

    // 4. 群聊消息
    socket.on("sendGroupMsg", async (data) => {
      try {
        const { groupId, userId, username, content } = data;
        const roomName = `group_${groupId}`;
        await db.query(
          "INSERT INTO messages (group_id, user_id, username, content) VALUES (?, ?, ?, ?)",
          [groupId, userId, username, content],
        );
        io.to(roomName).emit("receiveGroupMsg", {
          groupId,
          userId,
          username,
          content,
          sendTime: new Date(),
        });
      } catch (error) {
        console.log("群消息发送失败", error);
      }
    });

    // 5. 私发消息
    socket.on("sendPrivateMsg", async (data) => {
      try {
        // 给谁发的 , 谁发的 , 谁发的名字, 谁发的内容, 发送时间
        const { toUserId, fromUserId, fromUsername, content, sendTime } = data;
        console.log(data, "data");

        await db.query(
          "INSERT INTO messages (group_id, to_user_id, user_id, username, content, send_time) VALUES (?, ?, ?, ?, ?, ?)",
          [-1, toUserId, fromUserId, fromUsername, content, sendTime],
        );
        // 给好友发
        io.to(`user_${toUserId}`).emit("receivePrivateMsg", {
          toUserId,
          fromUserId,
          fromUsername,
          content,
          sendTime,
        });
        // 给自己发
        io.to(`user_${fromUserId}`).emit("receivePrivateMsg", {
          toUserId,
          fromUserId,
          fromUsername,
          content,
          sendTime,
        });
      } catch (error) {
        console.log("私发消息发送失败", error);
      }
    });

    // ====================== 修复点1：统一在线事件名 ======================
    socket.on("user:online", async (data) => {
      const { userId, username } = data;
      socket.userId = userId;
      socket.username = username;
      socket.join(`user_${userId}`); // 加入专属房间
      // 多端在线计数 +1
      const currentCount = onlineUserMap.get(userId) || 0;
      onlineUserMap.set(userId, currentCount + 1);

      // 更新数据库最后在线时间
      await db.query("UPDATE ev_user SET last_online_time = ? WHERE id = ?", [
        new Date(),
        userId,
      ]);

      // 【关键】通知所有好友：我上线了
      await notifyFriendsStatus(userId, true);
    });

    // 好友申请
    socket.on("friend_apply", async (data) => {
      try {
        const { userId, friendId, applyMsg = "申请加为好友", username } = data;

        // 1. 自己不能加自己
        if (userId === friendId) {
          return socket.emit("addFriendError", { msg: "自己不能加自己" });
        }

        // 2. 校验用户ID合法性
        if (!userId || !friendId) {
          return socket.emit("addFriendError", { msg: "用户信息异常" });
        }

        // 3. 判断被申请用户是否存在
        const [rows] = await db.query("SELECT * FROM ev_user WHERE id = ?", [
          friendId,
        ]);
        if (rows.length === 0) {
          return socket.emit("addFriendError", { msg: "用户不存在" });
        }

        // 4. 查询是否已存在好友关系
        const [rows2] = await db.query(
          `SELECT * FROM user_friends
   WHERE (user_id = ? AND friend_id = ?)
   OR (user_id = ? AND friend_id = ?)`,
          [userId, friendId, friendId, userId],
        );

        // ==============================================
        // 🔥 核心修改：存在记录时的逻辑
        // ==============================================
        if (rows2.length > 0) {
          const status = rows2[0].status;
          // 待同意：禁止重复申请
          if (status === 0) {
            return socket.emit("addFriendError", {
              msg: "已发送申请，等待对方同意",
            });
          }
          // 已同意：已是好友
          if (status === 1) {
            return socket.emit("addFriendError", { msg: "你们已经是好友了" });
          }
          // ✅ 已拒绝（status=2）：更新状态为0，重新发起申请
          if (status === 2) {
            await db.query(
              "UPDATE user_friends SET status = 0 WHERE user_id = ? AND friend_id = ?",
              [userId, friendId],
            );
            // 推送申请给对方
            io.to(`user_${friendId}`).emit("friend:apply:receive", {
              fromUserId: userId,
              fromUsername: username,
              createTime: new Date(),
            });
            return socket.emit("addFriendSuccess", {
              msg: "好友申请已重新发送",
            });
          }
          // 已拉黑：禁止申请
          if (status === 3) {
            return socket.emit("addFriendError", { msg: "对方已拉黑你" });
          }
        }

        // 5. 无任何记录：新增好友申请
        await db.query(
          "INSERT INTO user_friends (user_id, friend_id, status) VALUES (?, ?, ?)",
          [userId, friendId, 0],
        );

        // 6. 推送申请给对方
        io.to(`user_${friendId}`).emit("friend:apply:receive", {
          fromUserId: userId,
          fromUsername: username,
          createTime: new Date(),
        });
        socket.emit("addFriendSuccess", { msg: "好友申请已发送" });
      } catch (err) {
        console.log("好友申请异常：", err);
        socket.emit("addFriendError", { msg: "申请失败，请重试" });
      }
    });

    // ====================== 修复点2：同意好友（修正SQL + 双向推送） ======================
    socket.on("friend:accept", async (data) => {
      try {
        const { userId, applyUserId, username, applyUserName } = data;
        // ✅ 修复：SQL条件颠倒（user_id=申请人，friend_id=被申请人）
        const sql =
          "UPDATE user_friends SET status = 1 WHERE user_id = ? AND friend_id = ?";
        await db.query(sql, [applyUserId, userId]); // 申请人ID，被申请人ID
        await db.query(sql, [userId, applyUserId]); // 双向好友

        // 🔔 推送：给申请人发成功提示
        io.to(`user_${applyUserId}`).emit("friend:accept:success", {
          msg: `${username} 已同意你的好友申请`,
          fromUserId: userId,
          fromUsername: username,
        });
        // 🔔 推送：给当前用户（被申请人）发提示
        socket.emit("addFriendSuccess", {
          msg: `已同意 ${applyUserName} 的申请`,
        });
      } catch (err) {
        console.log("同意好友失败", err);
        socket.emit("addFriendError", { msg: "操作失败" });
      }
    });

    // ====================== 修复点3：拒绝好友（修正SQL + 双向推送） ======================
    socket.on("friend:refuse", async (data) => {
      try {
        const { userId, applyUserId, username, applyUserName } = data;
        // ✅ 修复：SQL条件颠倒
        const sql =
          "UPDATE user_friends SET status = 2 WHERE user_id = ? AND friend_id = ?";
        await db.query(sql, [applyUserId, userId]);

        // 🔔 推送：给申请人发拒绝提示
        io.to(`user_${applyUserId}`).emit("friend:refuse:success", {
          msg: `${username} 拒绝了你的好友申请`,
          fromUserId: userId,
          fromUsername: username,
        });
        // 🔔 推送：给当前用户发提示
        socket.emit("addFriendSuccess", {
          msg: `已拒绝 ${applyUserName} 的申请`,
        });
      } catch (err) {
        console.log("拒绝好友失败", err);
        socket.emit("addFriendError", { msg: "操作失败" });
      }
    });

    // 断开连接
    socket.on("disconnect", async () => {
      console.log("用户断开：", socket.id);
      const userId = socket.userId;
      if (!userId) {
        return;
      }

      // 多端在线计数-1
      const currentCount = onlineUserMap.get(userId) || 0;
      const newCount = currentCount - 1;
      if (newCount <= 0) {
        // 所有端都下线 -> 标记离线
        onlineUserMap.delete(userId);
        // 更新最后在线时间
        await db.query("UPDATE ev_user SET last_online_time = ? WHERE id = ?", [
          new Date(),
          userId,
        ]);
        // 推送离线提示
        await notifyFriendsStatus(userId, false);
      } else {
        onlineUserMap.set(userId, newCount);
      }
    });
  });
  return io;
};

module.exports = initSocket;
