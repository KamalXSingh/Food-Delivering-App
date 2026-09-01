const mongoose = require('mongoose');

const DeliveryPartnerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    status: {
      type: String,
      enum: ['OFFLINE', 'AVAILABLE', 'DELIVERING', 'DELIVERY_REQUESTED'],
      default: 'OFFLINE',
    },

    currentOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },

    currentLocation: {
      latitude: {
        type: Number,
        required: true,
      },

      longitude: {
        type: Number,
        required: true,
      },
    },

    availableAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('DeliveryPartner', DeliveryPartnerSchema);
