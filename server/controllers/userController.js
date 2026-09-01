const bcrypt = require('bcrypt');

const User = require('../models/User');

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

module.exports = {
  createUser,
};
