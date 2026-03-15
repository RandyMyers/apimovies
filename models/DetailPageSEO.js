const mongoose = require('mongoose');

const translationSchema = new mongoose.Schema(
  {
    language: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    keywords: [{ type: String, trim: true }],
  },
  { _id: false }
);

const detailPageSEOSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['movie', 'tv'],
    index: true,
  },
  tmdbMovieId: {
    type: Number,
    default: null,
    index: true,
  },
  tmdbTvId: {
    type: Number,
    default: null,
    index: true,
  },
  displayName: {
    type: String,
    default: '',
    trim: true,
  },
  siteIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
    },
  ],
  metaTitle: {
    type: String,
    required: true,
    trim: true,
  },
  metaDescription: {
    type: String,
    default: '',
    trim: true,
  },
  keywords: [
    {
      type: String,
      trim: true,
    },
  ],
  content: {
    type: String,
    default: '',
    trim: true,
  },
  translations: [translationSchema],
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

detailPageSEOSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

detailPageSEOSchema.index({ type: 1, tmdbMovieId: 1 });
detailPageSEOSchema.index({ type: 1, tmdbTvId: 1 });
detailPageSEOSchema.index({ siteIds: 1, isActive: 1 });

module.exports = mongoose.model('DetailPageSEO', detailPageSEOSchema);
