const mongoose = require('mongoose');

const userTVShowSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tmdbTvId: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['watching', 'completed', 'want_to_watch', 'dropped', 'on_hold'],
    default: 'want_to_watch',
  },
  currentSeason: {
    type: Number,
    default: 1,
  },
  currentEpisode: {
    type: Number,
    default: 1,
  },
  rating: {
    type: Number,
    min: 1,
    max: 10,
    default: null,
  },
  notes: {
    type: String,
    default: null,
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
userTVShowSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Compound index to ensure one TV show per user
userTVShowSchema.index({ userId: 1, tmdbTvId: 1 }, { unique: true });
userTVShowSchema.index({ userId: 1, status: 1 });
userTVShowSchema.index({ tmdbTvId: 1 });

module.exports = mongoose.model('UserTVShow', userTVShowSchema);

