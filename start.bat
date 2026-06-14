@echo off
echo Starting AI Voice Drawing Tool on http://localhost:8080
echo Please open Chrome or Edge and allow microphone access.
echo Say "开始监听" to start voice control.
python -m http.server 8080
