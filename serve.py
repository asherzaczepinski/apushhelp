#!/usr/bin/env python3
"""Local dev server for the studier that never caches — so changes always
show on a plain refresh. Also accepts POST /save-redo (from redo.html) and
writes the selected image list to redo_list.json for the assistant to act on.
Run: python3 serve.py  (then open localhost:8642)."""
import functools
import http.server
import os
import socketserver

PORT = 8642
ROOT = os.path.dirname(os.path.abspath(__file__))


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def do_POST(self):
        if self.path == "/save-redo":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)
            with open(os.path.join(ROOT, "redo_list.json"), "wb") as f:
                f.write(body)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"ok":true}')
        else:
            self.send_error(404)


handler = functools.partial(Handler, directory="studier")
with socketserver.TCPServer(("", PORT), handler) as httpd:
    httpd.allow_reuse_address = True
    print(f"studier at http://localhost:{PORT}  (no-cache; Ctrl-C to stop)")
    httpd.serve_forever()
