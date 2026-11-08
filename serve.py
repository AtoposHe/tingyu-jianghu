"""Start a localhost-only development server and open the game."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse
import threading
import webbrowser

parser = argparse.ArgumentParser(description='听雨江湖本地原型')
parser.add_argument('--port', type=int, default=8765)
parser.add_argument('--no-open', action='store_true')
args = parser.parse_args()
root = Path(__file__).resolve().parent
class DevelopmentHandler(SimpleHTTPRequestHandler):
    """Always re-read local assets while the prototype is being edited."""
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

try:
    server = ThreadingHTTPServer(('127.0.0.1', args.port), partial(DevelopmentHandler, directory=str(root)))
except OSError:
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(DevelopmentHandler, directory=str(root)))
url = f'http://127.0.0.1:{server.server_port}'
print(f'听雨江湖已启动：{url}\n按 Ctrl+C 停止服务。', flush=True)
if not args.no_open:
    threading.Timer(.3, lambda: webbrowser.open(url)).start()
try:
    server.serve_forever()
except KeyboardInterrupt:
    pass
finally:
    server.server_close()
