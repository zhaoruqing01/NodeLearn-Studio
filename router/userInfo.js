const express = require("express");
const router_handler = require("../router_handler/userInfo");
const router = express.Router();
const { userInfo_schema, password_schema } = require("../schema/index");
// 表单验证包
const expressJoi = require("@escook/express-joi");

/**
 * @swagger
 * /my/userinfo:
 *   get:
 *     summary: Get user information
 *     tags: [User Info]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
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
 *                   example: "查询成功"
 *                 data:
 *                   type: object
 *                   properties:
 *                     username:
 *                       type: string
 *                       description: User's username
 *                     nickname:
 *                       type: string
 *                       description: User's nickname
 *                     email:
 *                       type: string
 *                       description: User's email
 *                     user_pic:
 *                       type: string
 *                       description: User's profile picture URL
 *       401:
 *         description: Invalid token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   description: Status code
 *                   example: 401
 *                 message:
 *                   type: string
 *                   description: Error message
 *                   example: "无效的token"
 */
router.get("/userinfo", router_handler.getUserInfo);

/**
 * @swagger
 * /my/userinfo:
 *   post:
 *     summary: Update user information
 *     tags: [User Info]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - nickname
 *               - email
 *             properties:
 *               id:
 *                 type: integer
 *                 description: User's ID
 *                 minimum: 1
 *               nickname:
 *                 type: string
 *                 description: User's nickname
 *               email:
 *                 type: string
 *                 description: User's email
 *     responses:
 *       200:
 *         description: User information updated successfully
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
 *                   example: "更新成功"
 *       400:
 *         description: Update failed
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
 *                   example: "更新失败"
 *       401:
 *         description: Invalid token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   description: Status code
 *                   example: 401
 *                 message:
 *                   type: string
 *                   description: Error message
 *                   example: "无效的token"
 */
router.post(
  "/userinfo",
  expressJoi(userInfo_schema),
  router_handler.updateuserInfo,
);

/**
 * @swagger
 * /my/updatepwd:
 *   post:
 *     summary: Update user password
 *     tags: [User Info]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPwd
 *               - newPwd
 *             properties:
 *               oldPwd:
 *                 type: string
 *                 description: User's old password
 *                 minLength: 6
 *                 maxLength: 12
 *               newPwd:
 *                 type: string
 *                 description: User's new password
 *                 minLength: 6
 *                 maxLength: 12
 *     responses:
 *       200:
 *         description: Password updated successfully
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
 *                   example: "更新成功"
 *       400:
 *         description: Update failed
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
 *                   example: "旧密码输入有误,请重新输入!"
 *       401:
 *         description: Invalid token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   description: Status code
 *                   example: 401
 *                 message:
 *                   type: string
 *                   description: Error message
 *                   example: "无效的token"
 */
router.post(
  "/updatepwd",
  expressJoi(password_schema),
  router_handler.updatePwd
);

module.exports = router;
