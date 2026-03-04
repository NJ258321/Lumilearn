@echo off
chcp 65001 >nul
echo ========================================
echo   LumiTrace AI Backend - 启动脚本
echo ========================================
echo.

echo [1/4] 检查 Node.js 环境...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未检测到 Node.js，请先安装 Node.js 18+
    echo    下载地址: https://nodejs.org/
    pause
    exit /b 1
)
node --version
echo ✓ Node.js 环境正常
echo.

echo [2/4] 检查依赖...
if not exist "node_modules\" (
    echo 正在安装依赖...
    call npm install
    if errorlevel 1 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
) else (
    echo ✓ 依赖已安装
)
echo.

echo [3/4] 检查环境变量...
if not exist ".env" (
    echo 正在创建 .env 文件...
    copy .env.example .env >nul
    echo ✓ .env 文件已创建
) else (
    echo ✓ .env 文件已存在
)
echo.

echo [4/4] 初始化数据库...
call npm run prisma:migrate
if errorlevel 1 (
    echo ⚠ 数据库迁移失败，尝试生成 Prisma Client...
    call npm run prisma:generate
)
echo.

echo ========================================
echo   🚀 启动开发服务器...
echo ========================================
echo.
call npm run dev
