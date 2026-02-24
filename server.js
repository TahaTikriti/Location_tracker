// Example using Express.js
const express = require("express");
const app = express();

const cors = require("cors");
app.use(cors());
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);
const locationRoutes = require("./routes/locationRoutes");
app.use("/api/locations", locationRoutes);

// Example defining a route in Express
app.get("/", (req, res) => {
  res.send("<h1>Hello, Express.js Server!</h1>");
});

const port = process.env.PORT || 3000; // You can use environment variables for port configuration
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});