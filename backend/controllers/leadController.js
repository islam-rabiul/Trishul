const Lead = require('../models/Lead');
const User = require('../models/User');
const { isInScope } = require('../utils/access');

// @desc    Get all leads
// @route   GET /api/leads
// @access  Private
exports.getLeads = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, source } = req.query;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { leadName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    if (source) {
      query.source = source;
    }
    
    // Role-based filtering
    if (req.user.role === 'User') {
      query.assignedUser = req.user.id;
    } else if (req.user.role === 'Supervisor') {
      const supervisedUsers = await User.find({ supervisorId: req.user.id }).select('_id');
      const userIds = supervisedUsers.map(u => u._id);
      userIds.push(req.user.id);
      query.assignedUser = { $in: userIds };
    }
    
    const leads = await Lead.find(query)
      .populate('assignedUser', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Lead.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: leads,
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

// @desc    Get single lead
// @route   GET /api/leads/:id
// @access  Private
exports.getLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id).populate('assignedUser', 'name email');
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }
    if (!(await isInScope(req.user, lead.assignedUser))) {
      return res.status(403).json({ success: false, message: 'You are not allowed to access this lead' });
    }
    
    res.status(200).json({
      success: true,
      data: lead
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new lead
// @route   POST /api/leads
// @access  Private
exports.createLead = async (req, res) => {
  try {
    const leadData = { ...req.body };
    if (req.user.role === 'User') leadData.assignedUser = req.user.id;
    if (leadData.assignedUser && !(await isInScope(req.user, leadData.assignedUser))) {
      return res.status(403).json({ success: false, message: 'You can only assign leads within your team' });
    }
    const lead = await Lead.create(leadData);
    req.io?.emit('crm_event', { entity: 'lead', action: 'create', data: lead });
    
    res.status(201).json({
      success: true,
      data: lead
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update lead
// @route   PUT /api/leads/:id
// @access  Private
exports.updateLead = async (req, res) => {
  try {
    const existingLead = await Lead.findById(req.params.id);
    if (!existingLead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }
    if (!(await isInScope(req.user, existingLead.assignedUser))) {
      return res.status(403).json({ success: false, message: 'You are not allowed to update this lead' });
    }
    const updates = { ...req.body };
    if (req.user.role === 'User') delete updates.assignedUser;
    if (updates.assignedUser && !(await isInScope(req.user, updates.assignedUser))) {
      return res.status(403).json({ success: false, message: 'You can only assign leads within your team' });
    }
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    req.io?.emit('crm_event', { entity: 'lead', action: 'update', data: lead });
    
    res.status(200).json({
      success: true,
      data: lead
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete lead
// @route   DELETE /api/leads/:id
// @access  Private
exports.deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }
    if (!(await isInScope(req.user, lead.assignedUser))) {
      return res.status(403).json({ success: false, message: 'You are not allowed to delete this lead' });
    }
    await lead.deleteOne();

    req.io?.emit('crm_event', { entity: 'lead', action: 'delete', id: req.params.id });
    
    res.status(200).json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get lead statistics
// @route   GET /api/leads/stats
// @access  Private
exports.getLeadStats = async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'User') {
      query.assignedUser = req.user.id;
    } else if (req.user.role === 'Supervisor') {
      const supervisedUsers = await User.find({ supervisorId: req.user.id }).select('_id');
      const userIds = supervisedUsers.map(u => u._id);
      userIds.push(req.user.id);
      query.assignedUser = { $in: userIds };
    }
    
    const stats = await Lead.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$estimatedValue' }
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
