const { Server } = require("socket.io"); // 新增：Socket.IO 服务端

// 初始哈Scoket.IO服务的函数
const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // 所有的Scokeet.IO逻辑都写在这里
  io.on("connection", (scoket) => {
    console.log("新用户连接: ID", scoket.id);

    // 聊天消息
    scoket.on("chat message", (data) => {
      console.log("接收到消息:", data);
      io.emit("chat message", {
        ...data,
        userId: scoket.id,
      });
    });

    // 直播间房间,其实就是不同的群聊,根据不同的群聊实现通信间的隔离
    scoket.on("join room", (roomId) => {
      scoket.join(roomId);
      io.to(roomId).emit("system notice", "有新观众进入直播间");
    });
    // 弹幕
    scoket.on("send danmu", (data) => {
      io.to(data.roomId).emit("receive danmu", data);
    });
    // 断开连接
    scoket.on("disconnect", () => {
      console.log("用户断开连接: ID", scoket.id);
    });
  });
  return io;
};

module.exports = initSocket;
