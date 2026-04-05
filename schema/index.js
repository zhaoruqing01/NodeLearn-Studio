// Import express-joi package
const expressJoi = require("@escook/express-joi");

// 获取@escook/express-joi内部使用的Joi实例
// 这样可以确保使用同一个Joi版本，避免版本冲突
const Joi = require("joi");

// 配置注册表单校验
const username = Joi.string().alphanum().min(1).max(12).required();
const password = Joi.string()
  .alphanum()
  .pattern(/^[\S]{6,12}$/)
  .required();

const regUser_login_schema = {
  //配置校验规则,表示校验的是body体上的数据
  body: {
    username,
    password,
  },
};

// 配置用户信息更新校验
// 定义 id, nickname, emial 的验证规则
const id = Joi.number().integer().min(1).required();
const nickname = Joi.string().required();
const email = Joi.string().email().required();

const userInfo_schema = {
  body: {
    id,
    nickname,
    email,
  },
};

// 配置更新密码的校验 - 新旧密码不同,新旧密码校验参数继承password
// 使用 joi.not(joi.ref('oldPwd')).concat(password) 规则，验证 req.body.newPwd 的值
// 解读：
// 1. joi.ref('oldPwd') 表示 newPwd 的值必须和 oldPwd 的值保持一致
// 2. joi.not(joi.ref('oldPwd')) 表示 newPwd 的值不能等于 oldPwd 的值
// 3. .concat() 用于合并 joi.not(joi.ref('oldPwd')) 和 password 这两条验证规则
const password_schema = {
  body: {
    oldPwd: password,
    newPwd: Joi.not(Joi.ref("oldPwd")).concat(password),
  },
};

// 导出文章的校验规则
const article_schema = {
  body: {
    title: Joi.string().min(1).max(50).required().message({
      "string.base": "文章标题必须是字符串",
      "string.min": "文章标题长度不能小于1个字符",
      "string.max": "文章标题长度不能大于50个字符",
      "any.required": "文章标题不能为空",
    }),
    author: Joi.string().required().message("文章作者不能为空"),
    status: Joi.string().valid("已发布", "草稿").default("草稿"),
  },
};

module.exports = {
  regUser_login_schema,
  userInfo_schema,
  password_schema,
  article_schema,
};
