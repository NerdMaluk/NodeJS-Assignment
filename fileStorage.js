const fs = require("fs").promises;
const path = require("path");

const DATA_FILE = path.join(__dirname, "items.json");

async function ensureFile() {
  try {
    await fs.access(DATA_FILE);
  } catch (err) {
    // create with empty array if missing
    await fs.writeFile(DATA_FILE, "[]", "utf8");
  }
}

async function readAll() {
  await ensureFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) throw new Error("Data file corrupted");
    return data;
  } catch (err) {
    // if file corrupted, reset to empty array
    await fs.writeFile(DATA_FILE, "[]", "utf8");
    return [];
  }
}

async function writeAll(items) {
  await fs.writeFile(DATA_FILE, JSON.stringify(items, null, 2), "utf8");
}

module.exports = {
  readAll,
  writeAll,
};
