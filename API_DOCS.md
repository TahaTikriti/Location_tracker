# Simple Location Tracker

## Important: How Location Updates Work

**Clients transmit their location data to the server via POST endpoint.**

### Two Modes:

**Testing Mode** (using mock GPS):
```javascript
// 1. Get mock location from server
const res = await fetch('/api/location/generate', { headers: { Authorization: `Bearer ${token}` }});
const { location } = await res.json();

// 2. Send it to update endpoint
await fetch('/api/location/update', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ location })
});
```

**Production Mode** (using real GPS):
```javascript
// 1. Get real GPS from device
navigator.geolocation.getCurrentPosition(async (position) => {
  const location = [position.coords.latitude, position.coords.longitude];
  
  // 2. Send it to update endpoint
  await fetch('/api/location/update', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ location })
  });
});
```

This design allows easy switching from mock to real GPS without changing the server.

---

## What it does
- Users register/login
- Users can change their name and password
- Track location (simulated with random coordinates)
- Share location with specific users only
- Stop sharing anytime
- Live updates every 20 seconds via WebSocket

## Quick Start

```bash
npm install
node server.js
```

---

## 1. Authentication

### Register
`POST /api/auth/register`
```json
{
  "email": "test@example.com",
  "password": "password123",
  "name": "John"
}
```

### Login
`POST /api/auth/login`
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```
Returns: `{ token: "your_jwt_token" }`

**Use this token in all other requests:**
Header: `Authorization: Bearer your_jwt_token`

---

## 2. User Profile

### Get My Profile
`GET /api/users/profile`

### Change My Name
`PUT /api/users/profile`
```json
{
  "name": "New Name"
}
```

### Change Password
`PUT /api/users/password`
```json
{
  "currentPassword": "old_password",
  "newPassword": "new_password"
}
```

### Get All Users (to choose who to share with)
`GET /api/users/list`

---

## 3. Location Tracking

### How It Works Now
**Clients send their location to the server** (you transmit location data via API)

For testing without real GPS:
1. Call `/generate` to get mock location
2. Send that location to `/update`

For production with real GPS:
1. Get GPS from device
2. Send to `/update`

---

### Start Tracking
`GET /api/location/initialize`
Creates your first random location

### Generate Mock Location (Helper for Testing)
`GET /api/location/generate`
Returns a new mock location near your current position

Response:
```json
{
  "location": [40.7128, -74.0060],
  "message": "Generated mock location. Send this to /update endpoint"
}
```

### Update Your Location (Client Sends Location Here)
`POST /api/location/update`

**Body:**
```json
{
  "location": [40.7128, -74.0060]
}
```

Response:
```json
{
  "message": "Location updated",
  "location": [40.7128, -74.0060],
  "isSharing": false
}
```

### Get Current Location (Without Updating)
`GET /api/location/current`

Returns your currently saved location

### Start Sharing
`POST /api/location/sharing/start`
Turn ON sharing

### Stop Sharing
`POST /api/location/sharing/stop`
Turn OFF sharing

### Allow User to See My Location
`POST /api/location/sharing/allow/:userId`
Example: `/api/location/sharing/allow/2` (allow user with ID 2)

### Remove User Access
`POST /api/location/sharing/remove/:userId`
Example: `/api/location/sharing/remove/2`

### See Locations Shared WITH Me
`GET /api/location/shared`
Shows locations of users who allowed you

---

## 4. Live Updates (WebSocket)

### Connect to WebSocket
```javascript
const ws = new WebSocket('ws://localhost:3000');
```

### Step 1: Authenticate
```javascript
ws.send(JSON.stringify({
  type: 'auth',
  token: 'your_jwt_token'
}));
```

### Step 2: Send Location Updates (every 20 seconds)
```javascript
setInterval(() => {
  ws.send(JSON.stringify({
    type: 'update_location',
    location: [latitude, longitude]  // Example: [40.7128, -74.0060]
  }));
}, 20000);  // Every 20 seconds
```

### Step 3: Receive Updates
```javascript
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'auth_success') {
    console.log('Connected!');
  }
  
  if (data.type === 'location_saved') {
    console.log('My location updated:', data.location);
  }
  
  if (data.type === 'location_update') {
    console.log('User', data.userId, 'location:', data.location);
  }
};
```

---

## Complete Flow Example

```javascript
// 1. Register
fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@example.com', password: 'pass123', name: 'John' })
});

// 2. Login
const loginRes = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@example.com', password: 'pass123' })
});
const { token } = await loginRes.json();

// 3. Initialize location
await fetch('/api/location/initialize', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// 4. Update location flow - TWO OPTIONS:

// OPTION A: Using mock location (for testing)
const mockRes = await fetch('/api/location/generate', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { location } = await mockRes.json();

await fetch('/api/location/update', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ location })
});

// OPTION B: Using real GPS (for production)
navigator.geolocation.getCurrentPosition(async (position) => {
  const realLocation = [position.coords.latitude, position.coords.longitude];
  
  await fetch('/api/location/update', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ location: realLocation })
  });
});

// 5. Start sharing
await fetch('/api/location/sharing/start', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});

// 6. Allow user 2 to see my location
await fetch('/api/location/sharing/allow/2', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});

// 7. Connect WebSocket
const ws = new WebSocket('ws://localhost:3000');
ws.onopen = () => {
  ws.send(JSON.stringify({ type: 'auth', token }));
};

// 8. Send location every 20 seconds
setInterval(async () => {
  // Get mock location
  const res = await fetch('/api/location/generate', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const { location } = await res.json();
  
  // Send via WebSocket
  ws.send(JSON.stringify({
    type: 'update_location',
    location
  }));
}, 20000);
```

---

## Data Storage

### Users (data/users.js)
```javascript
{
  id: 1,
  email: "test@example.com",
  password: "hashed_password",
  name: "John",
  createdAt: Date
}
```

### Locations (data/locations.js)
```javascript
{
  userId: {
    currentLocation: [lat, lng],
    lastUpdate: Date,
    isSharingEnabled: false,  // ON/OFF switch
    allowedUsers: [2, 3],     // Who can see my location
    history: [...]
  }
}
```

---

## Key Points

1. **Client Transmits Location**: Clients send location data to server via `POST /api/location/update`

2. **Mock Location Helper**: Use `GET /api/location/generate` to get mock GPS coordinates for testing

3. **Real GPS Ready**: Can easily switch to real GPS by sending device coordinates to `/update`

4. **Privacy**: Users only see locations of people who:
   - Enabled sharing (`isSharingEnabled = true`)
   - AND added them to allowed list

5. **Stop Sharing**: Call `/api/location/sharing/stop` anytime

6. **Live Updates**: WebSocket sends location every 20 seconds

7. **Location Format**: Always send as array: `[latitude, longitude]`

