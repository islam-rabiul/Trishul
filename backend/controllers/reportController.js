const Customer = require('../models/Customer');
const Lead = require('../models/Lead');
const Task = require('../models/Task');
const User = require('../models/User');

// ---------------------------------------------------------------------------
// Helper: build a role-scoped query object for use in *contextual* endpoints
// (recent activity, inactive customers, top employees). Summary stat cards
// are intentionally GLOBAL — no role filter — so every user sees the same
// company-wide totals. See getDashboardStats for details.
// ---------------------------------------------------------------------------
async function buildScopeQuery(user) {
  if (user.role === 'Admin') {
    return { scope: 'system', teamUserIds: null };
  }

  if (user.role === 'Supervisor') {
    const supervisedUsers = await User.find({ supervisorId: user.id }).select('_id');
    const teamUserIds = [user.id, ...supervisedUsers.map(u => u._id)];
    return { scope: 'team', teamUserIds };
  }

  // role === 'User'
  return { scope: 'personal', teamUserIds: [user.id] };
}

// ---------------------------------------------------------------------------
// Helper: apply scope to a base query object for a given field name.
// ---------------------------------------------------------------------------
function applyScopeToQuery(baseQuery, field, scopeMeta) {
  const { scope, teamUserIds } = scopeMeta;
  if (scope === 'system') return baseQuery;
  if (scope === 'team')   return { ...baseQuery, [field]: { $in: teamUserIds } };
  return { ...baseQuery, [field]: teamUserIds[0] }; // personal
}

// @desc    Get dashboard statistics
// @route   GET /api/reports/dashboard
// @access  Private
//
// DESIGN DECISION — GLOBAL SUMMARY STATS:
//   The summary metric cards (Total Revenue, Total Customers, Total Leads,
//   Active Employees, Pending Tasks) are intentionally NOT filtered by role.
//   Every authenticated user — Admin, Supervisor, or User — sees the same
//   company-wide grand totals. This is the client requirement.
//
//   Role-scoping is still applied to:
//     • Recent Activities feed  (users see contextually relevant activity)
//     • Monthly trend charts    (users see trends relevant to their scope)
//   These are NOT summary/aggregate cards and benefit from scoping.
//
exports.getDashboardStats = async (req, res) => {
  try {
    // -----------------------------------------------------------------------
    // GLOBAL summary stats — NO role filter applied.
    // All roles see identical company-wide numbers.
    // -----------------------------------------------------------------------
    const totalCustomers   = await Customer.countDocuments({});
    const totalLeads       = await Lead.countDocuments({});
    const activeEmployees  = await User.countDocuments({ role: { $ne: 'Admin' } });
    const pendingTasks     = await Task.countDocuments({ status: 'Pending' });

    // Revenue = SUM of estimatedValue on all Won leads.
    // This is the single source of truth — a lead converted to "Won"
    // contributes its estimated deal value to total revenue.
    const wonLeadsRevenueResult = await Lead.aggregate([
      { $match: { status: 'Won' } },
      { $group: { _id: null, total: { $sum: '$estimatedValue' } } }
    ]);
    const revenue = wonLeadsRevenueResult[0]?.total || 0;

    // -----------------------------------------------------------------------
    // Monthly trend charts — GLOBAL for Admin and Supervisor so the charts
    // show the same company-wide acquisition trends. Only standard Users see
    // their own scoped trends (their own leads / customers they created).
    // -----------------------------------------------------------------------
    const scopeMeta = await buildScopeQuery(req.user);

    // For charts: Admin & Supervisor → no filter (global). User → scoped.
    const chartLeadQuery     = req.user.role === 'User'
      ? applyScopeToQuery({}, 'assignedUser', scopeMeta)
      : {};
    const chartCustomerQuery = req.user.role === 'User'
      ? applyScopeToQuery({}, 'createdBy', scopeMeta)
      : {};

    const monthlyLeads = await Lead.aggregate([
      { $match: chartLeadQuery },
      {
        $group: {
          _id: {
            year:  { $year:  '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    const monthlyCustomers = await Customer.aggregate([
      { $match: chartCustomerQuery },
      {
        $group: {
          _id: {
            year:  { $year:  '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    // -----------------------------------------------------------------------
    // Recent Activities feed — GLOBAL for Admin and Supervisor so they see
    // all company activity. Scoped only for standard User role.
    // -----------------------------------------------------------------------
    const activityLeadQuery     = req.user.role === 'User'
      ? applyScopeToQuery({}, 'assignedUser', scopeMeta)
      : {};
    const activityCustomerQuery = req.user.role === 'User'
      ? applyScopeToQuery({}, 'createdBy', scopeMeta)
      : {};
    const taskQuery = req.user.role === 'User'
      ? applyScopeToQuery({}, 'assignedTo', scopeMeta)
      : {};

    const recentCustomers = await Customer.find(activityCustomerQuery)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentLeads = await Lead.find(activityLeadQuery)
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
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);

    res.status(200).json({
      success: true,
      data: {
        // 'scope' = 'global' signals to the frontend that summary cards show
        // company-wide totals regardless of who is logged in.
        scope: 'global',
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
    // Supervisors see their team's performance; Admin sees everyone.
    const scopeMeta = await buildScopeQuery(req.user);

    let initialMatch = {};
    if (scopeMeta.scope === 'team') {
      initialMatch = { assignedUser: { $in: scopeMeta.teamUserIds } };
    }

    const topEmployees = await Lead.aggregate([
      ...(Object.keys(initialMatch).length > 0 ? [{ $match: initialMatch }] : []),
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
              {
                $cond: [
                  { $eq: ['$totalLeads', 0] },
                  0,
                  { $divide: ['$wonLeads', '$totalLeads'] }
                ]
              },
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

    const scopeMeta = await buildScopeQuery(req.user);
    const baseQuery = {
      lastContactDate: { $lt: thirtyDaysAgo },
      status: 'Active'
    };
    const query = applyScopeToQuery(baseQuery, 'createdBy', scopeMeta);

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
