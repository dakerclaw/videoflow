FROM node:18-alpine

WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制项目文件
COPY . .

# 创建必要目录
RUN mkdir -p data uploads/videos uploads/thumbnails

# 暴露端口
EXPOSE 3291

# 启动服务
CMD ["node", "server.js"]
