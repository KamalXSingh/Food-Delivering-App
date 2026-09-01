const mongoose = require('mongoose');

const RestaurantSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    address: {
      addressLine: {
        type: String,
        required: true,
      },

      city: {
        type: String,
        required: true,
      },

      state: {
        type: String,
        required: true,
      },

      postalCode: {
        type: String,
        required: true,
      },
    },

    location: {
      latitude: {
        type: Number,
        required: true,
      },

      longitude: {
        type: Number,
        required: true,
      },
    },

    operatingStatus: {
      type: String,
      enum: ['OPEN', 'CLOSED'],
      default: 'CLOSED',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Restaurant', RestaurantSchema);
