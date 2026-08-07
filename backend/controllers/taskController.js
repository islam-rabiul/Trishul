const Task = require('../models/Task');
const User = require('../models/User');
const { isInScope } = require('../utils/access');

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res) => {
  try {
    const { page = 1, limit = 50, search, status, priority } = req.query;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    if (priority) {
      query.priority = priority;
    }
    
    // Role-based filtering:
    // - Admin     → no filter (sees all tasks)
    // - Supervisor → no filter (sees all tasks)
    // - User      → restricted to their own assigned tasks
    if (req.user.role === 'User') {
      query.assignedTo = req.user.id;
    }
    // Admin and Supervisor see all tasks (no filter)
    
    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name')
      .populate('relatedCustomer', 'name company')
      .populate('relatedLead', 'leadName')
      .sort({ status: 1, dueDate: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Task.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name')
      .populate('relatedCustomer', 'name company')
      .populate('relatedLead', 'leadName');
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    if (!(await isInScope(req.user, task.assignedTo))) {
      return res.status(403).json({ success: false, message: 'You are not allowed to access this task' });
    }
    
    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new task
// @route   POST /api/tasks
// @access  Admin, Supervisor only
exports.createTask = async (req, res) => {
  try {
    // Users cannot create tasks
    if (req.user.role === 'User') {
      return res.status(403).json({ success: false, message: 'Users cannot create tasks. Tasks are assigned to you by Admin or Supervisor.' });
    }

    const taskData = { ...req.body, createdBy: req.user.id };

    if (!taskData.assignedTo) {
      return res.status(400).json({ success: false, message: 'Task must be assigned to a user' });
    }

    if (!(await isInScope(req.user, taskData.assignedTo))) {
      return res.status(403).json({ success: false, message: 'You can only assign tasks within your team' });
    }

    const task = await Task.create(taskData);
    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name');

    req.io?.emit('crm_event', { entity: 'task', action: 'create', data: populated });
    
    res.status(201).json({
      success: true,
      data: populated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private (Users can only change status to Completed)
exports.updateTask = async (req, res) => {
  try {
    const existingTask = await Task.findById(req.params.id);
    if (!existingTask) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    if (!(await isInScope(req.user, existingTask.assignedTo))) {
      return res.status(403).json({ success: false, message: 'You are not allowed to update this task' });
    }

    let updates = {};

    if (req.user.role === 'User') {
      // Users can ONLY mark task as Completed (not Pending again, not edit anything else)
      if (req.body.status && req.body.status === 'Completed') {
        updates.status = 'Completed';
        updates.completedAt = new Date();
      } else {
        return res.status(403).json({ success: false, message: 'You can only mark tasks as Completed' });
      }
    } else {
      // Admin / Supervisor can update everything
      updates = { ...req.body };
      if (updates.assignedTo && !(await isInScope(req.user, updates.assignedTo))) {
        return res.status(403).json({ success: false, message: 'You can only assign tasks within your team' });
      }
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name email role').populate('createdBy', 'name');
    
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    req.io?.emit('crm_event', { entity: 'task', action: 'update', data: task });
    
    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Admin acknowledges task completion
// @route   PUT /api/tasks/:id/acknowledge
// @access  Admin, Supervisor only
exports.acknowledgeTask = async (req, res) => {
  try {
    if (req.user.role === 'User') {
      return res.status(403).json({ success: false, message: 'Only Admin or Supervisor can acknowledge task completion' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    if (task.status !== 'Completed') {
      return res.status(400).json({ success: false, message: 'Can only acknowledge a completed task' });
    }

    const updated = await Task.findByIdAndUpdate(
      req.params.id,
      { acknowledgedByAdmin: true, acknowledgedAt: new Date() },
      { new: true }
    ).populate('assignedTo', 'name email role').populate('createdBy', 'name');

    req.io?.emit('crm_event', { entity: 'task', action: 'acknowledge', data: updated });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Admin, Supervisor only
exports.deleteTask = async (req, res) => {
  try {
    if (req.user.role === 'User') {
      return res.status(403).json({ success: false, message: 'Users cannot delete tasks' });
    }

    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    if (!(await isInScope(req.user, task.assignedTo))) {
      return res.status(403).json({ success: false, message: 'You are not allowed to delete this task' });
    }
    await task.deleteOne();

    req.io?.emit('crm_event', { entity: 'task', action: 'delete', id: req.params.id });
    
    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get task statistics
// @route   GET /api/tasks/stats
// @access  Private
exports.getTaskStats = async (req, res) => {
  try {
    let query = {};
    
    // Role-based filtering:
    // - Admin     → no filter
    // - Supervisor → no filter
    // - User      → restricted to their own assigned tasks
    if (req.user.role === 'User') {
      query.assignedTo = req.user.id;
    }
    
    const pending = await Task.countDocuments({ ...query, status: 'Pending' });
    const completed = await Task.countDocuments({ ...query, status: 'Completed' });
    const acknowledged = await Task.countDocuments({ ...query, status: 'Completed', acknowledgedByAdmin: true });
    const overdue = await Task.countDocuments({ 
      ...query, 
      status: 'Pending',
      dueDate: { $lt: new Date() }
    });
    
    res.status(200).json({
      success: true,
      data: { pending, completed, acknowledged, overdue }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
