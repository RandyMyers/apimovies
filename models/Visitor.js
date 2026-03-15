const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  ip: { type: String, required: true },
  userAgent: { type: String, required: true },
  city: { type: String, default: null },
  region: { type: String, default: null },
  country: { type: String, default: null },
  deviceType: { type: String, enum: ['mobile', 'tablet', 'desktop'], default: 'desktop' },
  platform: { type: String, default: null },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  lastSeenAt: { type: Date, default: Date.now },
  visitCount: { type: Number, default: 1 },
}, { timestamps: true });

visitorSchema.index({ ip: 1, userAgent: 1 });
visitorSchema.index({ lastSeenAt: -1 });
visitorSchema.index({ userId: 1 });

module.exports = mongoose.model('Visitor', visitorSchema);
