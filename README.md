# Location Tracker - Simple Version

## What This Does

A basic location tracking system where:
- Users can register and login
- Users can change their name
- Users can track their location (simulated)
- Users can share location with specific people only
- Users can stop sharing anytime
- Live updates happen every 20 seconds via WebSocket

## Files Structure

```
data/
  users.js        → Stores all registered users
  locations.js    → Stores location data for each user

routes/
  auth.routes.js  → Register and login
  user.routes.js  → Profile, change name, change password
  location.route.js → Location tracking and sharing

websocket.js      → Live location updates
server.js         → Main server file
```

## How It Works

### 1. **Users** (data/users.js)
Stores: id, email, password, name

### 2. **Locations** (data/locations.js)
For each user:
- currentLocation: [latitude, longitude]
- isSharingEnabled: true/false
- allowedUsers: [list of user IDs who can see my location]
- history: all past locations

### 3. **Location Update Flow** (KEY CHANGE)
**Clients send their location to the server:**

```
┌─────────┐                                  ┌────────┐
│ Client  │                                  │ Server │
└────┬────┘                                  └───┬────┘
     │                                           │
     │  1. GET /location/generate               │
     │─────────────────────────────────────────>│
     │                                           │
     │  Returns: [lat, lng]                     │
     │<─────────────────────────────────────────│
     │                                           │
     │  2. POST /location/update                │
     │     body: { location: [lat, lng] }       │
     │─────────────────────────────────────────>│
     │                                           │
     │  Saves location, returns success         │
     │<─────────────────────────────────────────│
     │                                           │
```

### 4. **Important Rules**
- You only see locations of users who:
  1. Turned ON sharing (isSharingEnabled = true)
  2. AND added you to their allowed list
- You can stop sharing anytime

## API Summary

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Get token

### User Profile
- `GET /api/users/profile` - View my profile
- `PUT /api/users/profile` - Change my name
- `PUT /api/users/password` - Change password
- `GET /api/users/list` - See all users

### Location (9 endpoints)
1. `GET /api/location/initialize` - Start tracking (creates first random location)
2. `GET /api/location/generate` - Get mock location to send (helper for testing)
3. `POST /api/location/update` - **Send your location data here** (client transmits location)
4. `GET /api/location/current` - View your current location
5. `POST /api/location/sharing/start` - Turn ON sharing
6. `POST /api/location/sharing/stop` - Turn OFF sharing
7. `POST /api/location/sharing/allow/:userId` - Let someone see my location
8. `POST /api/location/sharing/remove/:userId` - Remove someone
9. `GET /api/location/shared` - See locations shared with me

### WebSocket (Live Updates)
Connect, authenticate, then send location every 20 seconds:
```javascript
ws.send(JSON.stringify({
  type: 'update_location',
  location: [latitude, longitude]
}));
```

## Quick Test

```bash
# 1. Install
npm install

# 2. Start server
node server.js

# 3. Test with curl or Postman:

# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user1@test.com","password":"pass123","name":"Alice"}'

# Login (get token)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user1@test.com","password":"pass123"}'

# Initialize location (use token from login)
curl http://localhost:3000/api/location/initialize \
  -H "Authorization: Bearer YOUR_TOKEN"

# Generate mock location
curl http://localhost:3000/api/location/generate \
  -H "Authorization: Bearer YOUR_TOKEN"

# Update location (send location data)
curl -X POST http://localhost:3000/api/location/update \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"location": [40.7128, -74.0060]}'

# Start sharing
curl -X POST http://localhost:3000/api/location/sharing/start \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Code Explanation

### Location Routes (location.route.js)
```javascript
// 1. Initialize - Create first location
router.get("/initialize", ...)
  → Creates random location for user
  → Sets isSharingEnabled = false
  → Empty allowedUsers list

// 2. Generate - Helper to get mock location
router.get("/generate", ...)
  → Generates new mock location near current position
  → Client can use this for testing without real GPS
  → Returns location [lat, lng] to send to /update

// 3. Update - Client sends location here
router.post("/update", ...)
  → Accepts location from request body
  → Can be mock location from /generate
  → Or real GPS from device later
  → Saves to database and history

// 4. Current - Get current location
router.get("/current", ...)
  → Just returns the current saved location
  → Does not update anything

// 5. Start Sharing
router.post("/sharing/start", ...)
  → Sets isSharingEnabled = true

// 6. Stop Sharing
router.post("/sharing/stop", ...)
  → Sets isSharingEnabled = false

// 7. Allow User
router.post("/sharing/allow/:userId", ...)
  → Adds userId to allowedUsers array

// 8. Remove User
router.post("/sharing/remove/:userId", ...)
  → Removes userId from allowedUsers array

// 9. Get Shared
router.get("/shared", ...)
  → Loops through all users
  → Returns those who:
    - Have isSharingEnabled = true
    - AND my ID is in their allowedUsers
```

### WebSocket (websocket.js)
```javascript
// 3 message types:

// 1. "auth" - Login to WebSocket
//    → Verifies JWT token
//    → Saves userId to connection

// 2. "update_location" - Send new location
//    → Saves location
//    → Sends to allowed users only

// 3. "get_shared" - Get shared locations
//    → Returns locations of users who allowed me
```

## That's It!

The code is now simple and straightforward. Each route does one thing clearly. Check API_DOCS.md for examples with actual code.

---

## 🔄 Key Implementation Detail

**Clients transmit their location to the server** (not server-generated internally):

✅ **For Testing**: Call `/generate` → get mock location → send to `/update`  
✅ **For Production**: Get real GPS from device → send to `/update`

This design keeps the mock location system for testing, but allows clients to send location data (meeting the API endpoint requirement). Easy to switch to real GPS later!

