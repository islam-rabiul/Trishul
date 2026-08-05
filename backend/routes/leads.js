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
  .post(protect, authorize('Admin', 'Supervisor'), createLead);

router.route('/stats')
  .get(protect, getLeadStats);

router.route('/:id')
  .get(protect, getLead)
  .put(protect, updateLead)
  .delete(protect, authorize('Admin', 'Supervisor'), deleteLead);

module.exports = router;
