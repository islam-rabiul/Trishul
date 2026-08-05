const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getSupervisors
} = require('../controllers/employeeController');

router.route('/')
  .get(protect, authorize('Admin', 'Supervisor'), getEmployees)
  .post(protect, authorize('Admin'), createEmployee);

router.route('/supervisors')
  .get(protect, authorize('Admin'), getSupervisors);

router.route('/:id')
  .get(protect, authorize('Admin', 'Supervisor'), getEmployee)
  .put(protect, authorize('Admin'), updateEmployee)
  .delete(protect, authorize('Admin'), deleteEmployee);

module.exports = router;
