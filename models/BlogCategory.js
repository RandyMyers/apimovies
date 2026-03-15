const mongoose = require('mongoose');

const blogCategorySchema = new mongoose.Schema({
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
  description: {
    type: String,
    default: null,
  },
  // Translated names and descriptions for different languages
  translations: [
    {
      language: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
      },
      name: String,
      description: String,
    },
  ],
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
blogCategorySchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes
blogCategorySchema.index({ slug: 1 }, { unique: true });
blogCategorySchema.index({ name: 1 }, { unique: true });
blogCategorySchema.index({ 'translations.language': 1 });

module.exports = mongoose.model('BlogCategory', blogCategorySchema);

