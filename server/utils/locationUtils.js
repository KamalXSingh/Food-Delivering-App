const calculateDistance = (locationA, locationB) => {
  const earthRadiusKm = 6371;

  const lat1 = (locationA.latitude * Math.PI) / 180;
  const lat2 = (locationB.latitude * Math.PI) / 180;

  const deltaLat = ((locationB.latitude - locationA.latitude) * Math.PI) / 180;

  const deltaLon =
    ((locationB.longitude - locationA.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
};

const calculateTravelTime = (distanceKm) => {
  const averageSpeedKmPerHour = 25;
  const travelTimeHours = distanceKm / averageSpeedKmPerHour;
  const travelTimeMinutes = travelTimeHours * 60;

  return travelTimeMinutes;
};

module.exports = {
  calculateDistance,
  calculateTravelTime,
};
