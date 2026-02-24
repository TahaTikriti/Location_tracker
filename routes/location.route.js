const authMiddleware = require("../middleware/auth.middleware");
const userLocations = require("../data/locations");
const generateLocation = require("../utils/generateLocation");
const express = require("express");
const router = express.Router();

// 1. Initialize location - Creates first location for user
router.get("/initialize", authMiddleware, (req, res) => {
  const userId = req.user.id;
  const location = generateLocation(); // Random location

  // Save user's first location
  userLocations[userId] = {
    currentLocation: location,
    lastUpdate: new Date(),
    isSharingEnabled: false, // Sharing OFF by default
    allowedUsers: [], // Empty list at start
    history: [{ location, timestamp: new Date() }],
  };

  res.json({ location, message: "Location started" });
});

// 2. Generate mock location - Helper to get new mock GPS coordinates
router.get("/generate", authMiddleware, (req, res) => {
  const userId = req.user.id;

  if (!userLocations[userId]) {
    return res
      .status(404)
      .json({ message: "Call /initialize first to start tracking" });
  }

  // Generate new nearby location (simulating movement within 10km)
  const newLocation = generateLocation({
    origin: userLocations[userId].currentLocation,
    radius: 10,
    isMetric: true,
  });

  res.json({
    location: newLocation,
    message: "Generated mock location. Send this to /update endpoint",
  });
});

// 3. Update location - Client sends their location data here
router.post("/update", authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { location } = req.body;

  if (!userLocations[userId]) {
    return res
      .status(404)
      .json({ message: "Call /initialize first to start tracking" });
  }

  if (!location || !Array.isArray(location) || location.length !== 2) {
    return res
      .status(400)
      .json({ message: "Invalid location. Send [latitude, longitude]" });
  }

  // Save the location sent by client
  userLocations[userId].currentLocation = location;
  userLocations[userId].lastUpdate = new Date();
  userLocations[userId].history.push({
    location,
    timestamp: new Date(),
  });

  res.json({
    message: "Location updated",
    location,
    isSharing: userLocations[userId].isSharingEnabled,
  });
});

// 4. Get current location - Just returns your current location (no update)
router.get("/current", authMiddleware, (req, res) => {
  const userId = req.user.id;

  if (!userLocations[userId]) {
    return res
      .status(404)
      .json({ message: "Call /initialize first to start tracking" });
  }

  res.json({
    location: userLocations[userId].currentLocation,
    lastUpdate: userLocations[userId].lastUpdate,
    isSharing: userLocations[userId].isSharingEnabled,
  });
});

// 5. Start sharing - Turn ON location sharing
router.post("/sharing/start", authMiddleware, (req, res) => {
  const userId = req.user.id;

  if (!userLocations[userId]) {
    return res.status(404).json({ message: "Call /initialize first" });
  }

  userLocations[userId].isSharingEnabled = true;
  res.json({ message: "Sharing started", isSharing: true });
});

// 6. Stop sharing - Turn OFF location sharing
router.post("/sharing/stop", authMiddleware, (req, res) => {
  const userId = req.user.id;

  if (!userLocations[userId]) {
    return res.status(404).json({ message: "No location found" });
  }

  userLocations[userId].isSharingEnabled = false;
  res.json({ message: "Sharing stopped", isSharing: false });
});

// 7. Allow user to see your location
router.post("/sharing/allow/:userId", authMiddleware, (req, res) => {
  const myId = req.user.id;
  const allowUserId = parseInt(req.params.userId);

  if (!userLocations[myId]) {
    return res.status(404).json({ message: "Call /initialize first" });
  }

  // Add user to allowed list
  if (!userLocations[myId].allowedUsers.includes(allowUserId)) {
    userLocations[myId].allowedUsers.push(allowUserId);
  }

  res.json({
    message: `User ${allowUserId} can now see your location`,
    allowedUsers: userLocations[myId].allowedUsers,
  });
});

// 8. Stop allowing user to see your location
router.post("/sharing/remove/:userId", authMiddleware, (req, res) => {
  const myId = req.user.id;
  const removeUserId = parseInt(req.params.userId);

  if (!userLocations[myId]) {
    return res.status(404).json({ message: "No location found" });
  }

  // Remove user from allowed list
  userLocations[myId].allowedUsers = userLocations[myId].allowedUsers.filter(
    (id) => id !== removeUserId,
  );

  res.json({
    message: `User ${removeUserId} removed`,
    allowedUsers: userLocations[myId].allowedUsers,
  });
});

// 9. Get locations shared with you - See other users' locations
router.get("/shared", authMiddleware, (req, res) => {
  const myId = req.user.id;
  const sharedLocations = [];

  // Loop through all users
  for (const userId in userLocations) {
    const user = userLocations[userId];
    const userIdNum = parseInt(userId);

    // Check if user is sharing AND I'm in their allowed list
    if (
      userIdNum !== myId &&
      user.isSharingEnabled &&
      user.allowedUsers.includes(myId)
    ) {
      sharedLocations.push({
        userId: userIdNum,
        location: user.currentLocation,
        lastUpdate: user.lastUpdate,
      });
    }
  }

  res.json({ locations: sharedLocations });
});

module.exports = router;
