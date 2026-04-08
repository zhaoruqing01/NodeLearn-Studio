const axios = require("axios");
const fs = require("fs");
const path = require("path");

// 封装axios实例
const apiClient = axios.create({
  baseURL: "http://127.0.0.1:3007",
  timeout: 5000, // 设置5秒超时
});

// 日志函数
const logRequest = (req, result) => {
  const log = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    query: req.query,
    status: 200,
    response: result,
  };
  const logPath = path.join(__dirname, "../logs/bff.log");
  fs.appendFileSync(logPath, JSON.stringify(log) + "\n");
};

exports.handleBFF = async (req, res) => {
  try {
    // 1. 参数验证与转换
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const title = req.query.title || "";

    // 分页参数范围检查
    if (page < 1)
      return res.status(400).json({ code: 400, message: "page不能小于1" });
    if (pageSize < 1 || pageSize > 100)
      return res
        .status(400)
        .json({ code: 400, message: "pageSize必须在1-100之间" });

    // 2. Token预处理
    const token = req.headers.authorization;
    if (!token)
      return res.status(401).json({ code: 401, message: "缺少token" });

    // 3. 并行请求（支持部分失败）
    const [articlesResult, userInfoResult] = await Promise.allSettled([
      // 文章列表接口
      apiClient.get("/api/articles", {
        params: { page, pageSize, title },
        headers: { Authorization: token },
      }),
      // 用户信息接口
      apiClient.get("/my/userinfo", {
        headers: { Authorization: token },
      }),
    ]);

    // 4. 处理响应结果
    const result = {
      articles: [],
      userInfo: null,
      pagination: { page, pageSize, totalCount: 0 },
    };

    // 文章列表响应处理
    if (articlesResult.status === "fulfilled") {
      const articlesRes = articlesResult.value;
      result.articles = articlesRes.data.data;
      result.pagination.totalCount = articlesRes.data.totalCount || 0;
    }

    // 用户信息响应处理
    if (userInfoResult.status === "fulfilled") {
      const userInfoRes = userInfoResult.value;
      result.userInfo = userInfoRes.data.data.username;
    }

    // 5. 记录请求日志
    logRequest(req, result);

    // 6. 返回给前端
    res.json({
      code: 200,
      message: "success",
      data: result,
    });
  } catch (error) {
    // 6. 错误处理
    if (error.response) {
      // 业务错误：后端返回的错误
      res.status(error.response.status).json({
        code: error.response.data.code,
        message: error.response.data.message,
      });
    } else if (error.request) {
      // 网络错误：请求已发送但无响应
      res.status(503).json({ code: 503, message: "服务不可用" });
    } else {
      // 系统错误：请求配置或其他错误
      res
        .status(500)
        .json({ code: 500, message: "系统错误", error: error.message });
    }
  }
};
