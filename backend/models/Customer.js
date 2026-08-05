const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Pending', 'New', 'Contacted', 'Interested', 'Won', 'Lost'],
    default: 'Active'
  },
  notes: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastContactDate: {
    type: Date,
    default: null
  },
  totalRevenue: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

customerSchema.index({ createdBy: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Customer', customerSchema);
