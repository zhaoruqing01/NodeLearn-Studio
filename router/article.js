// 这个文件的作用是将URL映射到router_handler里的具体方法
const express = require("express");
const router = express.Router();
const expressJoi = require("@escook/express-joi");
const { article_schema } = require("../schema/index");

// 导入处理函数
const article_handler = require("../router_handler/article");

/**
 * @swagger
 * /api/articles:
 *   get:
 *     summary: Get article list with pagination
 *     tags: [Article]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         description: Page number
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: pageSize
 *         in: query
 *         description: Number of items per page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *       - name: title
 *         in: query
 *         description: Article title for fuzzy search
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Article list retrieved successfully
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
 *                     list:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             description: Article ID
 *                           title:
 *                             type: string
 *                             description: Article title
 *                           author:
 *                             type: string
 *                             description: Article author
 *                           create_time:
 *                             type: string
 *                             description: Creation time
 *                           status:
 *                             type: string
 *                             description: Article status
 *                     total:
 *                       type: integer
 *                       description: Total number of articles
 *                     page:
 *                       type: integer
 *                       description: Current page number
 *                     pageSize:
 *                       type: integer
 *                       description: Number of items per page
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
router.get("/articles", article_handler.getArticleList);

/**
 * @swagger
 * /api/addArticle:
 *   post:
 *     summary: Add a new article
 *     tags: [Article]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - author
 *               - status
 *             properties:
 *               title:
 *                 type: string
 *                 description: Article title
 *               author:
 *                 type: string
 *                 description: Article author
 *               status:
 *                 type: string
 *                 description: Article status
 *               content:
 *                 type: string
 *                 description: Article content
 *     responses:
 *       200:
 *         description: Article added successfully
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
 *                   example: "新增成功"
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   description: Status code
 *                   example: 1
 *                 message:
 *                   type: string
 *                   description: Error message
 *                   example: "新增失败"
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
  "/addArticle",
  expressJoi(article_schema),
  article_handler.addArticle,
);

/**
 * @swagger
 * /api/delArticle:
 *   post:
 *     summary: Delete an article
 *     tags: [Article]
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
 *             properties:
 *               id:
 *                 type: integer
 *                 description: Article ID
 *     responses:
 *       200:
 *         description: Article deleted successfully
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
 *                   example: "删除成功"
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   description: Status code
 *                   example: 1
 *                 message:
 *                   type: string
 *                   description: Error message
 *                   example: "删除失败"
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
  "/delArticle",

  article_handler.delArticle,
);

/**
 * @swagger
 * /api/updateArticle:
 *   post:
 *     summary: Update an article
 *     tags: [Article]
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
 *               - title
 *               - author
 *               - status
 *             properties:
 *               id:
 *                 type: integer
 *                 description: Article ID
 *               title:
 *                 type: string
 *                 description: Article title
 *               author:
 *                 type: string
 *                 description: Article author
 *               status:
 *                 type: string
 *                 description: Article status
 *               content:
 *                 type: string
 *                 description: Article content
 *     responses:
 *       200:
 *         description: Article updated successfully
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
 *                   example: "修改成功"
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   description: Status code
 *                   example: 1
 *                 message:
 *                   type: string
 *                   description: Error message
 *                   example: "修改失败"
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
 *       404:
 *         description: Article not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   description: Status code
 *                   example: 404
 *                 message:
 *                   type: string
 *                   description: Error message
 *                   example: "文章不存在或无变动"
 */
router.post(
  "/updateArticle",
  expressJoi(article_schema),
  article_handler.updateArticle,
);

module.exports = router;
