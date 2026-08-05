const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getSettings,
  updateSettings
} = require('../controllers/settingController');

router.route('/')
  .get(protect, authorize('Admin'), getSettings)
  .put(protect, authorize('Admin'), updateSettings);

module.exports = router;
