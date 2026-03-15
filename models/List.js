const mongoose = require('mongoose');

const listSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: null,
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  listType: {
    type: String,
    enum: ['favorites', 'watchlist', 'custom'],
    required: true,
  },
  coverImage: {
    type: String,
    default: null, // Cloudinary URL
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
listSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes
listSchema.index({ userId: 1, listType: 1 });
listSchema.index({ userId: 1 });
listSchema.index({ isPublic: 1, createdAt: -1 });

module.exports = mongoose.model('List', listSchema);

