# 使用 Node.js 18 Alpine 作为基础镜像（轻量级）
FROM node:18-alpine

# 安装 ffmpeg（用于生成视频缩略图）
RUN apk add --no-cache ffmpeg

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3291

# 先复制 package.json（利用 Docker 缓存层）
COPY package.json ./
COPY package-lock.json* ./

# 安装生产依赖
RUN npm install --omit=dev && npm cache clean --force

# 复制项目所有文件
COPY . .

# 创建运行时需要的目录
RUN mkdir -p /app/data /app/uploads/videos /app/uploads/thumbnails

# 暴露端口
EXPOSE 3291

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3291/api/config', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# 启动服务
CMD ["node", "server.js"]
