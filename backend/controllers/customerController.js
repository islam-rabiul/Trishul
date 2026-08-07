const Customer = require('../models/Customer');
const User = require('../models/User');
const { isInScope } = require('../utils/access');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
exports.getCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    // All roles (Admin, Supervisor, User) see the full customer list — read-only
    // access is enforced in the UI and on mutating routes (POST/PUT/DELETE).
    
    const customers = await Customer.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Customer.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: customers,
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

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private
exports.getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).populate('createdBy', 'name email');
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    // All authenticated users can view any customer record (read-only).
    // Mutating operations (update/delete) are restricted to Admin at route level.
    
    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new customer
// @route   POST /api/customers
// @access  Private
exports.createCustomer = async (req, res) => {
  try {
    const customer = await Customer.create({
      ...req.body,
      createdBy: req.user.id
    });

    req.io?.emit('crm_event', { entity: 'customer', action: 'create', data: customer });
    
    res.status(201).json({
      success: true,
      data: customer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
exports.updateCustomer = async (req, res) => {
  try {
    const existingCustomer = await Customer.findById(req.params.id);
    if (!existingCustomer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    if (!(await isInScope(req.user, existingCustomer.createdBy))) {
      return res.status(403).json({ success: false, message: 'You are not allowed to update this customer' });
    }
    const updates = { ...req.body };
    delete updates.createdBy;
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    req.io?.emit('crm_event', { entity: 'customer', action: 'update', data: customer });
    
    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    if (!(await isInScope(req.user, customer.createdBy))) {
      return res.status(403).json({ success: false, message: 'You are not allowed to delete this customer' });
    }
    await customer.deleteOne();

    req.io?.emit('crm_event', { entity: 'customer', action: 'delete', id: req.params.id });
    
    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
