const db = require("../db/index");

// 分页查询列表
exports.getArticleList = async (req, res) => {
  const { page = 1, pageSize = 10, title = "" } = req.query;
  const offset = (page - 1) * pageSize;

  const sql = `
    SELECT id , title , author , create_time , status
    FROM articles
    WHERE title LIKE ? 
    ORDER BY create_time ASC
    LIMIT ? OFFSET ?
  `;
  const params = [`%${title}%`, Number(pageSize), Number(offset)];

  try {
    const [articles] = await db.query(sql, params);

    const totalSql =
      "SELECT COUNT(*) AS total FROM articles WHERE title LIKE ?";
    const [countRes] = await db.query(totalSql, [`%${title}%`]);

    res.send({
      status: 0,
      message: "查询成功",
      data: {
        list: articles,
        total: countRes[0].total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
      },
    });
  } catch (err) {
    console.error("查询失败:", err);
    res.status(500).json({ code: 500, message: "服务器内部错误" });
  }
};

// 新增文章（删除了所有校验代码！）
exports.addArticle = async (req, res) => {
  const { title, author, status, content } = req.body;
  const sql =
    "INSERT INTO articles (title, author, status, content ) VALUES (?,?,?,?)";

  try {
    const [result] = await db.query(sql, [
      title,
      author,
      status,
      content || "",
    ]);

    if (result.affectedRows > 0) {
      res.send({ status: 0, message: "新增成功" });
    } else {
      res.status(400).send({ status: 1, message: "新增失败" });
    }
  } catch (err) {
    console.error("新增失败:", err);
    res.status(400).send({ status: 1, message: "新增失败" });
  }
};

// 删除文章
exports.delArticle = async (req, res) => {
  const { id } = req.body;
  const sql = "DELETE FROM articles WHERE id = ?";

  try {
    const [result] = await db.query(sql, [id]);

    if (result.affectedRows > 0) {
      res.send({ status: 0, message: "删除成功" });
    } else {
      res.send({ status: 1, message: "删除失败" });
    }
  } catch (err) {
    console.error("删除失败:", err);
    res.send({ status: 1, message: "删除失败" });
  }
};

// 更新文章（删除了所有校验代码！）
exports.updateArticle = async (req, res) => {
  console.log(req.body, "跟新");

  const { id, title, author, status, content } = req.body;
  const sql =
    "UPDATE articles SET title = ? ,author = ? , status = ? ,content = ? WHERE id =?";

  try {
    const [result] = await db.query(sql, [title, author, status, content, id]);

    if (result.affectedRows > 0) {
      res.send({ status: 0, message: "修改成功" });
    } else {
      res.status(404).json({ code: 404, message: "文章不存在或无变动" });
    }
  } catch (err) {
    console.error("修改失败:", err);
    res.status(200).json({ status: 1, message: "修改失败" });
  }
};
