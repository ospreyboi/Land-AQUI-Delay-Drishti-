"""
Local dev server for the dashboard.

    python3 dev-server.py            # serves this folder on http://localhost:8777

Same as `python3 -m http.server 8777`, but sends `Cache-Control: no-store` on
every response so the browser always fetches the current file. Use this while
building - it removes the "I edited a file but the page still shows the old
version" problem (plain http.server lets the browser cache .js/.css).
"""

import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8777


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()


if __name__ == "__main__":
    print(f"Serving http://localhost:{PORT}  (no-cache)  -  Ctrl+C to stop")
    HTTPServer(("", PORT), NoCacheHandler).serve_forever()
