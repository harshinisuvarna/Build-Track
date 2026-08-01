const mongoose = require('mongoose');
const esignRequestSchema = new mongoose.Schema({
  clientEmail: {
    type: String,
    required: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ['pending', 'signed'],
    default: 'pending',
  },
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  signatureData: {
    type: String,
    default: null,
  },
  signedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600,
  }
});
module.exports = mongoose.model('EsignRequest', esignRequestSchema);
