const crypto = require('crypto');

// Simple encryption/decryption for location data
// Key: 32 bytes for AES-256, IV: 16 bytes
const KEY = crypto.scryptSync('location-tracker-secret-key', 'salt', 32);
const IV = Buffer.alloc(16, 0); // Fixed IV (for demo; production would randomize)

function encryptLocation(location) {
  if (!location) return location;
  const cipher = crypto.createCipheriv('aes-256-cbc', KEY, IV);
  let encrypted = cipher.update(JSON.stringify(location), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `ENC:${encrypted}`;
}

function decryptLocation(encrypted) {
  if (!encrypted || !encrypted.startsWith('ENC:')) return encrypted;
  try {
    const hex = encrypted.slice(4);
    const decipher = crypto.createDecipheriv('aes-256-cbc', KEY, IV);
    let decrypted = decipher.update(hex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch (e) {
    console.warn('Failed to decrypt location:', e.message);
    return encrypted;
  }
}

// Encrypt location data in userLocations object
function encryptUserLocations(userLocations) {
  const encrypted = {};
  for (const userId in userLocations) {
    const data = userLocations[userId];
    encrypted[userId] = {
      currentLocation: encryptLocation(data.currentLocation),
      lastUpdate: data.lastUpdate,
      isSharingEnabled: data.isSharingEnabled,
      allowedUsers: data.allowedUsers,
      history: data.history.map(h => ({
        location: encryptLocation(h.location),
        timestamp: h.timestamp
      }))
    };
  }
  return encrypted;
}

// Decrypt location data in userLocations object
function decryptUserLocations(userLocations) {
  const decrypted = {};
  for (const userId in userLocations) {
    const data = userLocations[userId];
    decrypted[userId] = {
      currentLocation: decryptLocation(data.currentLocation),
      lastUpdate: data.lastUpdate,
      isSharingEnabled: data.isSharingEnabled,
      allowedUsers: data.allowedUsers,
      history: data.history.map(h => ({
        location: decryptLocation(h.location),
        timestamp: h.timestamp
      }))
    };
  }
  return decrypted;
}

module.exports = { encryptUserLocations, decryptUserLocations };
