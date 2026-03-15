const mongoose = require('mongoose');

const episodeTrackingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tmdbTvId: {
    type: Number,
    required: true,
  },
  seasonNumber: {
    type: Number,
    required: true,
  },
  episodeNumber: {
    type: Number,
    required: true,
  },
  episodeId: {
    type: Number,
    required: true, // TMDb episode ID
  },
  isWatched: {
    type: Boolean,
    default: false,
  },
  watchedDate: {
    type: Date,
    default: null,
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
episodeTrackingSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Compound index to ensure one episode tracking per user
episodeTrackingSchema.index(
  { userId: 1, tmdbTvId: 1, seasonNumber: 1, episodeNumber: 1 },
  { unique: true }
);
episodeTrackingSchema.index({ userId: 1, isWatched: 1, watchedDate: -1 });

module.exports = mongoose.model('EpisodeTracking', episodeTrackingSchema);

