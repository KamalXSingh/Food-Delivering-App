const express = require('express');
const {
  createRestaurant,
  getRestaurantOrders,
} = require('../controllers/restaurnatController');
const router = express.Router();

router.post('/', createRestaurant);
router.get('/:restaurantId/orders', getRestaurantOrders);

module.exports = router;
