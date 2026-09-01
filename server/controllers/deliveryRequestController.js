const DeliveryRequest = require('../models/DeliveryRequest');
const Order = require('../models/Order');
const DeliveryPartner = require('../models/DeliveryPartner');

//create a Delivery Request

const createDeliveryRequest = async (req, res) => {
  try {
    const { orderId, deliveryPartnerId } = req.body;

    //check required fields

    if (!orderId || !deliveryPartnerId) {
      return res.status(400).json({
        message: 'Order Id and deliveryId are required',
      });
    }

    //Check if the order exists

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: 'Order not found',
      });
    }

    //check if deliveryParnter exists

    const partner = await DeliveryPartner.findById(deliveryPartnerId);

    if (!partner) {
      return res.status(404).json({
        message: 'DeliveryPartner not found',
      });
    }

    //Partner must be availabe
    if (partner.status !== 'AVAILABLE') {
      return res.status(400).json({
        message: 'Delivery partner not available',
      });
    }

    //check wheter this order already has a pending request
    const existingRequest = await DeliveryRequest.findOne({
      orderId,
      status: 'PENDING',
    });

    if (existingRequest) {
      return res.status(409).json({
        message: 'A pending delivery request already exists for this order',
      });
    }

    //Request expires in 1 minute
    const sentAt = new Date();
    const expiresAt = new Date(sentAt.getTime() + 60 * 1000);

    //create request

    const deliveryRequest = await DeliveryRequest.create({
      orderId,
      deliveryPartnerId,
      status: 'PENDING',
      sentAt,
      expiresAt,
    });

    //temporarily mark the partner as having a request
    partner.status = 'DELIVERY_REQUESTED';
    await partner.save();

    res.status(201).json({
      message: 'Delivery request created sucessfully',
      deliveryRequest,
    });
  } catch (error) {
    console.error('Error creating delivery request: ', error);

    res.status(500).json({
      message: 'Failed to create delivery request',
    });
  }
};

//Get pending requests for a delivery parnter

const getPartnerRequests = async (req, res) => {
  try {
    const { deliveryPartnerId } = req.params;

    const requests = await DeliveryRequest.find({
      deliveryPartnerId,
      status: 'PENDING',
    })
      .populate('orderId')
      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      message: 'Delivery requests retrieved successfully',
      requests,
    });
  } catch (error) {
    console.error('Error fetching delivery requests:', error);

    res.status(500).json({
      message: 'Failed to fetch delivery requests',
    });
  }
};

//Accept a delivery Request

const acceptDeliveryRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await DeliveryRequest.findById(requestId);

    if (!request) {
      res.status(404).json({
        message: 'Delivery Request not found',
      });
    }

    // Request must still be pending
    if (request.status !== 'PENDING') {
      return res.status(400).json({
        message: 'This delivery request is no longer available',
      });
    }

    //Check expiratoin
    if (new Date() > request.expiresAt) {
      request.status = 'EXPIRED';
      request.respondedAt = new Date();

      await request.save();

      return res.status(400).json({
        message: 'Delivery request has expired',
      });
    }

    const partner = await DeliveryPartner.findById(request.deliveryPartnerId);

    if (!partner) {
      return res.status(404).json({
        message: 'Delivery partner not found',
      });
    }

    request.status = 'ACCEPTED';
    request.respondedAt = new Date();

    await request.save();

    //Assing partner to order
    const order = await Order.findById(request.orderId);

    if (!order) {
      return res.status(404).json({
        message: 'Order not found',
      });
    }

    order.deliveryPartnerId = request.deliveryPartnerId;

    order.status = 'PREPARING';
    await order.save();

    //Partner is now delivering this order
    partner.status = 'DELIVERING';
    partner.currentOrder = order._id;
    partner.availableAt = null;

    await partner.save();

    res.status(200).json({
      message: 'Delivery request accepted successfully',
      request,
      order,
      partner,
    });
  } catch (error) {
    console.error('Error accepting delivery request:', error);

    res.status(500).json({
      message: 'Failed to accept delivery request',
    });
  }
};

//REJECT A DELIVERY REQUEST

const rejectDeliveryRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await DeliveryRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({
        message: 'Delivery request not found',
      });
    }
    if (request.status !== 'PENDING') {
      return res.status(400).json({
        message: 'This delivery request is no longer available',
      });
    }

    request.status = 'REJECTED';
    request.respondedAt = new Date();

    await request.save();

    // Make the rider available again
    const partner = await DeliveryPartner.findById(request.deliveryPartnerId);

    if (partner) {
      partner.status = 'AVAILABLE';
      await partner.save();
    }

    res.status(200).json({
      message: 'Delivery request rejected',
      request,
    });
  } catch (error) {
    console.error('Error rejecting delivery request:', error);

    res.status(500).json({
      message: 'Failed to reject delivery request',
    });
  }
};

module.exports = {
  createDeliveryRequest,
  getPartnerRequests,
  acceptDeliveryRequest,
  rejectDeliveryRequest,
};
