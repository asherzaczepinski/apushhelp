#!/usr/bin/env python3
"""Local dev server for the studier that never caches — so changes always
show on a plain refresh. Run: python3 serve.py  (then open localhost:8642)."""
import functools
import http.server
import socketserver

PORT = 8642


class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


handler = functools.partial(NoCache, directory="studier")
with socketserver.TCPServer(("", PORT), handler) as httpd:
    httpd.allow_reuse_address = True
    print(f"studier at http://localhost:{PORT}  (no-cache; Ctrl-C to stop)")
    httpd.serve_forever()
