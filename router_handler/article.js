const db = require("../db/index");

// 分页查询列表
exports.getArticleList = (req, res) => {
  const { page = 1, pageSize = 10, title = "" } = req.query;
  const offset = (page - 1) * pageSize;

  const sql = `
    SELECT id , title , author , create_time , status
    FROM articles
    WHERE title LIKE ? 
    ORDER BY create_time ASC
    LIMIT ? OFFSET ?
  `;
  const params = [`%${title}%`, pageSize, offset];

  db.query(sql, params, (err, articles) => {
    if (err) {
      console.error("查询失败:", err);
      return res.status(500).json({ code: 500, message: "服务器内部错误" });
    }

    const totalSql =
      "SELECT COUNT(*) AS total FROM articles WHERE title LIKE ?";
    db.query(totalSql, [`%${title}%`], (err, countRes) => {
      if (err) {
        console.error("查询总数失败:", err);
        return res.status(500).json({ code: 500, message: "服务器内部错误" });
      }

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
    });
  });
};

// 新增文章（删除了所有校验代码！）
exports.addArticle = (req, res) => {
  const { title, author, status, content } = req.body;
  const sql =
    "INSERT INTO articles (title, author, status, content ) VALUES (?,?,?,?)";

  db.query(sql, [title, author, status, content || ""], (err, result) => {
    if (err) {
      console.error("新增失败:", err);
      return res.status(400).send({ status: 1, message: "新增失败" });
    }

    if (result.affectedRows > 0) {
      res.send({ status: 0, message: "新增成功" });
    } else {
      res.status(400).send({ status: 1, message: "新增失败" });
    }
  });
};

// 删除文章
exports.delArticle = (req, res) => {
  const { id } = req.body;
  const sql = "DELETE FROM articles WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("删除失败:", err);
      return res.send({ status: 1, message: "删除失败" });
    }

    if (result.affectedRows > 0) {
      res.send({ status: 0, message: "删除成功" });
    } else {
      res.send({ status: 1, message: "删除失败" });
    }
  });
};

// 更新文章（删除了所有校验代码！）
exports.updateArticle = (req, res) => {
  console.log(req.body, "跟新");

  const { id, title, author, status, content } = req.body;
  const sql =
    "UPDATE articles SET title = ? ,author = ? , status = ? ,content = ? WHERE id =?";

  db.query(sql, [title, author, status, content, id], (err, result) => {
    if (err) {
      console.error("修改失败:", err);
      return res.status(200).json({ status: 1, message: "修改失败" });
    }

    if (result.affectedRows > 0) {
      res.send({ status: 0, message: "修改成功" });
    } else {
      res.status(404).json({ code: 404, message: "文章不存在或无变动" });
    }
  });
};
