const Customer = require('../models/Customer');
const Lead = require('../models/Lead');
const Task = require('../models/Task');
const User = require('../models/User');

// @desc    AI Assistant - Process commands
// @route   POST /api/ai/chat
// @access  Private (Admin)
exports.processCommand = async (req, res) => {
  try {
    const { command } = req.body;
    
    if (!command) {
      return res.status(400).json({
        success: false,
        message: 'Command is required'
      });
    }
    
    const lowerCommand = command.toLowerCase();
    let response = '';
    
    // Summarize today's activity
    if (lowerCommand.includes('summarize') && lowerCommand.includes('today')) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const customersToday = await Customer.countDocuments({
        createdAt: { $gte: today }
      });
      const leadsToday = await Lead.countDocuments({
        createdAt: { $gte: today }
      });
      const tasksCompleted = await Task.countDocuments({
        status: 'Completed',
        updatedAt: { $gte: today }
      });
      
      response = `📊 Today's Summary:\n• New Customers: ${customersToday}\n• New Leads: ${leadsToday}\n• Tasks Completed: ${tasksCompleted}`;
    }
    
    // Generate follow-up email
    else if (lowerCommand.includes('follow-up') || lowerCommand.includes('follow up')) {
      response = `📧 Follow-up Email Template:\n\nSubject: Following Up on Our Recent Conversation\n\nDear [Customer Name],\n\nI hope this email finds you well. I wanted to follow up on our recent discussion regarding [Product/Service].\n\nI'd be happy to schedule a call to discuss any questions you might have or provide additional information.\n\nPlease let me know what time works best for you.\n\nBest regards,\n[Your Name]`;
    }
    
    // Write customer proposal
    else if (lowerCommand.includes('proposal')) {
      response = `📄 Customer Proposal Template:\n\n[Company Name]\nProposal for [Customer Name]\n\nExecutive Summary:\n[Overview of the proposal]\n\nServices Offered:\n1. [Service 1]\n2. [Service 2]\n3. [Service 3]\n\nTimeline:\n[Project timeline]\n\nPricing:\n[Detailed pricing breakdown]\n\nNext Steps:\n[Action items for the customer]\n\nWe look forward to working with you!`;
    }
    
    // List inactive customers
    else if (lowerCommand.includes('inactive') && lowerCommand.includes('customer')) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const inactiveCustomers = await Customer.find({
        lastContactDate: { $lt: thirtyDaysAgo },
        status: 'Active'
      }).select('name company email');
      
      if (inactiveCustomers.length === 0) {
        response = '✅ No inactive customers found. Great job!';
      } else {
        response = `⚠️ Inactive Customers (${inactiveCustomers.length}):\n`;
        inactiveCustomers.forEach(c => {
          response += `• ${c.name} (${c.company || 'N/A'}) - ${c.email}\n`;
        });
      }
    }
    
    // Show top performing employee
    else if (lowerCommand.includes('top') && lowerCommand.includes('employee')) {
      const topEmployee = await Lead.aggregate([
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
        { $sort: { totalValue: -1 } },
        { $limit: 1 }
      ]);
      
      if (topEmployee.length > 0) {
        const emp = topEmployee[0];
        const conversionRate = ((emp.wonLeads / emp.totalLeads) * 100).toFixed(1);
        response = `🏆 Top Performing Employee:\n• Name: ${emp.user.name}\n• Email: ${emp.user.email}\n• Total Leads: ${emp.totalLeads}\n• Won Leads: ${emp.wonLeads}\n• Conversion Rate: ${conversionRate}%\n• Total Value: $${emp.totalValue.toLocaleString()}`;
      } else {
        response = 'No employee data available yet.';
      }
    }
    
    // Default response
    else {
      response = `I can help you with the following commands:\n\n• "Summarize today's activity"\n• "Generate a follow-up email"\n• "Write a customer proposal"\n• "List inactive customers"\n• "Show the top-performing employee"\n\nPlease try one of these commands.`;
    }
    
    res.status(200).json({
      success: true,
      data: {
        command,
        response
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
