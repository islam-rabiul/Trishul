const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  leadName: {
    type: String,
    required: [true, 'Lead name is required'],
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
  source: {
    type: String,
    enum: ['Website', 'Referral', 'Advertisement', 'Social Media', 'Cold Call', 'Other'],
    default: 'Website'
  },
  status: {
    type: String,
    enum: ['New', 'Contacted', 'Interested', 'Won', 'Lost'],
    default: 'New'
  },
  assignedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  estimatedValue: {
    type: Number,
    default: 0
  },
  followUpDate: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

leadSchema.index({ assignedUser: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Lead', leadSchema);
