const AuditLog = require('../models/AuditLog');

const getClientIp = (req) =>
  req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || null;

exports.audit = (action, resourceType = null, resourceId = null, details = null) => {
  return async (req, res, next) => {
    const runAfter = () => {
      if (!req.user) return;
      AuditLog.create({
        userId: req.user._id,
        action,
        resourceType,
        resourceId: resourceId != null ? (typeof resourceId === 'function' ? resourceId(req) : resourceId) : req.params?.id || null,
        details: details != null ? (typeof details === 'function' ? details(req, res) : details) : null,
        ip: getClientIp(req),
      }).catch((err) => console.error('Audit log write failed:', err));
    };
    res.on('finish', () => {
      if (res.statusCode < 400) runAfter();
    });
    next();
  };
};
