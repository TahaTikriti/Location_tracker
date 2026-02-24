// User data storage
// Structure: { id, email, password, name, createdAt }
const fs = require("fs");
const path = require("path");
const FILE = path.join(__dirname, "db", "users.json");

// Load persisted users on startup, fall back to empty array
let users = [];
if (fs.existsSync(FILE)) {
  try {
    const raw = fs.readFileSync(FILE, "utf8").replace(/^\uFEFF/, ""); // Remove BOM
    users = JSON.parse(raw);
  } catch (e) {
    console.warn("Failed to load users.json, starting fresh:", e.message);
  }
}

module.exports = users;
