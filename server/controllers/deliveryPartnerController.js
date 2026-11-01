const DeliveryPartner = require('../models/DeliveryPartner');
const User = require('../models/User');
const Order = require('../models/Order');

const crypto = require('crypto');

const {
  findBestAvailablePartner,
  findAvailablePartnerCandidates,
} = require('../services/matchingService');

const { generateOtp, hashOtp } = require('../utils/otpUtils');
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

const getCurrentOrder = async (req, res) => {
  try {
    console.log('Partner ID received:', req.params.partnerId);

    const partner = await DeliveryPartner.findById(req.params.partnerId);
    console.log('Partner currentOrder:', partner?.currentOrder);

    console.log('getCurrentOrder controller called');
    const { partnerId } = req.params;

    // const partner = await DeliveryPartner.findById(partnerId);

    if (!partner) {
      return res.status(404).json({
        message: 'Delivery partner not found',
      });
    }

    console.log('Partner ID:', partner._id);
    console.log('Partner currentOrder:', partner.currentOrder);

    const allOrders = await Order.find(
      {},
      '_id status deliveryStatus deliveryPartnerId'
    );

    console.log('All existing orders:', allOrders);

    // const partner = await DeliveryPartner.findById(partnerId);

    console.log('Partner document:', {
      id: partner._id,
      currentOrder: partner.currentOrder,
      status: partner.status,
    });

    const assignedOrders = await Order.find({
      deliveryPartnerId: partner._id,
    }).select('_id status deliveryStatus');

    console.log('Orders assigned to this partner:', assignedOrders);

    if (!partner.currentOrder) {
      return res.status(200).json({
        order: null,
      });
    }

    const order = await Order.findById(partner.currentOrder).populate(
      'restaurantId',
      'name'
    );

    const rawOrder = await Order.collection.findOne({
      _id: partner.currentOrder,
    });

    console.log('Mongoose query result:', order);
    console.log('Direct MongoDB query result:', rawOrder);
    console.log('Orders collection:', await Order.collection.countDocuments());

    if (!order) {
      return res.status(404).json({
        message: 'Current order not found',
      });
    }

    return res.status(200).json({
      order,
    });
  } catch (error) {
    console.error('Get current order error:', error);

    return res.status(500).json({
      message: 'Failed to fetch current order',
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

const startPickup = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    console.log('Before starting pickup:', {
      orderId: order._id,
      status: order.status,
      deliveryStatus: order.deliveryStatus,
      deliveryPartnerId: order.deliveryPartnerId,
    });

    if (!order) {
      return res.status(404).json({
        message: 'Order not found',
      });
    }

    if (!['PREPARING', 'READY_FOR_PICKUP'].includes(order.status)) {
      return res.status(400).json({
        message: 'Order is not in a valid state to start pickup',
      });
    }

    if (order.deliveryStatus !== 'PARTNER_ACCEPTED') {
      return res.status(400).json({
        message: 'Delivery Partner has not accepted the order',
      });
    }

    if (!order.deliveryPartnerId) {
      return res.status(400).json({
        message: 'No delivery partner is assigned to this order',
      });
    }

    order.deliveryStatus = 'RIDER_GOING_TO_RESTAURANT';
    // order.status = 'RIDER_GOING_TO_RESTAURANT';

    await order.save();
    order.deliveryStatus = 'RIDER_GOING_TO_RESTAURANT';

    console.log('Attempting to save:', order.deliveryStatus);

    await order.save();

    console.log('Successfully saved:', {
      status: order.status,
      deliveryStatus: order.deliveryStatus,
    });

    const io = req.app.get('io');

    if (io) {
      io.to(`order:${order._id.toString()}`).emit('order:updated', {
        orderId: order._id.toString(),
      });
    }

    res.status(200).json({
      message: 'Rider started going to restaurant',
      order,
    });
  } catch (error) {
    console.error('Error starting pickup:', error);

    res.status(500).json({
      message: 'Failed to start pickup',
      error: error.message,
    });
  }
};

const arriveAtRestaurant = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: 'Order not found',
      });
    }

    if (order.deliveryStatus !== 'RIDER_GOING_TO_RESTAURANT') {
      return res.status(400).json({
        message: 'Rider has not started going to the restaurant',
      });
    }

    if (!order.deliveryPartnerId) {
      return res.status(400).json({
        message: 'No delivery partner is assigned to this order',
      });
    }

    order.deliveryStatus = 'RIDER_ARRIVED';

    await order.save();

    const io = req.app.get('io');

    if (io) {
      io.to(`order:${order._id.toString()}`).emit('order:updated', {
        orderId: order._id.toString(),
      });

      io.to(`restaurant:${order.restaurantId.toString()}`).emit(
        'order:updated',
        {
          orderId: order._id.toString(),
        }
      );
    }

    res.status(200).json({
      message: 'Rider arrived at restaurant',
      order,
    });
  } catch (error) {
    console.error('Error marking rider arrival:', error);

    res.status(500).json({
      message: 'Failed to mark rider arrival',
    });
  }
};

const markOrderPickedUp = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: 'Order not found',
      });
    }

    // Check whether the rider has arrived
    if (order.deliveryStatus !== 'RIDER_ARRIVED') {
      return res.status(400).json({
        message: 'Rider has not arrived',
      });
    }

    // Check whether the restaurant has marked food ready
    if (order.status !== 'READY_FOR_PICKUP') {
      return res.status(400).json({
        message: 'Food is not ready for pickup',
      });
    }

    if (!order.deliveryPartnerId) {
      return res.status(400).json({
        message: 'No delivery partner assigned',
      });
    }

    // Generate delivery OTP
    const otp = generateOtp();

    order.deliveryOtpHash = hashOtp(otp);
    order.otpGeneratedAt = new Date();

    // Update both order and delivery statuses
    order.status = 'PICKED_UP';
    order.deliveryStatus = 'PICKED_UP';

    await order.save();

    // Socket.IO notifications
    const io = req.app.get('io');

    if (io) {
      const orderIdString = order._id.toString();

      // Notify customer
      io.to(`order:${orderIdString}`).emit('order:updated', {
        orderId: orderIdString,
      });

      // Notify restaurant
      if (order.restaurantId) {
        io.to(`restaurant:${order.restaurantId.toString()}`).emit(
          'order:updated',
          {
            orderId: orderIdString,
          }
        );
      }
    }

    return res.status(200).json({
      message: 'Order picked up successfully',
      order,
      deliveryOtp: otp,
    });
  } catch (error) {
    console.error('Error marking order as picked up:', error);

    return res.status(500).json({
      message: 'Failed to mark order as picked up',
    });
  }
};

const startDelivery = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: 'Order not found',
      });
    }

    // Verify that the food has been picked up
    if (order.status !== 'PICKED_UP') {
      return res.status(400).json({
        message: 'Order has not been picked up',
      });
    }

    // Verify delivery progress
    if (order.deliveryStatus !== 'PICKED_UP') {
      return res.status(400).json({
        message: 'Delivery partner has not picked up the order',
      });
    }

    if (!order.deliveryPartnerId) {
      return res.status(400).json({
        message: 'No delivery partner assigned',
      });
    }

    // Update both statuses
    order.status = 'OUT_FOR_DELIVERY';
    order.deliveryStatus = 'OUT_FOR_DELIVERY';

    await order.save();

    // Socket.IO notifications
    const io = req.app.get('io');

    if (io) {
      const id = order._id.toString();

      io.to(`order:${id}`).emit('order:updated', {
        orderId: id,
      });

      io.to(`partner:${order.deliveryPartnerId.toString()}`).emit(
        'order:updated',
        { orderId: id }
      );

      if (order.restaurantId) {
        io.to(`restaurant:${order.restaurantId.toString()}`).emit(
          'order:updated',
          { orderId: id }
        );
      }
    }

    return res.status(200).json({
      message: 'Order out for delivery',
      order,
    });
  } catch (error) {
    console.error('Error starting delivery:', error);

    return res.status(500).json({
      message: 'Failed to start delivery',
    });
  }
};

const verifyDeliveryOtp = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        message: 'OTP is required',
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: 'Order not found',
      });
    }

    if (
      order.status !== 'OUT_FOR_DELIVERY' ||
      order.deliveryStatus !== 'OUT_FOR_DELIVERY'
    ) {
      return res.status(400).json({
        message: 'Order is not out for delivery',
      });
    }

    if (!order.deliveryPartnerId) {
      return res.status(400).json({
        message: 'No delivery partner is assigned to this order',
      });
    }

    if (!order.deliveryOtpHash) {
      return res.status(400).json({
        message: 'Delivery OTP has not been generated',
      });
    }

    const hashedOtp = crypto
      .createHash('sha256')
      .update(otp.toString())
      .digest('hex');

    if (hashedOtp !== order.deliveryOtpHash) {
      return res.status(400).json({
        message: 'Invalid delivery OTP',
      });
    }

    const deliveryPartner = await DeliveryPartner.findById(
      order.deliveryPartnerId
    );

    if (!deliveryPartner) {
      return res.status(404).json({
        message: 'Delivery partner not found',
      });
    }

    const now = new Date();

    order.status = 'DELIVERED';
    order.deliveryStatus = 'DELIVERED';
    order.otpVerifiedAt = now;
    order.deliveryOtpHash = undefined;

    deliveryPartner.status = 'AVAILABLE';
    deliveryPartner.currentOrder = null;
    deliveryPartner.availableAt = now;

    await order.save();
    await deliveryPartner.save();

    const io = req.app.get('io');

    if (io) {
      const id = order._id.toString();

      // Notify customer
      io.to(`order:${id}`).emit('order:updated', {
        orderId: id,
      });

      // Notify delivery partner
      io.to(`partner:${order.deliveryPartnerId.toString()}`).emit(
        'order:updated',
        { orderId: id }
      );

      // Notify restaurant
      io.to(`restaurant:${order.restaurantId.toString()}`).emit(
        'order:updated',
        { orderId: id }
      );
    }

    res.status(200).json({
      message: 'Order delivered successfully',
      order,
      deliveryPartner,
    });
  } catch (error) {
    console.error('Error verifying delivery OTP:', error);

    res.status(500).json({
      message: 'Failed to verify delivery OTP',
    });
  }
};

module.exports = {
  createDeliveryPartner,
  getAvailablePartners,
  findBestPartnerForOrder,
  getPartnerCandidatesForOrder,
  startPickup,
  arriveAtRestaurant,
  markOrderPickedUp,
  startDelivery,
  verifyDeliveryOtp,
  getCurrentOrder,
};
