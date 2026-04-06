const bcrypt = require("bcryptjs"); // 数据库密码加密处理
const db = require("../db/index"); // 导入数据库模块
const jwt = require("jsonwebtoken"); // 导入token模块
const secretKey = require("../config/index"); // token秘钥

// 配置注册路由相关的处理方法
exports.regUser = (req, res) => {
  const userInfo = req.body;
  // 新增注册
  // 表单校验
  const selStr = "SELECT * FROM ev_user WHERE username = ?";
  db.query(selStr, [userInfo.username], (err, results) => {
    if (err) {
      console.error("查询错误:", err);
      return res.send({
        status: -1,
        message: err.message,
      });
    }
    if (results.length > 0) {
      return res.send({
        status: -1,
        message: "用户名已存在",
      });
    }
    // 对用户的密码,进行 bcrype 加密，返回值是加密之后的密码字符串
    userInfo.password = bcrypt.hashSync(userInfo.password, 10);
    // 校验通过则插入数据
    const inrStr = "INSERT INTO ev_user SET ?";
    db.query(
      inrStr,
      { username: userInfo.username, password: userInfo.password },
      (err, results) => {
        if (err) {
          console.error("插入错误:", err);
          return res.send({
            status: -1,
            message: err.message,
          });
        }
        if (results.affectedRows !== 1) {
          return res.send({
            status: -1,
            message: "注册失败",
          });
        }
        // 注册成功，发送响应
        res.send({
          status: 0,
          message: "注册成功",
        });
      },
    );
  });
};

// 配置登录路由相关的处理方法
exports.login = (req, res) => {
  const userInfo = req.body;
  const selStr = "SELECT * FROM ev_user WHERE username = ?";
  db.query(selStr, userInfo.username, (err, data) => {
    if (err) {
      return req.cc(err);
    }
    if (data.length === 0) return req.cc("用户名不存在", -1);
    const results = data[0];
    // 将密码和加密的后的密码进行对比
    const isValidPassword = bcrypt.compareSync(
      userInfo.password,
      results.password,
    );
    if (!isValidPassword) {
      return req.cc("密码错误");
    }

    // 处理token
    const tokenStr = jwt.sign(
      { ...results, password: "", user_pic: "" },
      secretKey,
      {
        expiresIn: "1h",
      },
    );
    if (isValidPassword) {
      res.send({
        status: 0,
        message: "登录成功",
        // 为了方便客户端使用 Token，在服务器端直接拼接上 Bearer 的前缀
        token: "Bearer " + tokenStr,
      });
    }
  });
};
