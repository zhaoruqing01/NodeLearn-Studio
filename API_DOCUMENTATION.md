# API Documentation

## 1. User Registration

- **接口名称**: 用户注册
- **请求方法**: POST
- **完整URL路径**: `http://localhost:3007/api/reguser`
- **请求参数**:
  - `username`: string, 必填, 用户名(1-12位字母或数字)
  - `password`: string, 必填, 密码(6-12位非空字符)
- **响应数据格式**:
  ```json
  {
    "status": 0,
    "message": "注册成功"
  }
  ```
- **错误码及错误信息**:
  - `-1`: 用户名已存在
  - `-1`: 注册失败
- **前端调用方式**:
  ```javascript
  import axios from 'axios';

  async function registerUser(username, password) {
    try {
      const response = await axios.post('/api/reguser', {
        username,
        password
      });
      console.log(response.data);
    } catch (error) {
      console.error(error.response.data);
    }
  }
  ```
- **应用场景**: 用户首次使用系统时注册账号
- **调用时机**: 用户点击注册按钮时

## 2. User Login

- **接口名称**: 用户登录
- **请求方法**: POST
- **完整URL路径**: `http://localhost:3007/api/login`
- **请求参数**:
  - `username`: string, 必填, 用户名(1-12位字母或数字)
  - `password`: string, 必填, 密码(6-12位非空字符)
- **响应数据格式**:
  ```json
  {
    "status": 0,
    "message": "登录成功",
    "token": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **错误码及错误信息**:
  - `-1`: 用户名不存在
  - `-1`: 密码错误
- **前端调用方式**:
  ```javascript
  import axios from 'axios';

  async function loginUser(username, password) {
    try {
      const response = await axios.post('/api/login', {
        username,
        password
      });
      localStorage.setItem('token', response.data.token);
      console.log(response.data);
    } catch (error) {
      console.error(error.response.data);
    }
  }
  ```
- **应用场景**: 用户登录系统
- **调用时机**: 用户点击登录按钮时

## 3. Get User Information

- **接口名称**: 获取用户信息
- **请求方法**: GET
- **完整URL路径**: `http://localhost:3007/my/userinfo`
- **请求参数**: 无
- **请求头配置**: `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **响应数据格式**:
  ```json
  {
    "status": 0,
    "message": "查询成功",
    "data": {
      "username": "example",
      "nickname": "Example User",
      "email": "example@example.com",
      "user_pic": "http://example.com/pic.jpg"
    }
  }
  ```
- **错误码及错误信息**:
  - `-1`: 查询失败
  - `401`: 无效的token
- **前端调用方式**:
  ```javascript
  import axios from 'axios';

  async function getUserInfo() {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get('/my/userinfo', {
        headers: {
          'Authorization': token
        }
      });
      console.log(response.data);
    } catch (error) {
      console.error(error.response.data);
    }
  }
  ```
- **应用场景**: 用户登录后获取个人信息
- **调用时机**: 页面加载时

## 4. Update User Information

- **接口名称**: 更新用户信息
- **请求方法**: POST
- **完整URL路径**: `http://localhost:3007/my/userinfo`
- **请求参数**:
  - `id`: integer, 必填, 用户ID(大于等于1)
  - `nickname`: string, 必填, 用户昵称
  - `email`: string, 必填, 用户邮箱
- **请求头配置**: `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **响应数据格式**:
  ```json
  {
    "status": 0,
    "message": "更新成功"
  }
  ```
- **错误码及错误信息**:
  - `-1`: 更新失败
  - `401`: 无效的token
- **前端调用方式**:
  ```javascript
  import axios from 'axios';

  async function updateUserInfo(id, nickname, email) {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post('/my/userinfo', {
        id,
        nickname,
        email
      }, {
        headers: {
          'Authorization': token
        }
      });
      console.log(response.data);
    } catch (error) {
      console.error(error.response.data);
    }
  }
  ```
- **应用场景**: 用户修改个人信息
- **调用时机**: 用户点击保存按钮时

## 5. Update User Password

- **接口名称**: 更新用户密码
- **请求方法**: POST
- **完整URL路径**: `http://localhost:3007/my/updatepwd`
- **请求参数**:
  - `oldPwd`: string, 必填, 旧密码(6-12位非空字符)
  - `newPwd`: string, 必填, 新密码(6-12位非空字符, 且与旧密码不同)
- **请求头配置**: `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **响应数据格式**:
  ```json
  {
    "status": 0,
    "message": "更新成功"
  }
  ```
- **错误码及错误信息**:
  - `-1`: 旧密码输入有误
  - `-1`: 更新失败
  - `401`: 无效的token
- **前端调用方式**:
  ```javascript
  import axios from 'axios';

  async function updatePassword(oldPwd, newPwd) {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post('/my/updatepwd', {
        oldPwd,
        newPwd
      }, {
        headers: {
          'Authorization': token
        }
      });
      console.log(response.data);
    } catch (error) {
      console.error(error.response.data);
    }
  }
  ```
- **应用场景**: 用户修改密码
- **调用时机**: 用户点击保存密码按钮时

## 前端开发建议

### 请求库推荐
- **Axios**: 推荐使用Axios作为请求库，支持拦截器、请求取消、自动转换JSON数据等功能
- **Fetch API**: 原生API，无需额外安装，但需要手动处理错误和JSON转换

### 请求头配置
- 所有需要身份验证的接口都需要在请求头中携带`Authorization`字段，值为`Bearer ` + token

### 参数传递方式
- POST请求使用JSON格式传递参数
- GET请求使用URL查询参数传递参数

### 身份验证机制
- 使用JWT token进行身份验证
- token有效期为1小时
- token失效后需要重新登录

### 响应处理逻辑
- 检查响应状态码
- 处理成功响应
- 处理错误响应

### 错误处理策略
- 捕获网络错误
- 处理HTTP错误
- 显示友好的错误信息

## Swagger文档

- **访问地址**: `http://localhost:3007/api-docs`
- **功能**: 在线API文档，支持接口测试