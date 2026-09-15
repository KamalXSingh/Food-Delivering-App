const DeliveryRequest = require('../models/DeliveryRequest');
const Order = require('../models/Order');
const DeliveryPartner = require('../models/DeliveryPartner');

const { findAvailablePartnerCandidates } = require('./matchingService');
const { handleRequestRejection } = require('./assignmentService');

const retryOrderAssignment = async (order) => {
  try {
    const now = new Date();

    // If the overall search window has expired, cancel the order
    if (order.partnerSearchDeadline && now >= order.partnerSearchDeadline) {
      order.status = 'CANCELED';

      await order.save();

      console.log(`Order ${order._id} canceled because search window expired`);

      return;
    }

    // Make sure there isn't already a pending request
    const pendingRequest = await DeliveryRequest.findOne({
      orderId: order._id,
      status: 'PENDING',
    });

    if (pendingRequest) {
      return;
    }

    // Find available candidates
    const candidates = await findAvailablePartnerCandidates(order);

    if (candidates.length === 0) {
      // Keep searching
      order.status = 'SEARCHING_FOR_PARTNER';

      await order.save();

      return;
    }

    // Select best candidate
    const candidate = candidates[0];

    const estimatedDeliveryTime = new Date(
      now.getTime() + candidate.customerEtaMinutes * 60 * 1000
    );

    // Request cannot go beyond the overall search deadline
    const expiresAt = new Date(
      Math.min(now.getTime() + 60 * 1000, order.partnerSearchDeadline.getTime())
    );

    const deliveryRequest = await DeliveryRequest.create({
      orderId: order._id,
      deliveryPartnerId: candidate.partner._id,
      status: 'PENDING',
      sentAt: now,
      expiresAt,
    });

    // Reserve partner
    candidate.partner.status = 'DELIVERY_REQUESTED';

    await candidate.partner.save();

    // Update order
    order.status = 'PARTNER_REQUESTED';
    order.estimatedDeliveryTime = estimatedDeliveryTime;

    await order.save();

    console.log(`New delivery request created for order ${order._id}`);

    return deliveryRequest;
  } catch (error) {
    console.error('Error retrying order assignment:', error);
  }
};

const processExpiredRequests = async () => {
  try {
    const now = new Date();

    // Find expired pending requests
    const expiredRequests = await DeliveryRequest.find({
      status: 'PENDING',
      expiresAt: { $lte: now },
    });

    for (const request of expiredRequests) {
      // Mark request expired
      request.status = 'EXPIRED';
      request.respondedAt = now;

      await request.save();

      // Try another partner
      const result = await handleRequestRejection(request);

      // If no partner is available,
      // keep the order searching
      if (!result.success && result.reason === 'NO_AVAILABLE_PARTNER') {
        const order = await Order.findById(request.orderId);

        if (order) {
          order.status = 'SEARCHING_FOR_PARTNER';

          await order.save();
        }
      }
    }

    // Retry orders that are still searching
    const searchingOrders = await Order.find({
      status: 'SEARCHING_FOR_PARTNER',
      partnerSearchDeadline: { $gt: now },
    });

    for (const order of searchingOrders) {
      await retryOrderAssignment(order);
    }
  } catch (error) {
    console.error('Error processing expired requests:', error);
  }
};

module.exports = {
  processExpiredRequests,
};
