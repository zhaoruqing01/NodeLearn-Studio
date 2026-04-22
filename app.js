require("dotenv").config();

const express = require("express");
const cors = require("cors");
const router = require("./router/user");
const userInfoRouter = require("./router/userInfo");
const { expressjwt: expressJWT } = require("express-jwt");
const secret = require("./config/index");
const swaggerSetup = require("./swagger");
const articleRouter = require("./router/article");
const groupRouter = require("./router/group");
const bffRouter = require("./router/bff");
const userFriendsRouter = require("./router/userFriends");
const aigcRobotRouter = require("./router/aigc-robot");
const initSocket = require("./utils/scoket");
const http = require("http"); // 新增：Node.js 内置 http 模块
const { Server } = require("socket.io"); // 新增：Socket.IO 服务端

const app = express();
// 跨域请求的中间件
app.use(cors());
// 处理application/json格式的中间件
app.use(express.json());
// 处理application/x-www-form-urlencoded格式的中间件
app.use(express.urlencoded({ extended: false }));

// 【全局在线状态】挂在 app 上，所有文件都能访问
app.onlineUserMap = new Map();

// 配置Scoket.IO服务
const server = http.createServer(app);
// 这一部分是为了初始化Scoket.IO服务,并返回一个io对象,为以后可能使用 --Derbao说
const io = initSocket(server, app); // 将全局状态传入socket中,路由中通过req.app使用

// 配置错误处理函数
app.use(function (req, res, next) {
  req.cc = function (err, status = -1) {
    res.send({
      status,
      message: err instanceof Error ? err.message : err,
    });
  };

  next();
});

// 配置解析token的中间件 - 指定哪些路径不需要解析,并解析出挂载到token上的信息供后续路由使用
app.use(
  expressJWT({
    secret: secret,
    algorithms: ["HS256"],
    requestProperty: "user",
  }).unless({
    path: [/^\/api-docs/, /^\/user/, /^\/ai/],
  }),
);

// 配置路由对象 - 并配置路由前缀
app.use("/user", router.router); // 登录接口
app.use("/my", userInfoRouter); // my路径开头的需要进行token验证
app.use("/api", articleRouter);
app.use("/bff", bffRouter);
app.use("/api", groupRouter);
app.use("/api", userFriendsRouter);
app.use("/ai", aigcRobotRouter);

// 配置 swagger
swaggerSetup(app);

// 配置错误处理中间件,包括表单验证失败中间件
app.use(function (err, req, res, next) {
  console.log(err);

  // 检查错误是否来自Joi验证，不再直接使用joi对象
  if (err.isJoi)
    return res.send({
      status: -1,
      message: err.message,
    });
  // token解析失败导致的错误
  if (err.name === "UnauthorizedError") {
    return res.send({
      status: 401,
      message: "无效的token",
    });
  }
  res.send({
    status: -1,
    message: err.message || "服务器错误",
  });
});

// 启动服务
server.listen(process.env.VITE_BASE_PORT, "localhost", () => {
  console.log(
    `服务启动了 ${process.env.VITE_BASE_URL}:${process.env.VITE_BASE_PORT}`,
  );
  console.log("Scoket.Io服务已启动");
});
