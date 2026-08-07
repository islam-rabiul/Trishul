const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer
} = require('../controllers/customerController');

router.route('/')
  .get(protect, getCustomers)
  .post(protect, authorize('Admin'), createCustomer);

router.route('/:id')
  .get(protect, getCustomer)
  .put(protect, authorize('Admin'), updateCustomer)
  .delete(protect, authorize('Admin'), deleteCustomer);

module.exports = router;
