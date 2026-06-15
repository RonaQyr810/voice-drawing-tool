@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo   AI 语音绘图工具 - 启动
echo ========================================
echo.

:: 清理 8080-8090 端口上的旧服务
for /L %%p in (8080,1,8090) do (
  for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%%p" ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
  )
)

timeout /t 1 /nobreak >nul

echo 正在启动服务器...
start "语音绘图服务器" /min python server.py 8080

:: 等待服务器就绪
set /a count=0
:waitloop
set /a count+=1
if %count% gtr 15 goto fail

for /f "usebackq delims=" %%p in (".server-port") do set PORT=%%p
if not defined PORT set PORT=8080

python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:%PORT%/', timeout=2)" >nul 2>&1
if errorlevel 1 (
  timeout /t 1 /nobreak >nul
  goto waitloop
)

for /f "usebackq delims=" %%p in (".server-port") do set PORT=%%p
echo.
echo 服务器已启动: http://127.0.0.1:%PORT%
echo 正在打开浏览器...
start "" "http://127.0.0.1:%PORT%"
echo.
echo 提示: 关闭名为「语音绘图服务器」的窗口后网站会停止
echo.
pause
exit /b 0

:fail
echo.
echo 启动失败，尝试直接打开本地文件...
start "" "%~dp0index.html"
echo 已用备用方式打开 index.html
echo 注意: 备用方式下语音识别可能不可用，请优先使用服务器方式
pause
