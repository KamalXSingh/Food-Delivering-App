const express = require('express');
const {
  createDeliveryPartner,
  getAvailablePartners,
  findBestPartnerForOrder,
  getPartnerCandidatesForOrder,
  startPickup,
  arriveAtRestaurant,
  markOrderPickedUp,
  startDelivery,
  verifyDeliveryOtp,
} = require('../controllers/deliveryPartnerController');

const router = express.Router();

router.post('/', createDeliveryPartner);
router.get('/available', getAvailablePartners);
router.get('/best-for-order/:orderId', findBestPartnerForOrder);
router.get('/candidates-for-order/:orderId', getPartnerCandidatesForOrder);
router.patch('/orders/:orderId/start-pickup', startPickup);
router.patch('/orders/:orderId/arrive', arriveAtRestaurant);
router.patch('/orders/:orderId/pickup', markOrderPickedUp);
router.patch('/orders/:orderId/start-delivery', startDelivery);
router.patch('/orders/:orderId/verify-otp', verifyDeliveryOtp);

module.exports = router;
