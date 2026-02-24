import faker from "@faker-js/faker";

module.exports = faker.location.nearbyGPSCoordinate;



// faker.location.nearbyGPSCoordinate(); // [ -45.6928, 48.5489 ]
// faker.location.nearbyGPSCoordinate({ origin: [33, -170] }); // [ 32.9883985189841, -169.99718966810713 ]
// faker.location.nearbyGPSCoordinate({
//   origin: [33, -170],
//   radius: 1000,
//   isMetric: true,
// }); // [ 36.13146596947529, -170.12373743350508 ]
