@echo off
REM Docker 构建和运行脚本 (Windows)

echo 🚀 开始构建 Videoflow Docker 镜像...

REM 确保在正确的目录
cd /d %~dp0

REM 显示当前目录和文件
echo 📁 当前目录: %CD%
echo 📄 检查必要文件:
dir package.json Dockerfile docker-compose.yml 2>&1

REM 停止旧容器
echo 🛑 停止旧容器...
docker-compose down 2>nul

REM 清理旧镜像（可选）
echo 🧹 清理旧镜像...
docker rmi videoflow-videoflow 2>nul

REM 重新构建（不使用缓存）
echo 🔨 开始构建...
docker-compose build --no-cache

REM 启动容器
echo ▶️ 启动容器...
docker-compose up -d

REM 显示容器状态
echo 📊 容器状态:
docker-compose ps

REM 显示日志
echo 📋 容器日志（按 Ctrl+C 退出日志查看）:
docker-compose logs -f

pause
