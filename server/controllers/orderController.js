const Order = require('../models/Order');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');

const { startAssignment } = require('../services/assignmentService');

const createOrder = async (req, res) => {
  try {
    const { customerId, restaurantId, items, deliveryAddress } = req.body;

    //check required fileds
    if (!customerId || !restaurantId || !items || !deliveryAddress) {
      return res.status(400).json({
        message:
          'Customer, restaurant, items and delivery address are required',
      });
    }

    const customer = await User.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        message: 'Customer not found',
      });
    }

    //Make sure the user is actually a customer

    if (customer.role !== 'CUSTOMER') {
      return res.status(400).json({
        message: 'Only customer can place order',
      });
    }

    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        message: 'Restauarnt not found',
      });
    }

    //check if restaurant is open

    if (restaurant.operatingStatus !== 'OPEN') {
      return res.status(400).json({
        message: 'Restaurant is closed',
      });
    }

    //create order

    const order = await Order.create({
      customerId,
      restaurantId,
      items,
      deliveryAddress,
      status: 'PLACED',
    });

    res.status(201).json({
      message: 'Order created sucesfully',
      order,
    });
  } catch (error) {
    console.error('Error creating order', error);

    res.status(500).json({
      message: 'Failed to create order',
    });
  }
};

const acceptOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { preparationTime } = req.body;

    // Check preparation time
    if (!preparationTime || preparationTime <= 0) {
      return res.status(400).json({
        message: 'Preparation time must be greater than 0',
      });
    }

    // Find order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: 'Order not found',
      });
    }

    // Order must still be PLACED
    if (order.status !== 'PLACED') {
      return res.status(400).json({
        message: `Order cannot be accepted because its current status is ${order.status}`,
      });
    }

    // Calculate food ready time
    const foodReadyAt = new Date(Date.now() + preparationTime * 60 * 1000);

    order.status = 'RESTAURANT_ACCEPTED';
    order.preparationTime = preparationTime;
    order.foodReadyAt = foodReadyAt;

    await order.save();

    // --------------------------------------------------
    // Start delivery partner search
    // --------------------------------------------------
    const assignmentResult = await startAssignment(order);

    if (!assignmentResult.success) {
      return res.status(200).json({
        message:
          'Order accepted, but no suitable delivery partner is currently available',
        order,
      });
    }

    res.status(200).json({
      message: 'Order accepted and delivery partner request sent',
      order: assignmentResult.order,
      deliveryRequest: assignmentResult.deliveryRequest,
      partnerDetails: {
        partnerId: assignmentResult.candidate.partner._id,

        distanceKm: assignmentResult.candidate.distanceKm,

        travelTimeMinutes: assignmentResult.candidate.travelTimeMinutes,

        arrivalTime: assignmentResult.candidate.arrivalTime,

        waitingTimeMinutes: assignmentResult.candidate.waitingTimeMinutes,

        customerEtaMinutes: assignmentResult.candidate.customerEtaMinutes,
      },
    });
  } catch (error) {
    console.error('Error accepting order:', error);

    res.status(500).json({
      message: 'Failed to accept order',
    });
  }
};

module.exports = {
  createOrder,
  acceptOrder,
};
