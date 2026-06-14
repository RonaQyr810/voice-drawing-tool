"""本地开发服务器 - 比 python -m http.server 更稳定"""
import http.server
import os
import socket
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
ROOT = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def log_message(self, format, *args):
        print(f"[{self.log_date_time_string()}] {format % args}")

def find_free_port(start=8080):
    for port in range(start, start + 20):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(('127.0.0.1', port))
                return port
            except OSError:
                continue
    return start

if __name__ == '__main__':
    port = find_free_port(PORT)
    os.chdir(ROOT)
    server = http.server.ThreadingHTTPServer(('127.0.0.1', port), Handler)
    print('=' * 50)
    print('  AI 语音绘图工具 - 本地服务器')
    print('=' * 50)
    print(f'  地址: http://127.0.0.1:{port}')
    print(f'  目录: {ROOT}')
    print('  按 Ctrl+C 停止')
    print('=' * 50)
    with open(os.path.join(ROOT, '.server-port'), 'w') as f:
        f.write(str(port))
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n服务器已停止')
        server.server_close()
