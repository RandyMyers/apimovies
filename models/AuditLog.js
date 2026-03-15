const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: [
      'blog_create', 'blog_update', 'blog_delete', 'blog_publish', 'blog_unpublish', 'blog_bulk',
      'category_create', 'category_update', 'category_delete',
      'tag_create', 'tag_update', 'tag_delete',
      'ad_create', 'ad_update', 'ad_delete', 'ad_activate', 'ad_deactivate',
      'upload_image',
    ],
  },
  resourceType: { type: String, default: null },
  resourceId: { type: mongoose.Schema.Types.Mixed, default: null },
  details: { type: mongoose.Schema.Types.Mixed, default: null },
  ip: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
