@echo off
echo ================================
echo Videoflow 重新部署脚本
echo ================================
echo.

echo [1/4] 停止旧容器...
docker compose down

echo.
echo [2/4] 删除旧镜像...
docker compose down --rmi all

echo.
echo [3/4] 重新构建镜像...
docker compose build --no-cache

echo.
echo [4/4] 启动新容器...
docker compose up -d

echo.
echo ================================
echo 部署完成！
echo ================================
echo.
echo 查看容器状态: docker compose ps
echo 查看日志: docker compose logs -f
echo 访问网站: http://localhost:3291
echo.
pause
