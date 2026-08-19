// Node proxy for the patched youtube.leanback.v4 (standalone, bundled as a service).
// Cobalt (patched libcobalt.so) loads http://127.0.0.1:8080 instead of
// https://www.youtube.com/tv. This fetches the real YouTube TV web client,
// injects sponsorblock.user.js into the HTML, and streams the rest through.
// Runs natively on webOS (Node is the system service runtime).

const http = require("http");
const https = require("https");
const fs = require("fs");

const UPSTREAM = "https://www.youtube.com";
const SCRIPT = "http://127.0.0.1:8080/sponsorblock.user.js";
const SB_PATH =
  process.argv[2] ||
  "/media/developer/apps/usr/palm/applications/com.rex.youtubetv/sponsorblock.user.js";

function fetchUpstream(url, cb) {
  https
    .get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => cb(null, res, Buffer.concat(chunks)));
    })
    .on("error", (e) => cb(e));
}

const server = http.createServer((req, res) => {
  if (req.url === "/sponsorblock.user.js") {
    fs.readFile(SB_PATH, (e, d) => {
      if (e) { res.writeHead(404); res.end(""); return; }
      res.writeHead(200, { "Content-Type": "application/javascript" });
      res.end(d);
    });
    return;
  }
  fetchUpstream(UPSTREAM + req.url, (err, up, body) => {
    if (err) { res.writeHead(502); res.end(""); return; }
    let data = body;
    const ct = (up.headers["content-type"] || "").toLowerCase();
    if (ct.indexOf("text/html") >= 0) {
      data = Buffer.from(
        data.toString("utf8").replace("</head>", '<script src="' + SCRIPT + '"></script></head>')
      );
    }
    res.writeHead(200, {
      "Content-Type": up.headers["content-type"] || "application/octet-stream",
      "Content-Length": data.length,
    });
    res.end(data);
  });
});

server.listen(8080, "127.0.0.1", () => {
  console.log("[proxy] youtube.com/tv mirrored on 127.0.0.1:8080");
});
