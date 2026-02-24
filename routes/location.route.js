const authMiddleware = require("../middleware/auth.middleware");
const userLocations = require("../data/locations");
const generateLocation = require("../utils/generateLocation");
const users = require("../data/users");
const express = require("express");
const router = express.Router();

// Helper: auto-initialize location entry for user if not yet exists
function ensureUserLocation(userId) {
  if (!userLocations[userId]) {
    const location = generateLocation();
    userLocations[userId] = {
      currentLocation: location,
      lastUpdate: new Date(),
      isSharingEnabled: false,
      allowedUsers: [],
      history: [{ location, timestamp: new Date() }],
    };
  }
}

// 1. Update location - Accepts { location: [lat, lng] } from client.
//    If no location is sent, generates a mock GPS coordinate automatically.
//    Auto-initializes tracking for the user on first call.
router.post("/update", authMiddleware, (req, res) => {
  const userId = req.user.id;
  ensureUserLocation(userId);

  let location = req.body.location;

  // No location sent -> generate a nearby mock coordinate
  if (!location) {
    location = generateLocation({
      origin: userLocations[userId].currentLocation,
      radius: 5,
      isMetric: true,
    });
  }

  if (!Array.isArray(location) || location.length !== 2) {
    return res
      .status(400)
      .json({ message: "Send location as [latitude, longitude]" });
  }

  userLocations[userId].currentLocation = location;
  userLocations[userId].lastUpdate = new Date();
  userLocations[userId].history.push({ location, timestamp: new Date() });

  res.json({
    message: "Location updated",
    location,
    isSharing: userLocations[userId].isSharingEnabled,
  });
});

// 2. Get my current location
router.get("/current", authMiddleware, (req, res) => {
  const userId = req.user.id;
  ensureUserLocation(userId);

  res.json({
    location: userLocations[userId].currentLocation,
    lastUpdate: userLocations[userId].lastUpdate,
    isSharing: userLocations[userId].isSharingEnabled,
    allowedUsers: userLocations[userId].allowedUsers,
  });
});

// 3. Start sharing location
router.post("/sharing/start", authMiddleware, (req, res) => {
  const userId = req.user.id;
  ensureUserLocation(userId);

  userLocations[userId].isSharingEnabled = true;
  res.json({ message: "Sharing started", isSharing: true });
});

// 4. Stop sharing location
router.post("/sharing/stop", authMiddleware, (req, res) => {
  const userId = req.user.id;
  ensureUserLocation(userId);

  userLocations[userId].isSharingEnabled = false;
  res.json({ message: "Sharing stopped", isSharing: false });
});

// 5. Allow a user to see your location - identified by name
router.post("/sharing/allow/:name", authMiddleware, (req, res) => {
  const myId = req.user.id;
  const targetUser = users.find(
    (u) => u.name.toLowerCase() === req.params.name.toLowerCase(),
  );

  if (!targetUser) {
    return res
      .status(404)
      .json({ message: `User "${req.params.name}" not found` });
  }
  if (targetUser.id === myId) {
    return res.status(400).json({ message: "Cannot allow yourself" });
  }

  ensureUserLocation(myId);

  if (!userLocations[myId].allowedUsers.includes(targetUser.id)) {
    userLocations[myId].allowedUsers.push(targetUser.id);
  }

  const allowedNames = userLocations[myId].allowedUsers.map((id) => {
    const u = users.find((u) => u.id === id);
    return u ? u.name : id;
  });

  res.json({
    message: `${targetUser.name} can now see your location`,
    allowedUsers: allowedNames,
  });
});

// 6. Remove a user from your allowed list - identified by name
router.post("/sharing/remove/:name", authMiddleware, (req, res) => {
  const myId = req.user.id;
  const targetUser = users.find(
    (u) => u.name.toLowerCase() === req.params.name.toLowerCase(),
  );

  if (!targetUser) {
    return res
      .status(404)
      .json({ message: `User "${req.params.name}" not found` });
  }

  ensureUserLocation(myId);

  userLocations[myId].allowedUsers = userLocations[myId].allowedUsers.filter(
    (id) => id !== targetUser.id,
  );

  const allowedNames = userLocations[myId].allowedUsers.map((id) => {
    const u = users.find((u) => u.id === id);
    return u ? u.name : id;
  });

  res.json({
    message: `${targetUser.name} removed`,
    allowedUsers: allowedNames,
  });
});

// 7. Get all locations being shared with you (with user names)
router.get("/shared", authMiddleware, (req, res) => {
  const myId = req.user.id;
  const sharedLocations = [];

  for (const userId in userLocations) {
    const entry = userLocations[userId];
    const userIdNum = parseInt(userId);

    if (
      userIdNum !== myId &&
      entry.isSharingEnabled &&
      entry.allowedUsers.includes(myId)
    ) {
      const user = users.find((u) => u.id === userIdNum);
      sharedLocations.push({
        userId: userIdNum,
        userName: user ? user.name : "Unknown",
        location: entry.currentLocation,
        lastUpdate: entry.lastUpdate,
      });
    }
  }

  res.json({ locations: sharedLocations });
});

module.exports = router;
