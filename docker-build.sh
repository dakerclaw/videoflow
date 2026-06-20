#!/bin/bash
# Docker 构建和运行脚本

echo "🚀 开始构建 Videoflow Docker 镜像..."

# 确保在正确的目录
cd "$(dirname "$0")"

# 显示当前目录和文件
echo "📁 当前目录: $(pwd)"
echo "📄 检查必要文件:"
ls -la package.json Dockerfile docker-compose.yml 2>&1

# 停止旧容器
echo "🛑 停止旧容器..."
docker-compose down 2>/dev/null

# 清理旧镜像（可选）
echo "🧹 清理旧镜像..."
docker rmi videoflow-videoflow 2>/dev/null

# 重新构建（不使用缓存）
echo "🔨 开始构建..."
docker-compose build --no-cache

# 启动容器
echo "▶️ 启动容器..."
docker-compose up -d

# 显示容器状态
echo "📊 容器状态:"
docker-compose ps

# 显示日志
echo "📋 容器日志:"
docker-compose logs -f
