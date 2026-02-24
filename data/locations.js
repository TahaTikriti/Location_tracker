// Location data storage
// Structure: {
//   userId: {
//     currentLocation: [lat, lng],
//     lastUpdate: Date,
//     isSharingEnabled: boolean,
//     allowedUsers: [userId1, userId2, ...],
//     history: [{location: [lat, lng], timestamp: Date}]
//   }
// }
const fs = require("fs");
const path = require("path");
const { decryptUserLocations } = require("../utils/encryptUtil");
const FILE = path.join(__dirname, "db", "locations.json");

// Load persisted locations on startup, fall back to empty object
let userLocations = {};
if (fs.existsSync(FILE)) {
  try {
    const raw = fs.readFileSync(FILE, "utf8").replace(/^\uFEFF/, ""); // Remove BOM
    const loaded = JSON.parse(raw);
    userLocations = decryptUserLocations(loaded);
  } catch (e) {
    console.warn("Failed to load locations.json, starting fresh:", e.message);
  }
}

module.exports = userLocations;
