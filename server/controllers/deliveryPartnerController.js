const DeliveryPartner = require('../models/DeliveryPartner');
const User = require('../models/User');
const Order = require('../models/Order');

const {
  findBestAvailablePartner,
  findAvailablePartnerCandidates,
} = require('../services/matchingService');

// --------------------------------------------------
// Create a delivery partner profile
// --------------------------------------------------
const createDeliveryPartner = async (req, res) => {
  try {
    const { userId, status, currentLocation, availableAt } = req.body;

    // Check required fields
    if (!userId || !currentLocation) {
      return res.status(400).json({
        message: 'User ID and current location are required',
      });
    }

    // Check that the user exists
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    // User must have DELIVERY_PARTNER role
    if (user.role !== 'DELIVERY_PARTNER') {
      return res.status(400).json({
        message: 'User must have DELIVERY_PARTNER role',
      });
    }

    // Check whether a profile already exists
    const existingPartner = await DeliveryPartner.findOne({
      userId,
    });

    if (existingPartner) {
      return res.status(409).json({
        message: 'Delivery partner profile already exists for this user',
      });
    }

    // Create delivery partner
    const deliveryPartner = await DeliveryPartner.create({
      userId,
      status: status || 'OFFLINE',
      currentLocation,
      availableAt: availableAt || null,
    });

    res.status(201).json({
      message: 'Delivery partner created successfully',
      deliveryPartner,
    });
  } catch (error) {
    console.error('Error creating delivery partner:', error);

    res.status(500).json({
      message: 'Failed to create delivery partner',
    });
  }
};

// --------------------------------------------------
// Get all currently AVAILABLE partners
// --------------------------------------------------
const getAvailablePartners = async (req, res) => {
  try {
    const partners = await DeliveryPartner.find({
      status: 'AVAILABLE',
    });

    res.status(200).json({
      message: 'Available delivery partners retrieved successfully',
      partners,
    });
  } catch (error) {
    console.error('Error fetching delivery partners:', error);

    res.status(500).json({
      message: 'Failed to fetch delivery partners',
    });
  }
};

// --------------------------------------------------
// Find the best available partner for an order
// --------------------------------------------------
const findBestPartnerForOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find the order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: 'Order not found',
      });
    }

    // Find best available partner
    const result = await findBestAvailablePartner(order);

    if (!result) {
      return res.status(404).json({
        message: 'No suitable available delivery partner found',
      });
    }

    res.status(200).json({
      message: 'Best available delivery partner found',
      partner: result.partner,
      distanceKm: result.distanceKm,
      travelTimeMinutes: result.travelTimeMinutes,
      arrivalTime: result.arrivalTime,
      waitingTimeMinutes: result.waitingTimeMinutes,
      lateArrivalMinutes: result.lateArrivalMinutes,
      restaurantToCustomerMinutes: result.restaurantToCustomerMinutes,
      customerEtaMinutes: result.customerEtaMinutes,
    });
  } catch (error) {
    console.error('Error finding best partner:', error);

    res.status(500).json({
      message: 'Failed to find best delivery partner',
    });
  }
};

// --------------------------------------------------
// Get all ranked partner candidates for an order
// --------------------------------------------------
const getPartnerCandidatesForOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find the order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: 'Order not found',
      });
    }

    // Find ranked candidates
    const candidates = await findAvailablePartnerCandidates(order);

    res.status(200).json({
      message: 'Delivery partner candidates found',
      candidates,
    });
  } catch (error) {
    console.error('Error finding partner candidates:', error);

    res.status(500).json({
      message: 'Failed to find partner candidates',
    });
  }
};

module.exports = {
  createDeliveryPartner,
  getAvailablePartners,
  findBestPartnerForOrder,
  getPartnerCandidatesForOrder,
};
