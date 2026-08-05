const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  companyName: {
    type: String,
    default: 'Trishul CRM'
  },
  logo: {
    type: String,
    default: ''
  },
  theme: {
    type: String,
    enum: ['dark', 'light'],
    default: 'dark'
  },
  currency: {
    type: String,
    default: 'USD'
  },
  dateFormat: {
    type: String,
    default: 'MM/DD/YYYY'
  },
  timezone: {
    type: String,
    default: 'UTC'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Setting', settingSchema);
