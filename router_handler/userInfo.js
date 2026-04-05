const db = require("../db/index"); // 导入数据库模块
const bcrypt = require("bcryptjs"); // 数据库密码加密处理

// 查询用户信息
const getUserInfo = (req, res) => {
  const selStr =
    "SELECT username,nickname,email, user_pic from ev_user where id=?";
  db.query(selStr, req.user.id, (err, data) => {
    if (err) return req.cc(err);
    if (data.length === 0) return req.cc("查询失败", -1);
    const results = data[0];
    res.send({
      status: 0,
      message: "查询成功",
      data: results,
    });
  });
};

// 更新用户信息
const updateuserInfo = (req, res) => {
  const userInfo = req.body;
  const uptStr = "update ev_user set ? where id=? ";
  db.query(uptStr, [userInfo, userInfo.id], (err, data) => {
    if (err) return req.cc(err);
    if (data.affectedRows === 0) return req.cc("更新失败");
    res.send({
      status: 0,
      message: "更新成功",
    });
  });
};

// 更新密码的操作
const updatePwd = (req, res) => {
  const selStr = "SELECT * FROM ev_user WHERE id =?";
  db.query(selStr, req.user.id, (err, data) => {
    if (err) return req.cc(err);
    if (data.length === 0) return req.cc("用户不存在");
    // 对比旧密码是否正确
    const compareRes = bcrypt.compareSync(req.body.oldPwd, data[0].password);
    if (!compareRes) return req.cc("旧密码输入有误,请重新输入!");
    // 查询出来就更新数据
    const uptStr = "UPDATE ev_user SET password = ? WHERE id = ?";
    req.body.newPwd = bcrypt.hashSync(req.body.newPwd, 10);
    db.query(uptStr, [req.body.newPwd, req.user.id], (err, data) => {
      if (err) return req.cc(err);
      if (data.affectedRows !== 1) return req.cc("更新失败,请稍后重试");
      res.send({
        status: 0,
        message: "更新成功",
      });
    });
  });
};
module.exports = {
  getUserInfo,
  updateuserInfo,
  updatePwd,
};
