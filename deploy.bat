@echo off
REM CMMS Docker 部署脚本
echo ========================================
echo CMMS 系统部署
echo ========================================
echo.

REM 检查Docker是否运行
docker --version >nul 2>&1
if errorlevel 1 (
    echo [错误] Docker未安装或未启动
    pause
    exit /b 1
)

echo [1/5] 启动Docker容器...
docker-compose up -d

echo.
echo [2/5] 等待MySQL启动...
timeout /t 10 /nobreak >nul

echo [3/5] 检查容器状态...
docker-compose ps

echo.
echo [4/5] 显示访问信息...
echo ========================================
echo 系统已启动！
echo.
echo 访问地址：
echo   后端API: http://localhost/api
echo   Agent服务: http://localhost:8001/health
echo   前端页面: 请参考前端部署文档
echo.
echo 数据库信息：
echo   主机: localhost:3306
echo   数据库: cmms_db
echo   用户: cmms_user
echo   密码: cmms_pass
echo.
echo 测试账号：
echo   管理员: admin / 123456
echo ========================================

echo.
echo [5/5] 查看日志（可选）...
echo 如需查看日志，请执行: docker-compose logs -f
echo.

pause
