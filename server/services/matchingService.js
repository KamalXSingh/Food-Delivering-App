const DeliveryPartner = require('../models/DeliveryPartner');
const Restaurant = require('../models/Restaurant');
const DeliveryRequest = require('../models/DeliveryRequest');

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

    // Find all currently available partners
    const partners = await DeliveryPartner.find({
      status: 'AVAILABLE',
    });

    if (partners.length === 0) {
      return [];
    }

    // --------------------------------------------------
    // Find partners already attempted for this order
    // --------------------------------------------------

    const previousRequests = await DeliveryRequest.find({
      orderId: order._id,
    }).select('deliveryPartnerId');

    const attemptedPartnerIds = new Set(
      previousRequests.map((request) => request.deliveryPartnerId.toString())
    );

    // Remove partners who have already received
    // a request for this order
    const untriedPartners = partners.filter(
      (partner) => !attemptedPartnerIds.has(partner._id.toString())
    );

    if (untriedPartners.length === 0) {
      return [];
    }

    const now = new Date();

    // Expected food-ready time
    const foodReadyAt = order.foodReadyAt ? new Date(order.foodReadyAt) : now;

    // --------------------------------------------------
    // Restaurant → Customer
    // Same for every rider, so calculate once
    // --------------------------------------------------

    const customerDistanceKm = calculateDistance(
      restaurant.location,
      order.deliveryAddress
    );

    const restaurantToCustomerMinutes = calculateTravelTime(customerDistanceKm);

    // Maximum acceptable difference between
    // rider arrival and food-ready time
    const MAX_LATE_ARRIVAL_MINUTES = 10;

    const candidates = untriedPartners
      .map((partner) => {
        const distanceKm = calculateDistance(
          partner.currentLocation,
          restaurant.location
        );

        const travelTimeMinutes = calculateTravelTime(distanceKm);

        const arrivalTime = new Date(
          now.getTime() + travelTimeMinutes * 60 * 1000
        );

        const waitingTimeMinutes =
          arrivalTime < foodReadyAt
            ? (foodReadyAt.getTime() - arrivalTime.getTime()) / 60000
            : 0;

        const lateArrivalMinutes =
          arrivalTime > foodReadyAt
            ? (arrivalTime.getTime() - foodReadyAt.getTime()) / 60000
            : 0;

        const timeUntilFoodReadyMinutes = Math.max(
          0,
          (foodReadyAt.getTime() - now.getTime()) / 60000
        );

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
        };
      })
      .filter((candidate) => {
        return candidate.lateArrivalMinutes <= MAX_LATE_ARRIVAL_MINUTES;
      });

    // Rank from best to worst
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
