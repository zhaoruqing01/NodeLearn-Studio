const mysql = require("mysql2/promise");

// 配置数据库连接
const db = mysql.createPool({
  host: "127.0.0.1",
  user: "root",
  password: "root",
  database: "my_db_01",
});

module.exports = db;
