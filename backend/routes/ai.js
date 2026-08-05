const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  processCommand
} = require('../controllers/aiController');

router.route('/chat')
  .post(protect, authorize('Admin'), processCommand);

module.exports = router;
