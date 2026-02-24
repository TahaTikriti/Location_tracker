// Example using Express.js
const express = require("express");
const cors = require("cors");
const http = require("http");
const setupWebSocket = require("./websocket");

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json()); // Middleware to parse JSON bodies

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const locationRoutes = require("./routes/location.route");

// Use the imported routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/location", locationRoutes);

// Setup WebSocket
setupWebSocket(server);

// Example defining a route in Express
app.get("/", (req, res) => {
  res.send("<h1>Hello, Express.js Server!</h1>");
});

// ── Persist data to JSON files every 5 seconds ──────────────────────────────
const fs = require("fs");
const path = require("path");
const users = require("./data/users");
const userLocations = require("./data/locations");
const { encryptUserLocations } = require("./utils/encryptUtil");

setInterval(() => {
  fs.writeFileSync(
    path.join(__dirname, "data", "db", "users.json"),
    JSON.stringify(users, null, 2),
  );
  fs.writeFileSync(
    path.join(__dirname, "data", "db", "locations.json"),
    JSON.stringify(encryptUserLocations(userLocations), null, 2),
  );
}, 5000);
// ─────────────────────────────────────────────────────────────────────────────

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`WebSocket available on ws://localhost:${port}`);
});
