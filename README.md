# Videoflow - 视频分享网站

<div align="center">

🎬 **一个简洁优雅的视频分享平台**

[在线演示](#) • [文档](#) • [反馈问题](https://github.com/dakerclaw/videoflow/issues)

![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg) ![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Version](https://img.shields.io/badge/version-1.0.0-orange.svg)

</div>

---

## 📖 项目简介

Videoflow 是一个基于 Node.js 的轻量级视频分享网站，无需复杂的配置和依赖，即可快速搭建属于自己的视频分享平台。

### ✨ 核心特性

- 🎥 **视频上传** - 支持单个/批量上传，拖拽上传，自动生成缩略图
- 🔐 **密码保护** - 可为视频设置访问密码，保护隐私内容
- 🔍 **智能搜索** - 支持按标题、标签、上传用户多维度搜索
- 📅 **时间筛选** - 按年/月快速筛选视频
- 🎨 **瀑布流展示** - 响应式瀑布流布局，优雅展示视频内容
- 📱 **移动端适配** - 完美适配各种屏幕尺寸
- 👥 **用户系统** - 完整的注册/登录/权限管理
- 🛠️ **管理后台** - 可视化管理网站配置、用户和视频
- 🔗 **一键分享** - 支持复制链接、分享到微信/微博
- 🐳 **Docker 支持** - 提供完整的 Docker 部署方案

---

## 🚀 快速开始

### 方式一：直接运行（开发/测试）

#### 环境要求
- Node.js 18.0 或更高版本
- npm 或 yarn

#### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/dakerclaw/videoflow.git
cd videoflow
```

2. **安装依赖**
```bash
npm install
```

3. **启动服务**
```bash
npm start
```

4. **访问网站**
打开浏览器访问：http://localhost:3291

#### 默认管理员账号
```
用户名: dackerclaw
密码: daker123
```

---

### 方式二：Docker 部署（推荐生产环境）

#### 环境要求
- Docker 20.10.0 或更高版本
- Docker Compose 2.0.0 或更高版本（可选）

#### 使用 Docker Compose（推荐）

1. **克隆项目**
```bash
git clone https://github.com/dackerclaw/videoflow.git
cd videoflow
```

2. **启动服务**
```bash
docker-compose up -d
```

3. **访问网站**
打开浏览器访问：http://localhost:3291

#### 使用 Docker 命令

```bash
# 构建镜像
docker build -t videoflow .

# 运行容器
docker run -d \
  --name videoflow \
  -p 3291:3291 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/uploads:/app/uploads \
  videoflow
```

---

## 🐧 Linux 服务器部署指南

### 系统要求
- 操作系统：Ubuntu 20.04+ / CentOS 7+ / Debian 10+
- Node.js：18.0 或更高版本
- 内存：至少 1GB RAM
- 磁盘：至少 10GB 可用空间（根据视频存储需求调整）

### 安装步骤

#### 1. 安装 Node.js

**Ubuntu/Debian:**
```bash
# 安装 Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

**CentOS/RHEL:**
```bash
# 安装 Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 验证安装
node --version
npm --version
```

#### 2. 克隆项目

```bash
# 安装 git（如果未安装）
sudo apt-get install git  # Ubuntu/Debian
# sudo yum install git    # CentOS/RHEL

# 克隆项目
git clone https://github.com/dackerclaw/videoflow.git
cd videoflow
```

#### 3. 安装依赖并启动

```bash
# 安装依赖
npm install --production

# 启动服务（前台运行，用于测试）
npm start
```

#### 4. 使用 PM2 守护进程（推荐）

```bash
# 安装 PM2
sudo npm install -g pm2

# 使用 PM2 启动服务
pm2 start server.js --name videoflow

# 设置开机自启
pm2 startup
pm2 save

# 查看服务状态
pm2 status

# 查看日志
pm2 logs videoflow
```

#### 5. 配置 Nginx 反向代理（可选，推荐）

```nginx
# /etc/nginx/sites-available/videoflow
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3291;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 视频文件使用 Nginx 直接提供，减轻 Node.js 负担
    location /uploads {
        proxy_pass http://localhost:3291/uploads;
        proxy_set_header Host $host;
    }
}
```

启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/videoflow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 6. 配置防火墙

```bash
# Ubuntu（使用 ufw）
sudo ufw allow 3291/tcp
sudo ufw allow 80/tcp
sudo ufw enable

# CentOS（使用 firewalld）
sudo firewall-cmd --permanent --add-port=3291/tcp
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --reload
```

---

## 🔄 更新方法

### 方式一：直接更新

```bash
# 进入项目目录
cd videoflow

# 拉取最新代码
git pull origin main

# 安装/更新依赖
npm install

# 重启服务
# 如果使用 PM2
pm2 restart videoflow

# 如果直接运行，按 Ctrl+C 停止后重新运行 npm start
```

### 方式二：Docker 更新

```bash
# 进入项目目录
cd videoflow

# 拉取最新代码
git pull origin main

# 重新构建镜像
docker-compose build

# 重启服务
docker-compose down
docker-compose up -d

# 或者一键更新
docker-compose pull
docker-compose up -d
```

---

## 🗑️ 卸载方法

### 方式一：直接安装卸载

```bash
# 1. 停止服务（如果使用 PM2）
pm2 stop videoflow
pm2 delete videoflow

# 2. 删除项目目录
rm -rf videoflow

# 3. 如需完全清理，删除 Node.js（可选）
# Ubuntu/Debian
sudo apt-get remove nodejs npm
# CentOS/RHEL
sudo yum remove nodejs
```

### 方式二：Docker 卸载

```bash
# 1. 停止并删除容器
docker-compose down

# 2. 删除镜像
docker rmi videoflow

# 3. 删除项目目录
rm -rf videoflow

# 4. 如需删除数据卷
docker volume prune
```

---

## 🐳 Docker 详细说明

### Dockerfile 说明

项目根目录包含 `Dockerfile`，基于 Node.js 18  Alpine 版本构建，具有以下特点：
- 轻量级（最终镜像约 150MB）
- 自动安装依赖
- 暴露 3291 端口
- 数据持久化支持

### docker-compose.yml 说明

提供完整的多容器编排方案：
- **videoflow**：主应用服务
- **数据持久化**：挂载 `./data` 和 `./uploads` 目录
- **自动重启**：`restart: unless-stopped`
- **环境变量**：可通过 `.env` 文件配置

### 自定义配置

创建 `.env` 文件自定义配置：

```env
# 服务端口
PORT=3291

# JWT 密钥（生产环境请修改为复杂字符串）
JWT_SECRET=your-secret-key-here

# 上传文件大小限制（字节）
MAX_FILE_SIZE=524288000
```

### Docker 常用命令

```bash
# 查看容器日志
docker-compose logs -f

# 查看运行状态
docker-compose ps

# 停止服务
docker-compose stop

# 重启服务
docker-compose restart

# 进入容器调试
docker-compose exec videoflow sh

# 备份数据
tar -czf videoflow-backup.tar.gz data/ uploads/

# 恢复数据
tar -xzf videoflow-backup.tar.gz
```

---

## 📁 项目结构

```
videoflow/
├── server.js              # 主服务器文件
├── db/
│   └── database.js        # 数据库操作
├── middleware/
│   └── auth.js            # 认证中间件
├── public/
│   ├── index.html         # 首页（瀑布流展示）
│   ├── login.html         # 登录页
│   ├── register.html      # 注册页
│   ├── upload.html        # 上传页
│   ├── video.html         # 视频播放页
│   ├── admin.html         # 管理后台
│   ├── css/
│   │   └── style.css     # 样式文件
│   └── js/
│       └── main.js        # 前端逻辑
├── uploads/
│   ├── videos/            # 上传的视频文件
│   └── thumbnails/        # 视频缩略图
├── data/
│   └── db.json            # 数据库文件
├── Dockerfile             # Docker 镜像构建文件
├── docker-compose.yml     # Docker Compose 配置
├── .dockerignore         # Docker 构建忽略文件
└── package.json          # 项目配置
```

---

## ⚙️ 配置说明

### 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `PORT` | 3291 | 服务监听端口 |
| `JWT_SECRET` | videoflow_secret_key_2024 | JWT 签名密钥 |

### 网站配置

登录管理后台后可在线修改：
- 网站标题
- 网站名称
- 网站简介
- 版权信息
- Logo URL

---

## 🔧 常见问题

### 1. 端口被占用

```bash
# 查看端口占用
sudo lsof -i :3291

# 修改端口（编辑 server.js）
# 或设置环境变量
PORT=8080 npm start
```

### 2. 上传文件大小限制

修改 `server.js` 中的 `fileSize` 限制：
```javascript
limits: { fileSize: 500 * 1024 * 1024 }  // 500MB
```

### 3. 缩略图不显示

项目使用 SVG 作为默认缩略图。如需生成真实缩略图，请安装 FFmpeg：

```bash
# Ubuntu/Debian
sudo apt-get install ffmpeg

# CentOS/RHEL
sudo yum install ffmpeg
```

### 4. 权限问题

```bash
# 确保上传目录有写权限
sudo chown -R $USER:$USER uploads/ data/
chmod -R 755 uploads/ data/
```

---

## 📝 API 接口文档

### 认证接口

| 方法 | 路径 | 说明 | 需要认证 |
|------|------|------|----------|
| POST | `/api/register` | 用户注册 | ❌ |
| POST | `/api/login` | 用户登录 | ❌ |
| GET | `/api/me` | 获取当前用户信息 | ✅ |

### 视频接口

| 方法 | 路径 | 说明 | 需要认证 |
|------|------|------|----------|
| POST | `/api/videos/upload` | 上传视频 | ✅ |
| GET | `/api/videos` | 获取视频列表 | ❌ |
| GET | `/api/videos/:id` | 获取视频详情 | ❌ |
| PUT | `/api/videos/:id` | 更新视频信息 | ✅ |
| DELETE | `/api/videos/:id` | 删除视频 | ✅ |
| POST | `/api/videos/batch-delete` | 批量删除视频 | ✅ |
| GET | `/api/videos/archive/list` | 获取归档列表 | ❌ |

### 管理接口

| 方法 | 路径 | 说明 | 需要认证 |
|------|------|------|----------|
| GET | `/api/admin/users` | 获取所有用户 | ✅ (管理员) |
| PUT | `/api/admin/users/:id/toggle-disable` | 禁用/启用用户 | ✅ (管理员) |
| DELETE | `/api/admin/users/:id` | 删除用户 | ✅ (管理员) |
| GET | `/api/config` | 获取网站配置 | ❌ |
| PUT | `/api/admin/config` | 更新网站配置 | ✅ (管理员) |

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

---

## 📄 开源协议

本项目采用 MIT 协议开源。

---

## 📧 联系方式

- 作者：dackerclaw
- GitHub：[https://github.com/dackerclaw](https://github.com/dackerclaw)
- 问题反馈：[https://github.com/dackerclaw/videoflow/issues](https://github.com/dackerclaw/videoflow/issues)

---

<div align="center">
Made with ❤️ by dackerclaw
</div>
