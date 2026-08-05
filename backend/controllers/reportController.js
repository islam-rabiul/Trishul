const Customer = require('../models/Customer');
const Lead = require('../models/Lead');
const Task = require('../models/Task');
const User = require('../models/User');

// @desc    Get dashboard statistics
// @route   GET /api/reports/dashboard
// @access  Private
exports.getDashboardStats = async (req, res) => {
  try {
    let customerQuery = {};
    let leadQuery = {};
    let taskQuery = {};
    
    // Role-based filtering
    if (req.user.role === 'User') {
      customerQuery.createdBy = req.user.id;
      leadQuery.assignedUser = req.user.id;
      taskQuery.assignedTo = req.user.id;
    } else if (req.user.role === 'Supervisor') {
      const supervisedUsers = await User.find({ supervisorId: req.user.id }).select('_id');
      const userIds = supervisedUsers.map(u => u._id);
      userIds.push(req.user.id);
      customerQuery.createdBy = { $in: userIds };
      leadQuery.assignedUser = { $in: userIds };
      taskQuery.assignedTo = { $in: userIds };
    }
    
    const totalCustomers = await Customer.countDocuments(customerQuery);
    const totalLeads = await Lead.countDocuments(leadQuery);
    const activeEmployees = await User.countDocuments({ role: { $ne: 'Admin' } });
    const pendingTasks = await Task.countDocuments({ ...taskQuery, status: 'Pending' });
    
    // Calculate revenue (sum of customer revenue + won leads estimated value)
    const customerRevenueResult = await Customer.aggregate([
      { $match: customerQuery },
      { $group: { _id: null, total: { $sum: '$totalRevenue' } } }
    ]);
    const customerRevenue = customerRevenueResult[0]?.total || 0;

    const wonLeadsRevenueResult = await Lead.aggregate([
      { $match: { ...leadQuery, status: 'Won' } },
      { $group: { _id: null, total: { $sum: '$estimatedValue' } } }
    ]);
    const wonLeadsRevenue = wonLeadsRevenueResult[0]?.total || 0;

    const revenue = customerRevenue + wonLeadsRevenue;
    
    // Monthly leads trend
    const monthlyLeads = await Lead.aggregate([
      { $match: leadQuery },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);
    
    // Monthly customer growth
    const monthlyCustomers = await Customer.aggregate([
      { $match: customerQuery },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);
    
    // Recent activities from real DB data
    const recentCustomers = await Customer.find(customerQuery)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(5);
    
    const recentLeads = await Lead.find(leadQuery)
      .populate('assignedUser', 'name')
      .sort({ updatedAt: -1 })
      .limit(5);

    const recentTasks = await Task.find(taskQuery)
      .populate('assignedTo', 'name')
      .sort({ updatedAt: -1 })
      .limit(5);

    const activities = [
      ...recentCustomers.map(c => ({
        _id: c._id,
        action: `New customer "${c.name}" added (${c.status})`,
        user: c.createdBy?.name || 'System Admin',
        type: 'customer',
        createdAt: c.createdAt
      })),
      ...recentLeads.map(l => ({
        _id: l._id,
        action: `Lead "${l.leadName}" status is ${l.status}`,
        user: l.assignedUser?.name || 'Unassigned',
        type: 'lead',
        createdAt: l.updatedAt || l.createdAt
      })),
      ...recentTasks.map(t => ({
        _id: t._id,
        action: `Task "${t.title}" ${t.status === 'Completed' ? 'completed' : 'updated'}`,
        user: t.assignedTo?.name || 'Team Member',
        type: 'task',
        createdAt: t.updatedAt || t.createdAt
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8);
    
    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalCustomers,
          totalLeads,
          activeEmployees,
          revenue,
          pendingTasks
        },
        trends: {
          monthlyLeads,
          monthlyCustomers
        },
        recentActivities: activities
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get top performing employees
// @route   GET /api/reports/top-employees
// @access  Private (Admin, Supervisor)
exports.getTopEmployees = async (req, res) => {
  try {
    const topEmployees = await Lead.aggregate([
      {
        $group: {
          _id: '$assignedUser',
          totalLeads: { $sum: 1 },
          wonLeads: {
            $sum: { $cond: [{ $eq: ['$status', 'Won'] }, 1, 0] }
          },
          totalValue: { $sum: '$estimatedValue' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          name: '$user.name',
          email: '$user.email',
          totalLeads: 1,
          wonLeads: 1,
          totalValue: 1,
          conversionRate: {
            $multiply: [
              { $divide: ['$wonLeads', '$totalLeads'] },
              100
            ]
          }
        }
      },
      { $sort: { totalValue: -1 } },
      { $limit: 10 }
    ]);
    
    res.status(200).json({
      success: true,
      data: topEmployees
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get inactive customers
// @route   GET /api/reports/inactive-customers
// @access  Private
exports.getInactiveCustomers = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    let query = {
      lastContactDate: { $lt: thirtyDaysAgo },
      status: 'Active'
    };
    
    if (req.user.role === 'User') {
      query.createdBy = req.user.id;
    } else if (req.user.role === 'Supervisor') {
      const supervisedUsers = await User.find({ supervisorId: req.user.id }).select('_id');
      const userIds = supervisedUsers.map(u => u._id);
      userIds.push(req.user.id);
      query.createdBy = { $in: userIds };
    }
    
    const inactiveCustomers = await Customer.find(query)
      .populate('createdBy', 'name')
      .sort({ lastContactDate: 1 });
    
    res.status(200).json({
      success: true,
      data: inactiveCustomers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
