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

const port = process.env.PORT || 3000; // You can use environment variables for port configuration
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`WebSocket available on ws://localhost:${port}`);
});
