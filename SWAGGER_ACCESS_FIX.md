# Swagger 文档访问问题解决指南

## 问题描述

访问 `http://localhost:3007/api-docs` 时显示 `{"status":401,"message":"无效的token"}`，而不是预期的 Swagger 接口文档。

## 问题原因

- JWT 中间件配置中没有将 `/api-docs` 路径添加到免验证列表中
- 当访问 `/api-docs` 时，JWT 中间件会检查 token，导致返回 401 错误

## 解决方案

### 步骤 1：修改 JWT 中间件配置

打开 `app.js` 文件，修改 JWT 中间件的配置，将 `/api-docs` 路径添加到免验证列表中：

```javascript
// 配置解析token的中间件 - 指定哪些路径不需要解析,并解析出挂载到token上的信息供后续路由使用
app.use(
  expressJWT({
    secret: secret,
    algorithms: ["HS256"],
    requestProperty: "user",
  }).unless({
    path: [/^\/api\//, /^\/api-docs/],  // 添加 /api-docs 路径到免验证列表
  })
);
```

### 步骤 2：停止占用端口的进程

由于端口 3007 可能被占用，需要先停止占用该端口的进程：

1. 查看占用端口 3007 的进程：
   ```bash
   netstat -ano | findstr :3007
   ```

2. 终止占用端口的进程：
   ```bash
   taskkill /PID <进程ID> /F
   ```

### 步骤 3：重启服务器

重新启动 Express 服务器：

```bash
node app.js
```

## 验证结果

现在可以通过以下地址访问 Swagger 文档：

- **Swagger 在线文档**：`http://localhost:3007/api-docs`
- **API 文档文件**：`d:\Project\node-js\day05\api_server\API_DOCUMENTATION.md`

## 如何实现接口展示在 Swagger 中

### 步骤 1：安装 Swagger 相关依赖

首先需要安装 `swagger-jsdoc` 和 `swagger-ui-express` 包：

```bash
npm install swagger-jsdoc swagger-ui-express
```

### 步骤 2：创建 Swagger 配置文件

创建 `swagger.js` 文件，配置 Swagger 文档生成选项：

```javascript
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Server',
      version: '1.0.0',
      description: 'API documentation for user management system',
    },
    servers: [
      {
        url: 'http://localhost:3007',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./router/*.js', './router_handler/*.js'],
};

const specs = swaggerJsdoc(options);

module.exports = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
};
```

### 步骤 3：在 app.js 中集成 Swagger

在 `app.js` 文件中导入并使用 Swagger 配置：

```javascript
const swaggerSetup = require('./swagger');

// 配置路由对象 - 并配置路由前缀
app.use("/api", router.router);
app.use("/my", userInfoRouter); // my路径开头的需要进行token验证

// 配置 swagger
swaggerSetup(app);
```

### 步骤 4：为 API 接口添加 Swagger 注释

在路由文件中为每个 API 接口添加 Swagger 注释，例如：

```javascript
/**
 * @swagger
 * /api/reguser:
 *   post:
 *     summary: Register a new user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: User's username
 *                 minLength: 1
 *                 maxLength: 12
 *               password:
 *                 type: string
 *                 description: User's password
 *                 minLength: 6
 *                 maxLength: 12
 *     responses:
 *       200:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   description: Status code
 *                   example: 0
 *                 message:
 *                   type: string
 *                   description: Response message
 *                   example: "注册成功"
 *       400:
 *         description: Registration failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   description: Status code
 *                   example: -1
 *                 message:
 *                   type: string
 *                   description: Error message
 *                   example: "用户名已存在"
 */
router.post(
  "/reguser",
  expressJoi(regUser_login_schema),
  router_handler.regUser
);
```

### 步骤 5：重启服务器

修改完成后，重启服务器使配置生效：

```bash
node app.js
```

## 技术说明

### JWT 中间件配置

JWT 中间件使用 `express-jwt` 包实现，通过 `unless` 方法指定哪些路径不需要进行 token 验证。在这个案例中，我们需要将 Swagger 文档相关的路径添加到免验证列表中。

### 路径匹配规则

- `/^\/api\//`：匹配所有以 `/api/` 开头的路径
- `/^\/api-docs/`：匹配所有以 `/api-docs` 开头的路径

### Swagger 注释格式

Swagger 注释使用 JSDoc 格式，以 `@swagger` 标记开始，包含以下内容：
- 接口路径和请求方法
- 接口摘要和标签
- 请求参数（如果有）
- 响应数据格式
- 错误码和错误信息

### 服务器重启

当修改了服务器配置文件或添加了新的 Swagger 注释后，需要重启服务器使配置生效。如果端口被占用，需要先停止占用端口的进程。

## 总结

通过以下步骤实现了 API 接口在 Swagger 中的展示：
1. 安装 Swagger 相关依赖
2. 创建 Swagger 配置文件
3. 在 app.js 中集成 Swagger
4. 为 API 接口添加 Swagger 注释
5. 重启服务器

同时，通过将 `/api-docs` 路径添加到 JWT 中间件的免验证列表中，解决了 Swagger 文档访问时的 401 错误问题。这样，用户可以直接访问 Swagger 文档，而不需要提供 token 进行身份验证。