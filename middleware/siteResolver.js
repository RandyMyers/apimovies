const Site = require('../models/Site');

/**
 * Resolves site from query (?site=slug) or header (X-Site-Slug).
 * Sets req.siteId (ObjectId) and req.siteSlug when a valid site is found.
 * If no site param or invalid slug, req.siteId remains undefined (no filter = all sites).
 */
async function resolveSite(req, res, next) {
  const slug = req.query.site || req.get('X-Site-Slug') || req.get('x-site-slug');
  if (!slug || typeof slug !== 'string') {
    return next();
  }
  const trimmed = slug.trim().toLowerCase();
  if (!trimmed) return next();
  try {
    const site = await Site.findOne({ slug: trimmed, isActive: true }).select('_id slug').lean();
    if (site) {
      req.siteId = site._id;
      req.siteSlug = site.slug;
    }
  } catch (err) {
    // Non-fatal; continue without site filter
  }
  next();
}

/**
 * Mongo condition: show documents where siteIds is empty OR contains siteId.
 */
function siteFilter(siteId) {
  if (!siteId) return {};
  return {
    $or: [
      { siteIds: { $size: 0 } },
      { siteIds: siteId },
    ],
  };
}

module.exports = { resolveSite, siteFilter };
