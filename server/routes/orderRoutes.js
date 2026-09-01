const express = require('express');
const { createOrder, acceptOrder } = require('../controllers/orderController');

const router = express.Router();

router.post('/', createOrder);
router.patch('/:orderId/accept', acceptOrder);

module.exports = router;
