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

// Indexes (slug and name already have unique: true on schema)

module.exports = mongoose.model('BlogTag', blogTagSchema);

