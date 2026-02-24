// Location data storage
// Structure: {
//   userId: {
//     currentLocation: [lat, lng],
//     lastUpdate: Date,
//     isSharingEnabled: boolean,
//     allowedUsers: [userId1, userId2, ...],
//     history: [{location: [lat, lng], timestamp: Date}]
//   }
// }
const userLocations = {};

module.exports = userLocations;
