const express = require('express');

const {
  createUser,
  getCustomerOrders,
} = require('../controllers/userController');

const router = express.Router();

router.post('/', createUser);
router.get('/:customerId/Orders', getCustomerOrders);

module.exports = router;
