const mongoose = require('mongoose');

const blogTagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes
blogTagSchema.index({ slug: 1 }, { unique: true });
blogTagSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model('BlogTag', blogTagSchema);

