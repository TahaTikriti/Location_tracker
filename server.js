// Example using Express.js
const express = require("express");

app.use(cors());
const authRoutes = require("./routes/auth.routes");
const locationRoutes = require("./routes/location.route");
const app = express();
app.use(express.json()); // Middleware to parse JSON bodies

// Use the imported routes
app.use("/api/auth", authRoutes);
app.use("/api/location", locationRoutes);




// Example defining a route in Express
app.get("/", (req, res) => {
  res.send("<h1>Hello, Express.js Server!</h1>");
});

const port = process.env.PORT || 3000; // You can use environment variables for port configuration
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});