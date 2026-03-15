const mongoose = require('mongoose');

const listItemSchema = new mongoose.Schema({
  listId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'List',
    required: true,
  },
  tmdbId: {
    type: Number,
    required: true,
  },
  mediaType: {
    type: String,
    enum: ['movie', 'tv'],
    required: true,
  },
  priority: {
    type: Number,
    default: null,
  },
  notes: {
    type: String,
    default: null,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index to ensure one item per list
listItemSchema.index({ listId: 1, tmdbId: 1, mediaType: 1 }, { unique: true });
listItemSchema.index({ listId: 1 });

module.exports = mongoose.model('ListItem', listItemSchema);

