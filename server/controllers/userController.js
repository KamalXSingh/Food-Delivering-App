const bcrypt = require('bcrypt');

const User = require('../models/User');
const Order = require('../models/Order');

const createUser = async (req, res) => {
  try {
    const { name, email, phone, password, role, addresses } = req.body;

    // Check required fields
    if (!name || !email || !phone || !password || !role) {
      return res.status(400).json({
        message: 'Name, email, phone, password and role are required',
      });
    }

    // Check whether the email is already registered
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: 'A user with this email already exists',
      });
    }

    const hasshedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = await User.create({
      name,
      email,
      phone,
      password: hasshedPassword,
      role,
      addresses: addresses || [],
    });

    res.status(201).json({
      message: 'User created successfully',
      user,
    });
  } catch (error) {
    console.error('Error creating user:', error);

    res.status(500).json({
      message: 'Failed to create user',
    });
  }
};

const getCustomerOrders = async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await User.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        message: 'Customer not found',
      });
    }

    const orders = await Order.find({ customerId })
      .populate('restaurantId', 'name')
      .populate('deliveryPartnerId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      orders,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Failed to fetch customer orders',
    });
  }
};

module.exports = {
  createUser,
  getCustomerOrders,
};
