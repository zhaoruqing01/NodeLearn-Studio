const { Server } = require("socket.io"); // 新增：Socket.IO 服务端
const db = require("../db");

/**
 * 设计思路
 * 1. 需要保留公共群聊功能, 房间名为public
 * 2. 需要有群聊隔离功能 - join和io.to(roomName).emit()共同实现了群聊隔离功能
 *  - joinGroup: 加入群聊房间,决定你能不能收到消息,只有进入这个房间才能收到消息
 *  - quitGroup: 退出群聊房间,决定你能不能收到消息,退出房间就收不到消息了
 *  - sendGroupMsg: 发送群聊消息,决定你能不能收到消息,io.to(roomName).emit("receiveGroupMsg", {}),将消息发送给房间
 * */

// 初始化socket.io服务
const initSocket = (server) => {
  // 初始化跨域和请求方法
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // socket的起点,先确认连接
  io.on("connection", (socket) => {
    console.log("新用户连接: ", socket.id);

    // ==============
    // 公共房间,如果用户不主动切换,则默认进入的是公共聊天室
    // ==============
    socket.join("public");

    // ==============
    // 1. 加入 群聊房间 (隔离群聊,用户主动切换房间)
    // ==============
    // 监听joinGroup
    socket.on("joinGroup", async (groupId) => {
      const roomName = `group_${groupId}`;
      socket.join(roomName);

      // 群内广播
      // socket表示当前用户的连接(每个人都是不一样的,所有也就代表你自己),就像是你自己在喊,"大家快看我,我加入群聊了"
      socket.to(roomName).emit("systemMsg", {
        content: "新成员加入群聊",
        type: "join",
      });
    });

    // ==============
    // 2. 退出 群聊房间
    // ==============
    // 监听quitGroup,退出群聊事件
    socket.on("quitGroup", (groupId) => {
      const roomName = `group_${groupId}`;
      // 退出房间
      // socket表示当前用户的连接(每个人都是不一样的,所有也就代表你自己),房间名是group_${groupId}
      socket.leave(roomName);
      socket.to(roomName).emit("systemMsg", {
        content: "成员退出群聊",
        type: "quit",
      });
    });

    // ==============
    // 3. 发送 公共消息
    // ==============
    // 监听前端发送的公共消息
    socket.on("sendPublicMsg", async (data) => {
      try {
        const { userId, username, content } = data;
        // 保存到消息表(还得新增个返回群聊消息的接口)
        await db.query(
          "INSERT INTO messages (group_id, user_id, username, content) VALUES (0, ?, ?, ?)",
          [userId, username, content],
        );

        // 这一步是转发操作,发送给公共房间
        // io发送给所有人,包括发送者自己,因为你自己也要看到你自己的消息,io相当于整个系统
        io.to("public").emit("receivePublicMsg", {
          userId,
          username,
          content,
          sendTime: new Date(),
        });
      } catch (error) {
        console.log("公共消息发送失败", err);
      }
    });

    // ==============
    // 4. 发送 群聊消息
    // ==============
    // 监听前端发送的群消息,并将对应群发送的消息转发到对应群
    socket.on("sendGroupMsg", async (data) => {
      try {
        const { groupId, userId, username, content } = data;
        const roomName = `group_${groupId}`;

        // 保存到数据库
        await db.query(
          "INSERT INTO messages (group_id, user_id, username, content) VALUES (?, ?, ?, ?)",
          [groupId, userId, username, content],
        );

        // 只发给当前群,并且是只发给join房间的人
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
    // ==============================================
    // 断开连接
    // ==============================================
    socket.on("disconnect", () => {
      console.log("用户断开：", socket.id);
    });
  });
  return io;
};

module.exports = initSocket;
