const mongoose = require('mongoose');

const userMovieSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tmdbMovieId: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['watched', 'watching', 'want_to_watch', 'dropped'],
    default: 'want_to_watch',
  },
  rating: {
    type: Number,
    min: 1,
    max: 10,
    default: null,
  },
  watchedDate: {
    type: Date,
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
userMovieSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Compound index to ensure one movie per user
userMovieSchema.index({ userId: 1, tmdbMovieId: 1 }, { unique: true });
userMovieSchema.index({ userId: 1, status: 1 });
userMovieSchema.index({ tmdbMovieId: 1 });

module.exports = mongoose.model('UserMovie', userMovieSchema);

