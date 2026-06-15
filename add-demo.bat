@echo off
chcp 65001 >nul
cd /d "%~dp0"

set "DEST=assets\demo\demo.mp4"
set "SRC="

if exist "assets\demo\demo.mp4" (
  echo 已存在演示视频: assets\demo\demo.mp4
  goto upload
)

if exist "%USERPROFILE%\Desktop\demo演示视频.mp4" set "SRC=%USERPROFILE%\Desktop\demo演示视频.mp4"
if exist "%USERPROFILE%\Desktop\demo.mp4" set "SRC=%USERPROFILE%\Desktop\demo.mp4"
if exist "%USERPROFILE%\Videos" (
  for %%f in ("%USERPROFILE%\Videos\*.mp4") do (
    if not defined SRC set "SRC=%%f"
  )
)

if not defined SRC (
  echo.
  echo 未找到演示视频文件！
  echo.
  echo 请手动操作:
  echo   1. 把你的录屏复制到: %~dp0assets\demo\demo.mp4
  echo   2. 再次运行本脚本
  echo.
  pause
  exit /b 1
)

echo 找到视频: %SRC%
echo 正在复制到 %DEST% ...
copy /Y "%SRC%" "%DEST%"
if errorlevel 1 (
  echo 复制失败
  pause
  exit /b 1
)

:upload
for %%A in ("%DEST%") do set SIZE=%%~zA
echo 视频大小: %SIZE% 字节

set "GIT=C:\Program Files\Git\bin\git.exe"
set GIT_AUTHOR_NAME=RonaQyr810
set GIT_AUTHOR_EMAIL=RonaQyr810@users.noreply.github.com
set GIT_COMMITTER_NAME=RonaQyr810
set GIT_COMMITTER_EMAIL=RonaQyr810@users.noreply.github.com

"%GIT%" lfs install >nul 2>&1
"%GIT%" lfs track "*.mp4" >nul 2>&1
if not exist .gitattributes "%GIT%" add .gitattributes

"%GIT%" add assets\demo\demo.mp4 .gitattributes README.md
"%GIT%" commit -m "docs: 添加演示视频 demo.mp4"
"%GIT%" push origin feat/voice-drawing-mvp

echo.
echo 演示视频已上传！
echo 仓库查看: https://github.com/RonaQyr810/voice-drawing-tool/tree/feat/voice-drawing-mvp/assets/demo
echo.
pause
