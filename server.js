const http = require("http");
const fs = require("fs").promises;
const path = require("path");
const { URL } = require("url");
const storage = require("./fileStorage");

const PORT = process.env.PORT || 5000;

// Consistent API response shape
function successResponse(data) {
  return JSON.stringify({ success: true, data });
}
function errorResponse(message) {
  return JSON.stringify({ success: false, error: message });
}

// Basic id generator (no external libs)
function genId() {
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(
    36
  )}`;
}

// Validate item fields
function validateItemPayload(payload, forUpdate = false) {
  if (typeof payload !== "object" || payload === null) {
    return "Payload must be a JSON object";
  }
  const allowedSizes = ["s", "m", "l"];
  if (!forUpdate) {
    // create: require name, price, size
    if (!payload.name || typeof payload.name !== "string")
      return "Name is required and must be a string";
    if (payload.price === undefined || typeof payload.price !== "number")
      return "Price is required and must be a number";
    if (!payload.size || !allowedSizes.includes(payload.size))
      return `Size is required and must be one of ${allowedSizes.join(",")}`;
  } else {
    // update: if provided, fields must be valid types
    if (payload.name !== undefined && typeof payload.name !== "string")
      return "Name must be a string";
    if (payload.price !== undefined && typeof payload.price !== "number")
      return "Price must be a number";
    if (payload.size !== undefined && !allowedSizes.includes(payload.size))
      return `Size must be one of ${allowedSizes.join(",")}`;
  }
  return null;
}

// Read request JSON body
async function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1e7) {
        reject(new Error("Payload too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!body) return resolve(null);
      try {
        const json = JSON.parse(body);
        resolve(json);
      } catch (err) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", (err) => reject(err));
  });
}

async function serveStaticHtml(res, filename, status = 200) {
  try {
    const filePath = path.join(__dirname, filename);
    const content = await fs.readFile(filePath, "utf8");
    res.writeHead(status, { "Content-Type": "text/html; charset=utf-8" });
    res.end(content);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(errorResponse("Server error reading static file"));
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    // Static HTML handling
    if (pathname === "/" || pathname === "/index.html") {
      return await serveStaticHtml(res, "index.html", 200);
    }
    if (pathname.endsWith(".html")) {
      // Any other .html -> 404 page
      return await serveStaticHtml(res, "404.html", 404);
    }

    // API routing: /api/items and /api/items/:id
    if (pathname.startsWith("/api/items")) {
      const parts = pathname.split("/").filter(Boolean); // e.g. ['api','items'] or ['api','items','<id>']
      // Accept CORS preflight
      if (req.method === "OPTIONS") {
        res.writeHead(204, {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        });
        return res.end();
      }

      // Set basic CORS headers for API responses
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Content-Type", "application/json; charset=utf-8");

      // GET /api/items  => list all
      if (parts.length === 2 && req.method === "GET") {
        const items = await storage.readAll();
        res.writeHead(200);
        return res.end(successResponse(items));
      }

      // POST /api/items => create
      if (parts.length === 2 && req.method === "POST") {
        let payload;
        try {
          payload = await readJsonBody(req);
        } catch (err) {
          res.writeHead(400);
          return res.end(errorResponse(err.message));
        }
        const v = validateItemPayload(payload, false);
        if (v) {
          res.writeHead(400);
          return res.end(errorResponse(v));
        }
        const items = await storage.readAll();
        const newItem = {
          id: genId(),
          name: payload.name,
          price: payload.price,
          size: payload.size, // 's'|'m'|'l'
        };
        items.push(newItem);
        await storage.writeAll(items);
        res.writeHead(201);
        return res.end(successResponse(newItem));
      }

      // GET /api/items/:id => get one
      if (parts.length === 3 && req.method === "GET") {
        const id = parts[2];
        const items = await storage.readAll();
        const found = items.find((it) => it.id === id);
        if (!found) {
          res.writeHead(404);
          return res.end(errorResponse("Item not found"));
        }
        res.writeHead(200);
        return res.end(successResponse(found));
      }

      // PUT /api/items/:id => update
      if (parts.length === 3 && req.method === "PUT") {
        const id = parts[2];
        let payload;
        try {
          payload = await readJsonBody(req);
        } catch (err) {
          res.writeHead(400);
          return res.end(errorResponse(err.message));
        }
        const v = validateItemPayload(payload, true);
        if (v) {
          res.writeHead(400);
          return res.end(errorResponse(v));
        }
        const items = await storage.readAll();
        const idx = items.findIndex((it) => it.id === id);
        if (idx === -1) {
          res.writeHead(404);
          return res.end(errorResponse("Item not found"));
        }
        const item = items[idx];
        // update allowed fields
        if (payload.name !== undefined) item.name = payload.name;
        if (payload.price !== undefined) item.price = payload.price;
        if (payload.size !== undefined) item.size = payload.size;
        items[idx] = item;
        await storage.writeAll(items);
        res.writeHead(200);
        return res.end(successResponse(item));
      }

      // DELETE /api/items/:id => delete
      if (parts.length === 3 && req.method === "DELETE") {
        const id = parts[2];
        const items = await storage.readAll();
        const idx = items.findIndex((it) => it.id === id);
        if (idx === -1) {
          res.writeHead(404);
          return res.end(errorResponse("Item not found"));
        }
        const removed = items.splice(idx, 1)[0];
        await storage.writeAll(items);
        res.writeHead(200);
        return res.end(successResponse(removed));
      }

      // If method not allowed on this route
      res.writeHead(405);
      return res.end(errorResponse("Method not allowed"));
    }

    // For anything else: 404 JSON
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(errorResponse("Not found"));
  } catch (err) {
    console.error("Unhandled server error:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(errorResponse("Internal server error"));
  }
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
