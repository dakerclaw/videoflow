#!/bin/bash

# Videoflow Docker 一键安装脚本 (macOS/Linux)

set -e

echo "🚀 Videoflow Docker 安装脚本"
echo "================================"
echo ""

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    echo "访问: https://docs.docker.com/desktop/install/"
    exit 1
fi

# 检查 docker-compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose 未安装"
    echo "安装中..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# 设置项目目录
INSTALL_DIR="$HOME/videoflow"

echo "📁 安装目录: $INSTALL_DIR"
echo ""

# 如果目录存在，询问是否删除
if [ -d "$INSTALL_DIR" ]; then
    echo "⚠️  目录已存在: $INSTALL_DIR"
    read -p "是否删除并重新安装？(y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🗑️  删除旧目录..."
        rm -rf "$INSTALL_DIR"
    else
        echo "❌ 安装已取消"
        exit 1
    fi
fi

# 克隆项目
echo "📥 从 GitHub 克隆项目..."
git clone https://github.com/dakerclaw/videoflow.git "$INSTALL_DIR"

# 进入项目目录
cd "$INSTALL_DIR"

# 检查必要文件
echo "✅ 检查项目文件..."
if [ ! -f "package.json" ]; then
    echo "❌ 错误: package.json 不存在"
    exit 1
fi

if [ ! -f "Dockerfile" ]; then
    echo "❌ 错误: Dockerfile 不存在"
    exit 1
fi

if [ ! -f "docker-compose.yml" ]; then
    echo "❌ 错误: docker-compose.yml 不存在"
    exit 1
fi

# 停止旧容器
echo "🛑 停止旧容器..."
docker-compose down --volumes --remove-orphans 2>/dev/null || true

# 清理旧镜像
echo "🧹 清理旧镜像..."
docker rmi videoflow-videoflow 2>/dev/null || true

# 构建并启动
echo "🔨 构建 Docker 镜像（这可能需要几分钟）..."
docker-compose build --no-cache

echo "▶️  启动容器..."
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 检查容器状态
echo ""
echo "📊 容器状态:"
docker-compose ps

echo ""
echo "📋 容器日志:"
docker-compose logs --tail=20

echo ""
echo "✅ 安装完成！"
echo ""
echo "🌐 访问地址:"
echo "   http://localhost:3291"
echo ""
echo "🔐 默认管理员账号:"
echo "   用户名: dakerclaw"
echo "   密码: daker123"
echo ""
echo "📝 常用命令:"
echo "   查看日志: docker-compose logs -f"
echo "   停止服务: docker-compose down"
echo "   重启服务: docker-compose restart"
echo "   更新代码: git pull && docker-compose up -d --build"
echo ""
