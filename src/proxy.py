#!/usr/bin/env python3
"""Standalone YouTube TV proxy, bundled inside the patched youtube.leanback.v4.

The patched libcobalt.so loads http://127.0.0.1:8080 instead of
https://www.youtube.com/tv. This proxy fetches the real YouTube TV web client,
injects the SponsorBlock-style userscript into the HTML, and streams everything
else straight through. No external infra: it ships inside the app package.

Usage:  proxy.py [path-to/sponsorblock.user.js]
"""
import http.server
import socketserver
import ssl
import sys
import urllib.request

UPSTREAM = "https://www.youtube.com"
SCRIPT   = "http://127.0.0.1:8080/sponsorblock.user.js"
INJECT   = '<script src="%s"></script>' % SCRIPT
CTX      = ssl._create_unverified_context()


class Handler(http.server.BaseHTTPRequestHandler):
    def _serve(self, method):
        if self.path == "/sponsorblock.user.js":
            try:
                body = open(SB_PATH, "rb").read()
            except Exception as e:
                self.send_error(404, str(e))
                return
            self.send_response(200)
            self.send_header("Content-Type", "application/javascript")
            self.send_header("Content-Length", len(body))
            self.end_headers()
            self.wfile.write(body)
            return

        url = UPSTREAM + self.path
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        try:
            r = urllib.request.urlopen(req, context=CTX, timeout=30)
        except Exception as e:
            self.send_error(502, "upstream error: %s" % e)
            return
        data = r.read()
        ctype = r.headers.get("Content-Type", "")
        if "text/html" in ctype:
            data = data.replace(b"</head>", INJECT.encode() + b"</head>", 1)
        self.send_response(200)
        if "Content-Type" in r.headers:
            self.send_header("Content-Type", r.headers["Content-Type"])
        self.send_header("Content-Length", len(data))
        self.end_headers()
        self.wfile.write(data)

    do_GET = _serve
    do_POST = _serve

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    SB_PATH = sys.argv[1] if len(sys.argv) > 1 else \
        "/home/rex/lgtv-toolkit/youtubemod/sponsorblock.user.js"
    socketserver.TCPServer.allow_reuse_address = True
    print("[proxy] serving youtube.com/tv via 127.0.0.1:8080")
    http.server.HTTPServer(("127.0.0.1", 8080), Handler).serve_forever()
