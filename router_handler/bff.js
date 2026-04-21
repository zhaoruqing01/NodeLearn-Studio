const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { getCache, setCache } = require("../utils/cache"); // 导入缓存模块
const request = require("../utils/request"); // 导入请求模块，用于并行请求接口

// 封装axios实例
const apiClient = axios.create({
  baseURL: process.env.VITE_BASE_URL + ":" + process.env.VITE_BASE_PORT,
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

// 单接口处理函数
exports.handleBFF = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const title = req.query.title || "";

    // 5. 生成缓存key(唯一标识)
    const cacheKey = `articles:${page}:${pageSize}:${title}`;

    // 6. 先读缓存,如果有缓存则使用缓存
    const cacheData = await getCache(cacheKey);
    console.log(cacheData, "cacheData");

    const hasData = !!(
      cacheData &&
      (cacheData.articles?.length > 0 || cacheData.pagination.totalCount > 0)
    );
    if (hasData) {
      return res.send({
        code: 200,
        message: "成功使用了redis缓存",
        data: cacheData,
      });
    }
    if (page < 1)
      return res.status(400).json({ code: 400, message: "page不能小于1" });
    if (pageSize < 1 || pageSize > 100)
      return res
        .status(400)
        .json({ code: 400, message: "pageSize必须在1-100之间" });

    const token = req.headers.authorization;
    if (!token)
      return res.status(401).json({ code: 401, message: "缺少token" });

    // 7. 缓存不存在则请求接口,并写入缓存
    // 并行请求（支持部分失败）
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

    const result = {
      articles: [],
      userInfo: null,
      pagination: { page, pageSize, totalCount: 0 },
    };
    console.log(articlesResult, "articlesResult");
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

    // 记录请求日志
    logRequest(req, result);

    // 8. 缓存不存在则请求接口,并写入缓存,就这么简单
    await setCache(cacheKey, result);

    res.json({
      code: 200,
      message: "未使用redis缓存",
      data: result,
    });
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json({
        code: error.response.data.code,
        message: error.response.data.message,
      });
    } else if (error.request) {
      res.status(503).json({ code: 503, message: "服务不可用" });
    } else {
      res
        .status(500)
        .json({ code: 500, message: "系统错误", error: error.message });
    }
  }
};

// 批量接口处理函数 - 实现批量代理转发和redis缓存功能
exports.handleBFFBatch = async (req, res) => {
  try {
    // 从req中获取请求参数
    const {
      method,
      originalUrl: url,
      query: params,
      body: data,
      headers,
    } = req;

    // 生成缓存key（必须序列化，不能直接用对象）
    const cacheKey = `batch:${url}:${method}:${JSON.stringify(params)}:${JSON.stringify(data)}`;

    // 读缓存
    const cacheData = await getCache(cacheKey);
    if (cacheData) {
      return res.json({ code: 200, message: "success", data: cacheData });
    }

    // 转发请求（透传token）
    const result = await request({
      url: url,
      method: method,
      params: params,
      data: data,
      headers: { Authorization: headers.authorization },
    });

    const responseData = result.data;

    // GET请求写入缓存
    if (method === "GET") {
      await setCache(cacheKey, responseData);
    }

    // 记录日志
    logRequest(req, responseData);

    // 返回结果
    res.send({ code: 200, message: "success", data: responseData });
  } catch (error) {
    res.status(500).send({
      code: 500,
      message: "批量代理转发失败",
      error: error.message,
    });
  }
};
