// 封装axios实例
const axios = require("axios");

// 这个位置实际请求的是需要转发的后端接口的地址
// 只不过当前项目将api接口和bff写在一起了,所以当前的baseUrl是api接口的地址
const request = axios.create({
  baseURL: "http://127.0.0.1:3007",
  timeout: 5000,
});

request.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);
request.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    // 网络超时/后端500，自动重试 1 次
    const config = error.config;
    if (!config || config.__retry) {
      return Promise.reject(error);
    }

    // 标记重试，防止无限循环
    config.__retry = true;
    await new Promise((resolve) => setTimeout(resolve, 300));

    // 重试请求
    return request(config);
  },
);
module.exports = request;
