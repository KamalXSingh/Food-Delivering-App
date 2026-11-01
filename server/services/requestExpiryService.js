const DeliveryRequest = require('../models/DeliveryRequest');
const Order = require('../models/Order');
const DeliveryPartner = require('../models/DeliveryPartner');

const { findAvailablePartnerCandidates } = require('./matchingService');
const { handleRequestRejection } = require('./assignmentService');

const retryOrderAssignment = async (order, io) => {
  try {
    const now = new Date();

    // 1. Check whether the overall search window has expired
    if (order.partnerSearchDeadline && now >= order.partnerSearchDeadline) {
      order.status = 'CANCELED';
      order.deliveryStatus = 'CANCELED';

      await order.save();

      console.log(`Order ${order._id} canceled because search window expired`);

      // Notify customer and restaurant
      if (io) {
        const payload = {
          orderId: order._id.toString(),
          status: order.status,
          deliveryStatus: order.deliveryStatus,
        };

        io.to(`order:${order._id.toString()}`).emit('order:updated', payload);

        io.to(`restaurant:${order.restaurantId.toString()}`).emit(
          'order:updated',
          payload
        );
      }

      return;
    }

    // 2. Check whether a request is already pending
    const pendingRequest = await DeliveryRequest.findOne({
      orderId: order._id,
      status: 'PENDING',
    });

    if (pendingRequest) {
      return;
    }

    // 3. Find available delivery partners
    const candidates = await findAvailablePartnerCandidates(order);

    if (candidates.length === 0) {
      order.deliveryStatus = 'SEARCHING_FOR_PARTNER';

      await order.save();

      return;
    }

    // 4. Select the best candidate
    const candidate = candidates[0];

    const estimatedDeliveryTime = new Date(
      now.getTime() + candidate.customerEtaMinutes * 60 * 1000
    );

    // 5. Set request expiry to 30 minutes,
    // but never beyond the overall search deadline
    const expiresAt = new Date(
      Math.min(
        now.getTime() + 30 * 60 * 1000,
        order.partnerSearchDeadline.getTime()
      )
    );

    // 6. Create delivery request
    const deliveryRequest = await DeliveryRequest.create({
      orderId: order._id,
      deliveryPartnerId: candidate.partner._id,
      status: 'PENDING',
      sentAt: now,
      expiresAt,
    });

    // 7. Reserve the delivery partner
    candidate.partner.status = 'DELIVERY_REQUESTED';

    await candidate.partner.save();

    // 8. Update order delivery status
    order.deliveryStatus = 'PARTNER_REQUESTED';
    order.estimatedDeliveryTime = estimatedDeliveryTime;

    await order.save();

    // 9. Notify delivery partner
    if (io) {
      const partnerId = candidate.partner._id.toString();

      io.to(`partner:${partnerId}`).emit('new-delivery-request', {
        partnerId,
        requestId: deliveryRequest._id.toString(),
      });

      // Notify customer and restaurant about assignment progress
      const payload = {
        orderId: order._id.toString(),
        status: order.status,
        deliveryStatus: order.deliveryStatus,
      };

      io.to(`order:${order._id.toString()}`).emit('order:updated', payload);

      io.to(`restaurant:${order.restaurantId.toString()}`).emit(
        'order:updated',
        payload
      );
    }

    console.log(`New delivery request created for order ${order._id}`);

    return deliveryRequest;
  } catch (error) {
    console.error('Error retrying order assignment:', error);
  }
};

const processExpiredRequests = async (io) => {
  try {
    const now = new Date();

    // 1. Find expired pending requests
    const expiredRequests = await DeliveryRequest.find({
      status: 'PENDING',
      expiresAt: { $lte: now },
    });

    for (const request of expiredRequests) {
      // 2. Mark request as expired
      request.status = 'EXPIRED';
      request.respondedAt = now;

      await request.save();

      // 3. Release previous partner and find another candidate
      const result = await handleRequestRejection(request, io);

      console.log(
        `Processed expired request ${request._id}:`,
        result?.reason || 'NEXT_PARTNER_ASSIGNED'
      );
    }

    // 4. Find orders with active partner assignment
    const searchingOrders = await Order.find({
      deliveryStatus: {
        $in: ['SEARCHING_FOR_PARTNER', 'PARTNER_REQUESTED'],
      },
    });

    // 5. Retry assignment for each order
    for (const order of searchingOrders) {
      await retryOrderAssignment(order, io);
    }
  } catch (error) {
    console.error('Error processing expired requests:', error);
  }
};

module.exports = {
  processExpiredRequests,
};
