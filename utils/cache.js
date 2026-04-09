// redis缓存实现
const Redis = require("ioredis"); // 导入redis缓存模块

// 1. 连接Redis(类比为公共的localStorage服务器)
const redis = new Redis({
  host: "localhost",
  port: 6379,
});
// 处理连接成功和失败
redis.on("connect", () => {
  console.log("Redis已连接");
});
redis.on("error", (err) => {
  console.log("Redis连接错误：", err);
});

// 读取缓存的方法
const getCache = async (key) => {
  try {
    const data = await redis.get(key);
    console.log("当前使用了redis缓存", data);

    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error("读取缓存失败:", err);
    return null; // 就是说如果redis崩了也不会报错,而是返回null,后期进行判断调接口
  }
};

// 写入缓存的方法
const setCache = async (key, value) => {
  try {
    // 随机过期时间,防止雪崩
    const expiresIn = Math.floor(Math.random() * 3600) + 1;
    // 写入缓存
    await redis.set(key, JSON.stringify(value), "EX", expiresIn);
  } catch (error) {
    console.error("写入缓存失败:", error);
  }
};

// 导出给其他接口使用
module.exports = {
  getCache,
  setCache,
};
