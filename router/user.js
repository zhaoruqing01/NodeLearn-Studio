const express = require("express");
const router_handler = require("../router_handler/user");
// 表单验证包
const expressJoi = require("@escook/express-joi");
const { regUser_login_schema } = require("../schema/index"); // 导入并配置中间件

// 配置路由对象并统一导出
const router = express.Router();

/**
 * @swagger
 * /api/reguser:
 *   post:
 *     summary: Register a new user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: User's username
 *                 minLength: 1
 *                 maxLength: 12
 *               password:
 *                 type: string
 *                 description: User's password
 *                 minLength: 6
 *                 maxLength: 12
 *     responses:
 *       200:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   description: Status code
 *                   example: 0
 *                 message:
 *                   type: string
 *                   description: Response message
 *                   example: "注册成功"
 *       400:
 *         description: Registration failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   description: Status code
 *                   example: -1
 *                 message:
 *                   type: string
 *                   description: Error message
 *                   example: "用户名已存在"
 */
router.post(
  "/reguser",
  expressJoi(regUser_login_schema),
  router_handler.regUser,
);

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: User login
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: User's username
 *                 minLength: 1
 *                 maxLength: 12
 *               password:
 *                 type: string
 *                 description: User's password
 *                 minLength: 6
 *                 maxLength: 12
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   description: Status code
 *                   example: 0
 *                 message:
 *                   type: string
 *                   description: Response message
 *                   example: "登录成功"
 *                 token:
 *                   type: string
 *                   description: JWT token
 *                   example: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Login failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   description: Status code
 *                   example: -1
 *                 message:
 *                   type: string
 *                   description: Error message
 *                   example: "用户名不存在"
 */
router.post("/login", expressJoi(regUser_login_schema), router_handler.login);
router.get("/info", (req, res) => {
  res.send("info is OK");
});

module.exports = { router };
