const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const userLocations = require("./data/locations");
const users = require("./data/users");
const generateLocation = require("./utils/generateLocation");

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

// Setup WebSocket for live location tracking
function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on("connection", (ws) => {
    console.log("New user connected to WebSocket");

    // 1. When user sends message
    ws.on("message", (message) => {
      const data = JSON.parse(message);

      // STEP 1: Authenticate user first
      if (data.type === "auth") {
        try {
          const decoded = jwt.verify(data.token, "123");
          ws.userId = decoded.id; // Save user ID to this connection
          ws.send(
            JSON.stringify({ type: "auth_success", message: "Connected" }),
          );
        } catch (error) {
          ws.send(JSON.stringify({ type: "error", message: "Invalid token" }));
          ws.close();
        }
      }

      // STEP 2: Update location (happens every 20 seconds from client)
      if (data.type === "update_location" && ws.userId) {
        const { location } = data;

        // Auto-initialize if needed, then save new location
        ensureUserLocation(ws.userId);
        userLocations[ws.userId].currentLocation = location;
        userLocations[ws.userId].lastUpdate = new Date();
        userLocations[ws.userId].history.push({
          location,
          timestamp: new Date(),
        });

        // Broadcast to allowed users who are connected
        sendLocationToAllowedUsers(wss, ws.userId, location);

        ws.send(
          JSON.stringify({
            type: "location_saved",
            location,
            message: "Updated",
          }),
        );
      }

      // STEP 3: Request shared locations
      if (data.type === "get_shared" && ws.userId) {
        const sharedLocations = getSharedLocations(ws.userId);
        ws.send(
          JSON.stringify({
            type: "shared_locations",
            locations: sharedLocations,
          }),
        );
      }
    });

    ws.on("close", () => {
      console.log("User disconnected from WebSocket");
    });
  });

  return wss;
}

// Send location to users who are in allowed list
function sendLocationToAllowedUsers(wss, senderId, location) {
  const sender = userLocations[senderId];

  // Check if sender is sharing
  if (!sender || !sender.isSharingEnabled) {
    return;
  }

  // Send to each allowed user who is connected
  wss.clients.forEach((client) => {
    if (
      client.userId && // Client is authenticated
      client.userId !== senderId && // Not the sender
      sender.allowedUsers.includes(client.userId) && // User is allowed
      client.readyState === WebSocket.OPEN // Connection is open
    ) {
      const senderUser = users.find((u) => u.id === senderId);
      client.send(
        JSON.stringify({
          type: "location_update",
          userId: senderId,
          userName: senderUser ? senderUser.name : "Unknown",
          location: location,
          timestamp: new Date(),
        }),
      );
    }
  });
}

// Get locations shared with this user
function getSharedLocations(myId) {
  const sharedLocations = [];

  for (const userId in userLocations) {
    const user = userLocations[userId];
    const userIdNum = parseInt(userId);

    // Check if user is sharing AND I'm in their allowed list
    if (
      userIdNum !== myId &&
      user.isSharingEnabled &&
      user.allowedUsers.includes(myId)
    ) {
      const u = users.find((u) => u.id === userIdNum);
      sharedLocations.push({
        userId: userIdNum,
        userName: u ? u.name : "Unknown",
        location: user.currentLocation,
        lastUpdate: user.lastUpdate,
      });
    }
  }

  return sharedLocations;
}

module.exports = setupWebSocket;
