const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  acknowledgeTask,
  getTaskStats
} = require('../controllers/taskController');

router.route('/')
  .get(protect, getTasks)
  .post(protect, authorize('Admin', 'Supervisor'), createTask);

router.route('/stats')
  .get(protect, getTaskStats);

// Admin/Supervisor acknowledge a completed task
router.route('/:id/acknowledge')
  .put(protect, acknowledgeTask);

router.route('/:id')
  .get(protect, getTask)
  .put(protect, updateTask)
  .delete(protect, authorize('Admin', 'Supervisor'), deleteTask);

module.exports = router;
