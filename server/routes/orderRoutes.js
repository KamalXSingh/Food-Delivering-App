const express = require('express');
const {
  createOrder,
  acceptOrder,
  getOrderById,
} = require('../controllers/orderController');

const router = express.Router();

router.post('/', createOrder);
router.patch('/:orderId/accept', acceptOrder);
router.get('/:orderId', getOrderById);

module.exports = router;
