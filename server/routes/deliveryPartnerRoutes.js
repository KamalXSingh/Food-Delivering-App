const express = require('express');
const {
  createDeliveryPartner,
  getAvailablePartners,
  findBestPartnerForOrder,
  getPartnerCandidatesForOrder,
} = require('../controllers/deliveryPartnerController');

const router = express.Router();

router.post('/', createDeliveryPartner);
router.get('/available', getAvailablePartners);
router.get('/best-for-order/:orderId', findBestPartnerForOrder);
router.get('/candidates-for-order/:orderId', getPartnerCandidatesForOrder);
module.exports = router;
