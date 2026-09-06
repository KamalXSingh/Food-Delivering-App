const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const Order = require('../models/Order');

const createRestaurant = async (req, res) => {
  try {
    const { ownerId, name, phone, address, location, operatingStatus } =
      req.body;

    //check required fields
    if (
      !ownerId ||
      !name ||
      !phone ||
      !address ||
      !location ||
      !operatingStatus
    ) {
      return res.status(400).json({
        message:
          'Owner, name, phone, address, location, operatinStatus required',
      });
    }

    //Check if the owner exists

    const owner = await User.findById(ownerId);

    if (!owner) {
      return res(404).json({
        message: 'Restaurant Owner not found',
      });
    }

    if (owner.role !== 'RESTAURANT') {
      return res(400).json({
        message: 'User must have a restaurant role',
      });
    }

    const restaurant = await Restaurant.create({
      ownerId,
      name,
      phone,
      address,
      location,
      operatingStatus: operatingStatus || 'CLOSED',
    });

    res.status(201).json({
      message: 'Restaurant Created Sucesfully',
      restaurant,
    });
  } catch (error) {
    console.error('Error creating restaurant', error);

    res.status(500).json({
      message: 'Falied to create restaurant',
    });
  }
};

const getRestaurantOrders = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    //Check if restaurant exists

    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        message: 'Restaurant not found',
      });
    }

    const orders = await Order.find({
      restaurantId: restaurantId,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      message: 'Restaurant orders retrieved successfully',
      orders,
    });
  } catch (error) {
    console.error('Error fetching restaurant orders:', error);

    res.status(500).json({
      message: 'Failed to fetch restaurant orders',
    });
  }
};

const markOrderReady = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: 'Order not found',
      });
    }

    if (order.status !== 'PREPARING' && order.status !== 'RIDER_ARRIVED') {
      return res.status(400).json({
        message: 'Order is not in PREPARING status',
      });
    }

    order.status = 'READY_FOR_PICKUP';

    await order.save();

    res.status(200).json({
      message: 'Order marked as ready for pickup',
      order,
    });
  } catch (error) {
    console.error('Error marking order ready:', error);

    res.status(500).json({
      message: 'Failed to mark order as ready',
    });
  }
};

module.exports = {
  createRestaurant,
  getRestaurantOrders,
  markOrderReady,
};
