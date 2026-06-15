@echo off
chcp 65001 >nul
setlocal

set "GIT=C:\Program Files\Git\bin\git.exe"
set "REPO=https://github.com/RonaQyr810/voice-drawing-tool.git"

echo ========================================
echo  AI 语音绘图工具 - 推送并创建 PR
echo ========================================
echo.

cd /d "%~dp0"

"%GIT%" remote get-url origin >nul 2>&1
if errorlevel 1 (
  "%GIT%" remote add origin %REPO%
)

echo [1/3] 推送 main 分支...
"%GIT%" push -u origin main
if errorlevel 1 (
  echo.
  echo 推送失败。请先在 GitHub 创建仓库:
  echo   https://github.com/new
  echo   仓库名: voice-drawing-tool
  echo   不要勾选 "Add a README"
  echo.
  echo 创建后重新运行本脚本。
  pause
  exit /b 1
)

echo.
echo [2/3] 推送 feat/voice-drawing-mvp 分支...
"%GIT%" push -u origin feat/voice-drawing-mvp

echo.
echo [3/3] 打开 PR 创建页面...
start "" "https://github.com/RonaQyr810/voice-drawing-tool/compare/main...feat/voice-drawing-mvp?expand=1"

echo.
echo 请在打开的页面中:
echo   - 标题: feat: AI 语音绘图工具 MVP 初版
echo   - 描述: 复制 PR_BODY.md 中的内容
echo.
pause
