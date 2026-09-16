//orders
//deliveryRequest
//findavailabePartners

const Order = require('../models/Order');
const DeliveryRequest = require('../models/DeliveryRequest');
const DeliveryPartner = require('../models/DeliveryPartner');

const {
  findAvailablePartnerCandidates,
} = require('../services/matchingService');

const startAssignment = async (order) => {
  try {
    const now = new Date();

    const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);

    const searchDeadline = new Date(
      Math.max(
        tenMinutesFromNow.getTime(),
        new Date(order.foodReadyAt).getTime()
      )
    );

    // Make the changes
    order.status = 'SEARCHING_FOR_PARTNER';
    order.partnerSearchStartedAt = now;
    order.partnerSearchDeadline = searchDeadline;

    await order.save();

    // Find the partners
    const candidates = await findAvailablePartnerCandidates(order);

    // If no candidate found
    if (candidates.length === 0) {
      return {
        success: false,
        reason: 'NO_AVAILABLE_PARTNER_FOUND',
      };
    }

    // Select the best candidate
    const candidate = candidates[0];

    // Calculate estimated delivery time
    const estimatedDeliveryTime = new Date(
      now.getTime() + candidate.customerEtaMinutes * 60 * 1000
    );

    // Create delivery request
    const sentAt = new Date();
    const expiersAt = new Date(sentAt.getTime() + 600 * 1000);

    const deliveryRequest = await DeliveryRequest.create({
      orderId: order._id,
      deliveryPartnerId: candidate.partner._id,
      status: 'PENDING',
      sentAt: sentAt,
      expiresAt: expiersAt,
    });

    candidate.partner.status = 'DELIVERY_REQUESTED';
    await candidate.partner.save();

    order.status = 'PARTNER_REQUESTED';
    order.estimatedDeliveryTime = estimatedDeliveryTime;

    await order.save();

    return {
      success: true,
      order,
      deliveryRequest,
      candidate,
    };
  } catch (error) {
    console.error('Error starting assignment:', error);

    throw error;
  }
};

const handleRequestRejection = async (request) => {
  try {
    // Find the order associated with the rejected request
    const order = await Order.findById(request.orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    // Find the partner who rejected the request
    const rejectedPartner = await DeliveryPartner.findById(
      request.deliveryPartnerId
    );

    // Make the rejected partner available again
    if (rejectedPartner) {
      rejectedPartner.status = 'AVAILABLE';
      await rejectedPartner.save();
    }

    // Check whether the search window has expired
    const now = new Date();

    if (order.partnerSearchDeadline && now >= order.partnerSearchDeadline) {
      order.status = 'CANCELED';

      await order.save();

      return {
        success: false,
        reason: 'SEARCH_WINDOW_EXPIRED',
      };
    }

    // Find remaining eligible candidates
    const candidates = await findAvailablePartnerCandidates(order);

    if (candidates.length === 0) {
      return {
        success: false,
        reason: 'NO_AVAILABLE_PARTNER',
      };
    }

    // Pick the next best candidate
    const candidate = candidates[0];

    // Recalculate estimated delivery time
    // based on the new candidate
    const estimatedDeliveryTime = new Date(
      now.getTime() + candidate.customerEtaMinutes * 60 * 1000
    );

    // Create a new request
    const sentAt = new Date();

    const expiresAt = new Date(
      Math.min(
        sentAt.getTime() + 60 * 1000,
        order.partnerSearchDeadline.getTime()
      )
    );

    const deliveryRequest = await DeliveryRequest.create({
      orderId: order._id,
      deliveryPartnerId: candidate.partner._id,
      status: 'PENDING',
      sentAt,
      expiresAt,
    });

    // Reserve the new partner
    candidate.partner.status = 'DELIVERY_REQUESTED';

    await candidate.partner.save();

    // Update order
    order.status = 'PARTNER_REQUESTED';
    order.estimatedDeliveryTime = estimatedDeliveryTime;

    await order.save();

    return {
      success: true,
      order,
      deliveryRequest,
      candidate,
    };
  } catch (error) {
    console.error('Error handling request rejection:', error);

    throw error;
  }
};

module.exports = {
  startAssignment,
  handleRequestRejection,
};
