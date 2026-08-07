const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  getLeadStats
} = require('../controllers/leadController');

router.route('/')
  .get(protect, getLeads)
  // All authenticated roles (Admin, Supervisor, User) can create a lead.
  // Users are automatically assigned the lead to themselves in the controller.
  .post(protect, createLead);

router.route('/stats')
  .get(protect, getLeadStats);

router.route('/:id')
  .get(protect, getLead)
  .put(protect, authorize('Admin', 'Supervisor'), updateLead)
  .delete(protect, authorize('Admin', 'Supervisor'), deleteLead);

module.exports = router;
