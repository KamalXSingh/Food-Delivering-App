const express = require('express');
const {
  createRestaurant,
  getRestaurantOrders,
  markOrderReady,
} = require('../controllers/restaurnatController');
const router = express.Router();

router.post('/', createRestaurant);
router.get('/:restaurantId/orders', getRestaurantOrders);
router.patch('/orders/:orderId/ready', markOrderReady);

module.exports = router;
