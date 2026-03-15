const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema({
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Default language version (usually English)
  title: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  excerpt: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  // Multilingual translations
  translations: [
    {
      language: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
      },
      title: String,
      excerpt: String,
      content: String,
      seoTitle: String,
      seoDescription: String,
      seoKeywords: [String],
    },
  ],
  defaultLanguage: {
    type: String,
    default: 'en',
  },
  // Regions where this post is available (e.g. ['US', 'FR']).
  // If empty, the post is considered global.
  availableRegions: [
    {
      type: String,
      uppercase: true,
      trim: true,
    },
  ],
  featuredImage: {
    type: String,
    default: null,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BlogCategory',
    default: null,
  },
  tags: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BlogTag',
    },
  ],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  },
  publishedAt: {
    type: Date,
    default: null,
  },
  seoTitle: {
    type: String,
    default: null,
  },
  seoDescription: {
    type: String,
    default: null,
  },
  seoKeywords: [
    {
      type: String,
    },
  ],
  viewCount: {
    type: Number,
    default: 0,
  },
  // Multi-site: empty = all sites; otherwise show only on listed sites
  siteIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
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
blogPostSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes
blogPostSchema.index({ status: 1, publishedAt: -1 });
blogPostSchema.index({ categoryId: 1 });
blogPostSchema.index({ tags: 1 });
blogPostSchema.index({ authorId: 1 });
blogPostSchema.index({ createdAt: -1 });
blogPostSchema.index({ 'translations.language': 1 });
blogPostSchema.index({ availableRegions: 1 });

module.exports = mongoose.model('BlogPost', blogPostSchema);

