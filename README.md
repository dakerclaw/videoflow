# Videoflow - 视频分享网站

<div align="center">

🎬 **一个简洁优雅的视频分享平台**

[在线演示](#) • [文档](#) • [反馈问题](https://github.com/dakerclaw/videoflow/issues)

![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg) ![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Version](https://img.shields.io/badge/version-1.1.0-orange.svg)

</div>

---

## 📖 项目简介

Videoflow 是一个基于 Node.js 的轻量级视频分享网站，无需复杂的配置和依赖，即可快速搭建属于自己的视频分享平台。

### ✨ 核心特性

- 🎥 **视频上传** - 支持单个/批量上传，拖拽上传，浏览器端自动生成缩略图
- 🔐 **密码保护** - 可为视频设置访问密码，保护隐私内容，一次性验证即可观看
- 🔍 **智能搜索** - 支持按标题、标签、上传用户多维度搜索
- 📅 **时间筛选** - 按年/月快速筛选视频，归档列表自动生成
- 🎨 **瀑布流展示** - 响应式瀑布流布局，优雅展示视频内容
- 📱 **移动端适配** - 完美适配各种屏幕尺寸
- 👥 **用户系统** - 完整的注册/登录/权限管理
- 🛠️ **管理后台** - 可视化管理网站配置、用户和视频
- 📝 **视频管理** - 视频选择模式，支持批量删除，编辑视频信息
- 🔗 **一键分享** - 支持复制链接、分享到微信/微博
- 🌏 **中文支持** - 完善的 UTF-8 编码支持，中文文件名和标题正常显示
- 🐳 **Docker 支持** - 提供完整的 Docker 部署方案（Compose v2 兼容）

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
用户名: dakerclaw
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
git clone https://github.com/dakerclaw/videoflow.git
cd videoflow
```

2. **启动服务**
```bash
docker compose up -d
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
git clone https://github.com/dakerclaw/videoflow.git
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
docker compose build --no-cache

# 重启服务
docker compose down
docker compose up -d

# 或者一键更新（如果使用的是预构建镜像）
docker compose pull
docker compose up -d
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
docker compose down

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

项目根目录包含 `Dockerfile`，基于 Node.js 18 Alpine 版本构建，具有以下特点：
- 轻量级（最终镜像约 150MB）
- 自动安装依赖
- 暴露 3291 端口
- 数据持久化支持
- 支持 UTF-8 中文编码

### docker-compose.yml 说明

提供完整的多容器编排方案（兼容 Docker Compose v2）：
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
docker compose logs -f

# 查看运行状态
docker compose ps

# 停止服务
docker compose stop

# 重启服务
docker compose restart

# 进入容器调试
docker compose exec videoflow sh

# 备份数据
tar -czf videoflow-backup-$(date +%Y%m%d).tar.gz data/ uploads/

# 恢复数据
tar -xzf videoflow-backup-YYYYMMDD.tar.gz
```

---

## 📁 项目结构

```
videoflow/
├── server.js              # 主服务器文件
├── db/
│   └── database.js        # 数据库操作（JSON 文件存储）
├── middleware/
│   └── auth.js            # 认证中间件
├── public/
│   ├── index.html         # 首页（瀑布流展示 + 筛选栏）
│   ├── login.html         # 登录页
│   ├── register.html      # 注册页
│   ├── upload.html        # 上传页（支持批量上传 + 浏览器端缩略图生成）
│   ├── video.html         # 视频播放页（支持密码验证 + 编辑功能）
│   ├── admin.html         # 管理后台（用户管理 + 视频管理 + 网站配置）
│   ├── css/
│   │   └── style.css     # 样式文件（响应式设计）
│   └── js/
│       └── main.js        # 前端逻辑（视频管理 + 选择模式）
├── uploads/
│   ├── videos/            # 上传的视频文件
│   └── thumbnails/        # 视频缩略图
├── data/
│   └── db.json            # 数据库文件（自动创建）
├── Dockerfile             # Docker 镜像构建文件
├── docker-compose.yml     # Docker Compose 配置（v2 兼容）
├── .dockerignore         # Docker 构建忽略文件
├── redeploy.bat          # Windows 快速重新部署脚本
└── package.json          # 项目配置
```

---

## ⚙️ 配置说明

### 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `PORT` | 3291 | 服务监听端口 |
| `JWT_SECRET` | videoflow_secret_key_2024 | JWT 签名密钥 |
| `NODE_ENV` | production | 运行环境 |

### 网站配置

登录管理后台后可在线修改：
- 网站标题
- 网站名称
- 网站简介
- 版权信息
- Logo URL

---

## 🆕 最新更新（v1.1.0）

### 新增功能
- ✨ **浏览器端缩略图生成**：使用 Canvas API 在上传时自动生成视频缩略图，无需安装 FFmpeg
- 📝 **视频选择模式**：首页新增"管理"按钮，进入选择模式后可批量选择和管理视频
- 🎯 **筛选栏优化**：将"管理"和"上传视频"按钮移动到筛选栏右侧，布局更合理
- 🔐 **密码验证优化**：加密视频只需输入一次密码即可观看，避免重复验证

### 修复问题
- 🐛 **中文乱码修复**：彻底解决中文文件名和标题显示乱码的问题
- 🐛 **HTML 源代码显示问题**：修复输入密码后跳转到网页源代码页面的严重 bug
- 🐛 **复选框显示问题**：修复视频选择模式下复选框不显示选中状态的问题
- 🐛 **编辑对话框问题**：修复视频编辑对话框保存后不自动关闭的问题
- 🐛 **Docker Compose 警告**：移除已过时的 `version` 属性，兼容 Compose v2

### 技术改进
- 🔧 添加 `iconv-lite` 依赖，更好地处理中文编码
- 🔧 改进文件上传逻辑，正确处理中文文件名（URL 编码）
- 🔧 优化密码验证流程，使用临时 token 避免重复输入
- 🔧 更新 Docker 配置，支持 UTF-8 中文环境

---

## 🔧 常见问题

### 1. 端口被占用

```bash
# 查看端口占用
sudo lsof -i :3291

# 修改端口（编辑 server.js 或设置环境变量）
PORT=8080 npm start
```

### 2. 上传文件大小限制

修改 `server.js` 中的 `fileSize` 限制：
```javascript
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
```

### 3. 中文文件名或标题显示乱码

确保满足以下条件：
- 使用最新版本的代码（已修复编码问题）
- 浏览器编码设置为 UTF-8
- Docker 容器环境变量包含 `LANG=zh_CN.UTF-8`

如果问题仍存在，请尝试：
```bash
# 清除浏览器缓存
Ctrl + Shift + Delete

# 重新构建 Docker 镜像
docker compose down
docker compose build --no-cache
docker compose up -d
```

### 4. 缩略图不显示

项目使用浏览器端 Canvas API 自动生成缩略图。如果缩略图未生成：
- 确保上传时在浏览器中正确加载视频
- 检查浏览器控制台是否有 JavaScript 错误
- 默认使用 `/default-thumbnail.jpg` 作为备用缩略图

### 5. 权限问题

```bash
# 确保上传目录有写权限
sudo chown -R $USER:$USER uploads/ data/
chmod -R 755 uploads/ data/
```

### 6. Docker 容器无法启动

```bash
# 查看容器日志
docker compose logs -f

# 检查端口占用
sudo lsof -i :3291

# 重新构建镜像
docker compose down --rmi all
docker compose build --no-cache
docker compose up -d
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
| POST | `/api/videos/upload` | 上传视频（支持批量） | ✅ |
| GET | `/api/videos` | 获取视频列表（支持搜索和筛选） | ❌ |
| GET | `/api/videos/:id` | 获取视频详情（支持临时 token） | ❌ |
| PUT | `/api/videos/:id` | 更新视频信息 | ✅ |
| DELETE | `/api/videos/:id` | 删除视频 | ✅ |
| POST | `/api/videos/batch-delete` | 批量删除视频 | ✅ |
| POST | `/api/videos/:id/verify-password` | 验证视频密码 | ❌ |
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

## 🎯 使用指南

### 上传视频

1. 登录后点击"上传视频"按钮
2. 选择要上传的视频文件（支持批量选择）
3. 可选：添加视频标题、标签、描述
4. 可选：设置视频密码（保护隐私）
5. 可选：上传自定义缩略图，或让系统自动生成
6. 点击"开始上传"按钮

### 管理视频

1. 在首页点击"管理"按钮进入选择模式
2. 点击视频卡片选择要管理的视频
3. 使用"全选"按钮快速选择所有视频
4. 点击"删除选中"批量删除视频
5. 再次点击"取消选择"退出选择模式

### 编辑视频信息

1. 在视频播放页面点击"✏️ 编辑"按钮
2. 修改视频标题、标签、描述或密码
3. 点击"保存"按钮应用更改

### 分享视频

1. 在视频播放页面滚动到"分享视频"区域
2. 点击"📋 复制链接"复制视频链接
3. 或点击"💬 分享到微信"/"🔴 分享到微博"分享视频

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

- 作者：dakerclaw
- GitHub：[https://github.com/dakerclaw](https://github.com/dakerclaw)
- 问题反馈：[https://github.com/dakerclaw/videoflow/issues](https://github.com/dakerclaw/videoflow/issues)

---

## 🙏 致谢

感谢所有为本项目做出贡献的开发者！

---

<div align="center">
Made with ❤️ by dakerclaw
</div>
