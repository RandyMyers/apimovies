const mongoose = require('mongoose');

const analyticsEventSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['page_view', 'user_action'],
  },
  sessionId: { type: String, default: null },
  visitorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Visitor', default: null },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  path: { type: String, default: null },
  action: { type: String, default: null },
  resourceType: { type: String, default: null },
  resourceId: { type: mongoose.Schema.Types.Mixed, default: null },
  locale: { type: String, default: null },
  region: { type: String, default: null },
  country: { type: String, default: null },
  city: { type: String, default: null },
  referrer: { type: String, default: null },
  userAgent: { type: String, default: null },
  deviceType: { type: String, enum: ['mobile', 'tablet', 'desktop'], default: null },
  timestamp: { type: Date, default: Date.now },
});

analyticsEventSchema.index({ timestamp: -1 });
analyticsEventSchema.index({ type: 1, timestamp: -1 });
analyticsEventSchema.index({ locale: 1, timestamp: -1 });
analyticsEventSchema.index({ region: 1, timestamp: -1 });
analyticsEventSchema.index({ country: 1, timestamp: -1 });
analyticsEventSchema.index({ sessionId: 1, timestamp: -1 });
analyticsEventSchema.index({ resourceType: 1, resourceId: 1, timestamp: -1 });
analyticsEventSchema.index({ path: 1, timestamp: -1 });
analyticsEventSchema.index({ visitorId: 1, timestamp: -1 });

module.exports = mongoose.model('AnalyticsEvent', analyticsEventSchema);
