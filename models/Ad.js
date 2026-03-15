const mongoose = require('mongoose');


const adSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  // Where this ad appears in the UI
  position: {
    type: String,
    required: true, // e.g. 'home-sidebar', 'blog-post-banner', 'calendar-sidebar'
    index: true,
  },
  // Visual type and size hints for the frontend
  type: {
    type: String,
    enum: ['banner', 'sidebar', 'inline'],
    default: 'banner',
  },
  size: {
    type: String,
    enum: ['small', 'medium', 'large'],
    default: 'medium',
  },
  imageUrl: {
    type: String,
    required: true,
  },
  linkUrl: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  impressions: {
    type: Number,
    default: 0,
  },
  clicks: {
    type: Number,
    default: 0,
  },
  // Multi-site: empty = all sites
  siteIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
    },
  ],
  // Targeting
  regions: [
    {
      type: String,
      uppercase: true,
      trim: true,
    },
  ], // e.g. ['US', 'FR']
  languages: [
    {
      type: String,
      lowercase: true,
      trim: true,
    },
  ], // e.g. ['en', 'fr']
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
adSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for querying active ads
adSchema.index({ position: 1, isActive: 1 });
adSchema.index({ regions: 1 });
adSchema.index({ languages: 1 });

module.exports = mongoose.model('Ad', adSchema);







