const express = require("express");
const router = express.Router();
const bff_hanlder = require("../router_handler/bff");
/**
 * @swagger
 * /api/bff:
 *   get:
 *     summary: BFF 接口转发与数据合并
 *     description: 并行请求文章列表和用户信息接口，合并返回结果
 *     tags: [BFF 接口]
 *     parameters:
 *       - name: page
 *         in: query
 *         description: 分页页码
 *         required: false
 *         type: integer
 *         default: 1
 *       - name: pageSize
 *         in: query
 *         description: 每页条数
 *         required: false
 *         type: integer
 *         default: 10
 *       - name: title
 *         in: query
 *         description: 文章标题搜索关键词
 *         required: false
 *         type: string
 *     responses:
 *       200:
 *         description: 请求成功
 *         schema:
 *           type: object
 *           properties:
 *             code:
 *               type: integer
 *               example: 200
 *             message:
 *               type: string
 *               example: success
 *             data:
 *               type: object
 *               properties:
 *                 articles:
 *                   type: object
 *                   description: 文章列表数据
 *                 userInfo:
 *                   type: object
 *                   description: 用户信息数据
 *                 pagination:
 *                   type: object
 *                   description: 分页信息
 */
router.get("/bff", bff_hanlder.handleBFF);

// 批量代理转发接口
// router.post(/^\/api\/(.*)/, bff_hanlder.handleBFFBatch);

module.exports = router;
