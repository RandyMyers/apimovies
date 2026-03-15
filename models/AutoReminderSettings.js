const mongoose = require('mongoose');

const autoReminderSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tmdbTvId: {
    type: Number,
    required: true,
  },
  isEnabled: {
    type: Boolean,
    default: true,
  },
  reminderMinutes: {
    type: Number,
    default: 60, // Minutes before episode airs
  },
  notificationMethod: {
    type: String,
    enum: ['email', 'push', 'in_app'],
    default: 'in_app',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update updatedAt on save
autoReminderSettingsSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Compound index to ensure one setting per user per show
autoReminderSettingsSchema.index({ userId: 1, tmdbTvId: 1 }, { unique: true });

module.exports = mongoose.model('AutoReminderSettings', autoReminderSettingsSchema);

