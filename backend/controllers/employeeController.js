const User = require('../models/User');

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private (Admin, Supervisor)
exports.getEmployees = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role } = req.query;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      query.role = role;
    }
    
    // Supervisors can only see their team
    if (req.user.role === 'Supervisor') {
      query.$or = [
        { supervisorId: req.user.id },
        { _id: req.user.id }
      ];
    }
    
    const employees = await User.find(query)
      .populate('supervisorId', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: employees,
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

// @desc    Get single employee
// @route   GET /api/employees/:id
// @access  Private (Admin, Supervisor)
exports.getEmployee = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id).populate('supervisorId', 'name email');
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new employee
// @route   POST /api/employees
// @access  Private (Admin)
exports.createEmployee = async (req, res) => {
  try {
    const employeeData = { ...req.body };
    // An unselected optional supervisor arrives from the form as an empty
    // string, which MongoDB cannot cast to an ObjectId.
    if (!employeeData.supervisorId) delete employeeData.supervisorId;

    const employee = await User.create(employeeData);
    req.io?.emit('crm_event', { entity: 'employee', action: 'create', data: employee });
    
    res.status(201).json({
      success: true,
      data: employee
    });
  } catch (error) {
    const status = error.code === 11000 || error.name === 'ValidationError' ? 400 : 500;
    res.status(status).json({
      success: false,
      message: error.code === 11000 ? 'An employee with this email already exists' : error.message
    });
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private (Admin)
exports.updateEmployee = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const updates = { ...req.body };
    if (!updates.password) delete updates.password;
    if (!updates.supervisorId) updates.supervisorId = null;
    employee.set(updates);
    await employee.save();

    req.io?.emit('crm_event', { entity: 'employee', action: 'update', data: employee });
    
    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    const status = error.code === 11000 || error.name === 'ValidationError' ? 400 : 500;
    res.status(status).json({
      success: false,
      message: error.code === 11000 ? 'An employee with this email already exists' : error.message
    });
  }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private (Admin)
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await User.findByIdAndDelete(req.params.id);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    req.io?.emit('crm_event', { entity: 'employee', action: 'delete', id: req.params.id });
    
    res.status(200).json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get supervisors list
// @route   GET /api/employees/supervisors
// @access  Private (Admin)
exports.getSupervisors = async (req, res) => {
  try {
    const supervisors = await User.find({ role: 'Supervisor' }).select('name email');
    
    res.status(200).json({
      success: true,
      data: supervisors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
