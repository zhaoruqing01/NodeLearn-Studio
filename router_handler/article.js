const db = require("../db/index"); // 导入数据库模块
const { article_schema } = require("../schema"); // 导入Schema的校验规则

// 首先实现的功能的分页查询列表
exports.getArticelList = async (req, res) => {
  try {
    // 获取前端传递参数(对应前端页面的表格)
    const { page = 1, pageSize = 10, title = "" } = req.query;
    const offset = (page - 1) * pageSize;

    // 拼接sql,支持模糊查询
    const sql = `
      SELECT id , title , author , create_time , status
      FROM articles
      WHERE title LIKE ? 
      ORDER BY create_tiem DESC
      LIMIT ? OFFSET ?
    `;

    // 查询参数
    const params = [`%${title}%`, pageSize, offset];

    // 执行查询操作
    const [articles] = await db.query(sql, params);

    // 查询总条数
    const totalSql = "SELECT COUNT(*) AS total FROM article WHERE title LIKE ?"; // 将查询结果命名为total
    const [countRes] = await db.query(totalSql, [`%${title}%`]);

    const total = countRes[0].total;

    // 返回格式
    res.send({
      status: 0,
      message: "注册成功",
    });
  } catch (error) {}
};
