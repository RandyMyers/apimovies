const mongoose = require('mongoose');

const siteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  domain: {
    type: String,
    default: null,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  config: {
    defaultRegion: { type: String, default: null },
    defaultLanguage: { type: String, default: null },
    theme: { type: mongoose.Schema.Types.Mixed, default: null },
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

siteSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Site', siteSchema);
