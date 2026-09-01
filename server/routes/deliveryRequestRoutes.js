const express = require('express');

const {
  createDeliveryRequest,
  getPartnerRequests,
  acceptDeliveryRequest,
  rejectDeliveryRequest,
} = require('../controllers/deliveryRequestController');

const router = express.Router();

router.post('/', createDeliveryRequest);

router.get('/partner/:deliveryPartnerId', getPartnerRequests);

router.patch('/:requestId/accept', acceptDeliveryRequest);

router.patch('/:requestId/reject', rejectDeliveryRequest);

module.exports = router;
