const Order = require('../models/Order');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');

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

    //check preparation time
    if (!preparationTime || preparationTime <= 0) {
      return res.status(400).json({
        message: 'Preparation time must be greater than 0',
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: 'Order not found',
      });
    }
    // Only PLACED orders can be accepted
    if (order.status !== 'PLACED') {
      return res.status(400).json({
        message: `Order cannot be accepted because its current status is ${order.status}`,
      });
    }

    const foodReadyAt = new Date(Date.now() + preparationTime * 60 * 1000);

    //Update the order
    order.status = 'RESTAURANT_ACCEPTED';
    order.preparationTime = preparationTime;
    order.foodReadyAt = foodReadyAt;

    await order.save();

    res.status(200).json({
      message: 'Order accepted successfully',
      order,
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
