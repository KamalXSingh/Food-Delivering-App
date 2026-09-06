const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

const addressSchema = new mongoose.Schema(
  {
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

    latitude: {
      type: Number,
      required: true,
    },

    longitude: {
      type: Number,
      required: true,
    },
  },
  {
    _id: false,
  }
);

const OrderSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },

    deliveryPartnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeliveryPartner',
      default: null,
    },

    items: {
      type: [orderItemSchema],
      required: true,
    },

    deliveryAddress: {
      type: addressSchema,
      required: true,
    },

    status: {
      type: String,
      enum: [
        'PLACED',
        'RESTAURANT_ACCEPTED',
        'SEARCHING_FOR_PARTNER',
        'PARTNER_REQUESTED',
        'PARTNER_ACCEPTED',
        'RESTAURANT_CONFIRMED',
        'PREPARING',
        'READY_FOR_PICKUP',
        'RIDER_GOING_TO_RESTAURANT',
        'RIDER_ARRIVED',
        'PICKED_UP',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELED',
      ],
      default: 'PLACED',
    },

    preparationTime: {
      type: Number,
      default: null,
    },

    foodReadyAt: {
      type: Date,
      default: null,
    },

    estimatedDeliveryTime: {
      type: Date,
      default: null,
    },
    partnerSearchStartedAt: {
      type: Date,
      default: null,
    },

    partnerSearchDeadline: {
      type: Date,
      default: null,
    },

    deliveryOtpHash: {
      type: String,
      default: null,
    },

    otpGeneratedAt: {
      type: Date,
      default: null,
    },

    otpVerifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Order', OrderSchema);
