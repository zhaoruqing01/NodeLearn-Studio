// 引入依赖
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

// 目标爬虫地址（静态渲染网页）
const TARGET_URL = "https://news.baidu.com/";

// 爬虫主函数
async function spider() {
  try {
    // 1. 发送请求，获取网页HTML
    // 配置请求头，模拟浏览器访问（防反爬）
    const { data: html } = await axios.get(TARGET_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    // 2. 用cheerio加载HTML，获得jQuery-like的$对象
    const $ = cheerio.load(html);
    const result = [];

    // 3. 解析DOM，提取数据（右键检查元素，复制选择器）
    $(".banner-news li").each((index, element) => {
      // 提取标题、链接
      const title = $(element).find("a").text().trim();

      const link = $(element).find("a").attr("href");
      console.log(title, "标题");
      console.log(link, "链接");

      if (title && link) {
        result.push({ title, link });
      }
    });

    // 4. 数据处理+保存
    console.log("爬取结果：", result);
    // 保存为本地JSON文件
    fs.writeFileSync("news.json", JSON.stringify(result, null, 2), "utf-8");
    console.log("数据保存成功！");
  } catch (error) {
    console.error("爬虫失败：", error.message);
  }
}

// 启动爬虫
spider();
