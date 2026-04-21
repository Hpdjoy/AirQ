const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['CSV', 'TXT', 'PDF'], required: true },
  date: { type: String, required: true }, // ISO Date string (e.g., YYYY-MM-DD)
  size: { type: String, required: true }, // E.g., '14.2 KB'
  author: { type: String, default: 'System Auto' },
  content: { type: String, required: true }, // The raw CSV or TXT string
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', reportSchema);
