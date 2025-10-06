# 🧠 Simple Node.js Web & API Server (No Frameworks)

## 📋 Project Overview

This project demonstrates how to build a **Node.js web server without using any frameworks** (like Express).  
It serves static HTML files and includes a simple **REST API** for managing inventory items, persisted using the **file system** (`items.json`).

---

## 🚀 Features

### 🌐 Web Server

- Serves a simple student page at `/index.html` (or `/`).
- Returns a custom **404 page** for any other `{random}.html` request.

### 📦 Inventory API

- Create, Read, Update, and Delete (CRUD) inventory items.
- Items are persisted in `items.json`.
- Each item includes:
  - `id`: unique identifier (auto-generated)
  - `name`: string
  - `price`: number
  - `size`: small (`s`), medium (`m`), or large (`l`)

### ✅ Other Features

- Consistent JSON response structure for all API endpoints.
- Modular code using a separate storage module (`fileStorage.js`).
- Proper error handling and input validation.
- Lightweight, no external dependencies.

---

## 🗂️ Project Structure

│
├── server.js # Main HTTP server and routing logic
├── fileStorage.js # Handles reading/writing data to items.json
├── items.json # Data file for persisting inventory items
├── index.html # Simple student webpage
└── 404.html # Custom 404 error page

## ⚙️ Setup Instructions

1. **Clone or copy the project files** to a local folder.
2. Ensure you have **Node.js** installed (v12 or later).
3. Open the terminal in the project folder.
4. Run:
   node server.js
   Open your browser and go to:

http://localhost:5000
o

http://localhost:5000/index.html
🌍 Web Routes
Route Description
/ or /index.html Displays the simple student page.
/{random}.html Returns the 404 error page.

To test the 404 page, try visiting:

http://localhost:5000/anything.html
🔗 API Routes
Base URL: http://localhost:5000/api/items

Method Endpoint Description Example Body
GET /api/items Get all items —
POST /api/items Create a new item { "name": "Shirt", "price": 20.5, "size": "m" }
GET /api/items/:id Get one item by ID —
PUT /api/items/:id Update an item { "price": 15.99 }
DELETE /api/items/:id Delete an item —

💬 Response Format
All responses follow this consistent structure:

✅ Success
json
{
"success": true,
"data": { ... }
}
❌ Error
json
{
"success": false,
"error": "Description of the error"
}
🧪 API Usage Examples
Get all items
curl http://localhost:5000/api/items
Create a new item
curl -X POST http://localhost:5000/api/items \
 -H "Content-Type: application/json" \
 -d '{"name":"T-shirt","price":19.99,"size":"m"}'
Get item by ID
curl http://localhost:5000/api/items/<id>
Update an item
curl -X PUT http://localhost:5000/api/items/<id> \
 -H "Content-Type: application/json" \
 -d '{"price":14.99}'
Delete an item
curl -X DELETE http://localhost:5000/api/items/<id>
🧰 Notes
The items.json file is automatically created if missing.

CORS is enabled for development purposes.

Uses only built-in Node.js modules: http, fs, path, and url.
