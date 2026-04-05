const express = require("express");
const cors = require("cors");
const router = require("./router/user");
const userInfoRouter = require("./router/userInfo");
const { expressjwt: expressJWT } = require("express-jwt");
const secret = require("./config/index");
const swaggerSetup = require("./swagger");

const app = express();
// 跨域请求的中间件
app.use(cors());
// 处理application/json格式的中间件
app.use(express.json());
// 处理application/x-www-form-urlencoded格式的中间件
app.use(express.urlencoded({ extended: false }));

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
    path: [/^\/api\//, /^\/api-docs/],
  }),
);

// 配置路由对象 - 并配置路由前缀
app.use("/api", router.router);
app.use("/my", userInfoRouter); // my路径开头的需要进行token验证

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

app.listen(3007, () => {
  console.log("服务启动了 http://127.0.0.1:3007");
});
