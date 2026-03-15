const mongoose = require('mongoose');

const productDealSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  shortDescription: {
    type: String,
    default: '',
  },
  imageUrl: {
    type: String,
    default: null,
  },
  linkUrl: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['product', 'deal', 'coupon'],
    default: 'product',
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
  displayOrder: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  // Phase 3: siteIds when Site model exists. For now empty = all.
  siteIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
  }],
  regions: [{
    type: String,
    uppercase: true,
    trim: true,
  }],
  startDate: {
    type: Date,
    default: null,
  },
  endDate: {
    type: Date,
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

productDealSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

productDealSchema.index({ tmdbMovieId: 1, isActive: 1 });
productDealSchema.index({ tmdbTvId: 1, isActive: 1 });

module.exports = mongoose.model('ProductDeal', productDealSchema);
