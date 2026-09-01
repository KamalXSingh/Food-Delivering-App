const DeliveryPartner = require('../models/DeliveryPartner');
const Restaurant = require('../models/Restaurant');

const {
  calculateDistance,
  calculateTravelTime,
} = require('../utils/locationUtils');

// --------------------------------------------------
// Get all currently available delivery partners
// --------------------------------------------------
const findAvailablePartners = async () => {
  try {
    const partners = await DeliveryPartner.find({
      status: 'AVAILABLE',
    });

    return partners;
  } catch (error) {
    console.error('Error finding available delivery partners:', error);

    throw error;
  }
};

// --------------------------------------------------
// Find and rank available delivery-partner candidates
// --------------------------------------------------
const findAvailablePartnerCandidates = async (order) => {
  try {
    // Find restaurant
    const restaurant = await Restaurant.findById(order.restaurantId);

    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    // Find available partners
    const partners = await DeliveryPartner.find({
      status: 'AVAILABLE',
    });

    if (partners.length === 0) {
      return [];
    }

    const now = new Date();

    // Expected food-ready time
    const foodReadyAt = order.foodReadyAt ? new Date(order.foodReadyAt) : now;

    // --------------------------------------------------
    // Restaurant → Customer
    // This is identical for every rider,
    // so calculate it once.
    // --------------------------------------------------

    const customerDistanceKm = calculateDistance(
      restaurant.location,
      order.deliveryAddress
    );

    const restaurantToCustomerMinutes = calculateTravelTime(customerDistanceKm);

    // Maximum acceptable difference between
    // rider arrival and food-ready time.
    const MAX_PICKUP_TIME_DIFFERENCE = 10;

    // --------------------------------------------------
    // Calculate each rider
    // --------------------------------------------------

    const candidates = partners
      .map((partner) => {
        // Rider → Restaurant
        const distanceKm = calculateDistance(
          partner.currentLocation,
          restaurant.location
        );

        const travelTimeMinutes = calculateTravelTime(distanceKm);

        // Expected rider arrival
        const arrivalTime = new Date(
          now.getTime() + travelTimeMinutes * 60 * 1000
        );

        // Absolute difference between
        // rider arrival and food-ready time
        const timeDifferenceMinutes =
          Math.abs(arrivalTime.getTime() - foodReadyAt.getTime()) / 60000;

        // How long rider waits for food
        const waitingTimeMinutes =
          arrivalTime < foodReadyAt
            ? (foodReadyAt.getTime() - arrivalTime.getTime()) / 60000
            : 0;

        // How late rider arrives
        const lateArrivalMinutes =
          arrivalTime > foodReadyAt
            ? (arrivalTime.getTime() - foodReadyAt.getTime()) / 60000
            : 0;

        // How many minutes remain until food is ready
        const timeUntilFoodReadyMinutes = Math.max(
          0,
          (foodReadyAt.getTime() - now.getTime()) / 60000
        );

        // Estimated customer delivery time
        const customerEtaMinutes =
          Math.max(travelTimeMinutes, timeUntilFoodReadyMinutes) +
          restaurantToCustomerMinutes;

        return {
          partner,
          distanceKm,
          travelTimeMinutes,
          arrivalTime,
          waitingTimeMinutes,
          lateArrivalMinutes,
          restaurantToCustomerMinutes,
          customerEtaMinutes,
          timeDifferenceMinutes,
        };
      })

      // --------------------------------------------------
      // Keep only valid candidates
      // --------------------------------------------------
      .filter((candidate) => {
        return candidate.timeDifferenceMinutes <= MAX_PICKUP_TIME_DIFFERENCE;
      });

    // --------------------------------------------------
    // Rank candidates
    // Lowest customer ETA = best candidate
    // --------------------------------------------------
    candidates.sort((a, b) => a.customerEtaMinutes - b.customerEtaMinutes);

    return candidates;
  } catch (error) {
    console.error('Error finding available partner candidates:', error);

    throw error;
  }
};

// --------------------------------------------------
// Get only the best available partner
// --------------------------------------------------
const findBestAvailablePartner = async (order) => {
  const candidates = await findAvailablePartnerCandidates(order);

  if (candidates.length === 0) {
    return null;
  }

  return candidates[0];
};

module.exports = {
  findAvailablePartners,
  findAvailablePartnerCandidates,
  findBestAvailablePartner,
};
