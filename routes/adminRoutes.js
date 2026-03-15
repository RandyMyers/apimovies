const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const adminController = require('../controllers/adminController');
const analyticsController = require('../controllers/analyticsController');
const Ad = require('../models/Ad');
const ProductDeal = require('../models/ProductDeal');
const Site = require('../models/Site');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const List = require('../models/List');
const ListItem = require('../models/ListItem');
const UserMovie = require('../models/UserMovie');
const UserTVShow = require('../models/UserTVShow');
const Review = require('../models/Review');
const detailSeoController = require('../controllers/detailSeoController');
const { authenticate, isAdmin, isAdminOrEditor } = require('../middleware/auth');
const { audit } = require('../middleware/auditLog');

// Analytics: visitors aggregate (admin only) - enriched with unique visitors, top countries, devices
router.get('/analytics/visitors', authenticate, isAdmin, async (req, res) => {
  try {
    const from = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = req.query.to ? new Date(req.query.to) : new Date();
    const groupBy = req.query.groupBy || 'day';
    const match = { type: 'page_view', timestamp: { $gte: from, $lte: to } };

    let group = {};
    if (groupBy === 'day') {
      group = { _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }, count: { $sum: 1 }, uniqueVisitors: { $addToSet: { $ifNull: ['$visitorId', '$sessionId'] } } };
    } else if (groupBy === 'locale') {
      group = { _id: { $ifNull: ['$locale', 'unknown'] }, count: { $sum: 1 }, uniqueVisitors: { $addToSet: { $ifNull: ['$visitorId', '$sessionId'] } } };
    } else if (groupBy === 'region') {
      group = { _id: { $ifNull: ['$region', 'unknown'] }, count: { $sum: 1 }, uniqueVisitors: { $addToSet: { $ifNull: ['$visitorId', '$sessionId'] } } };
    } else if (groupBy === 'country') {
      group = { _id: { $ifNull: ['$country', 'unknown'] }, count: { $sum: 1 }, uniqueVisitors: { $addToSet: { $ifNull: ['$visitorId', '$sessionId'] } }, devices: { $push: { $ifNull: ['$deviceType', 'desktop'] } } };
    } else if (groupBy === 'source') {
      group = { _id: { $cond: [{ $and: [{ $ne: ['$referrer', null] }, { $ne: ['$referrer', ''] }] }, '$referrer', 'direct'] }, count: { $sum: 1 }, uniqueVisitors: { $addToSet: { $ifNull: ['$visitorId', '$sessionId'] } } };
    } else {
      group = { _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }, count: { $sum: 1 }, uniqueVisitors: { $addToSet: { $ifNull: ['$visitorId', '$sessionId'] } } };
    }

    const [totalResult, uniqueResult, byGroupRaw, topCountriesRaw, topDevicesRaw] = await Promise.all([
      AnalyticsEvent.countDocuments(match),
      AnalyticsEvent.aggregate([
        { $match: match },
        { $group: { _id: { $ifNull: ['$visitorId', '$sessionId'] } } },
        { $count: 'count' },
      ]),
      AnalyticsEvent.aggregate([
        { $match: match },
        { $group: group },
        { $project: { _id: 1, count: 1, uniqueVisitors: { $size: '$uniqueVisitors' }, devices: 1 } },
        { $sort: { count: -1 } },
        { $limit: 100 },
      ]),
      AnalyticsEvent.aggregate([
        { $match: match },
        { $group: { _id: { $ifNull: ['$country', 'unknown'] }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      AnalyticsEvent.aggregate([
        { $match: match },
        { $group: { _id: { $ifNull: ['$deviceType', 'desktop'] }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]);

    const total = totalResult;
    const uniqueVisitors = uniqueResult[0]?.count ?? 0;
    const byGroup = byGroupRaw.map((r) => ({ _id: r._id, count: r.count, uniqueVisitors: r.uniqueVisitors ?? 0, devices: r.devices }));
    const topCountries = topCountriesRaw.map((c) => ({ country: c._id, count: c.count })).filter((c) => c.country !== 'unknown');
    const topDevices = topDevicesRaw.map((d) => ({ device: d._id, count: d.count }));

    res.json({ total, uniqueVisitors, from, to, groupBy, byGroup, topCountries, topDevices });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analytics: top movies (admin only)
router.get('/analytics/top-movies', authenticate, isAdmin, analyticsController.getTopMovies);

// Analytics: top TV shows (admin only)
router.get('/analytics/top-tv-shows', authenticate, isAdmin, analyticsController.getTopTVShows);

// Analytics: top pages (admin only)
router.get('/analytics/top-pages', authenticate, isAdmin, async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const from = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = req.query.to ? new Date(req.query.to) : new Date();
    const match = { type: 'page_view', path: { $exists: true, $ne: null, $ne: '' }, timestamp: { $gte: from, $lte: to } };

    const pathStats = await AnalyticsEvent.aggregate([
      { $match: match },
      {
        $group: {
          _id: { path: '$path', locale: { $ifNull: ['$locale', 'unknown'] } },
          viewCount: { $sum: 1 },
          uniqueVisitors: { $addToSet: { $ifNull: ['$visitorId', '$sessionId'] } },
          countries: { $push: { $ifNull: ['$country', 'unknown'] } },
          devices: { $push: { $ifNull: ['$deviceType', 'desktop'] } },
          referrers: { $push: { $cond: [{ $and: [{ $ne: ['$referrer', null] }, { $ne: ['$referrer', ''] }] }, '$referrer', 'direct'] } },
          lastViewed: { $max: '$timestamp' },
        },
      },
      {
        $project: {
          pagePath: '$_id.path',
          languageCode: '$_id.locale',
          viewCount: 1,
          uniqueVisitors: { $size: '$uniqueVisitors' },
          lastViewed: 1,
          countries: 1,
          devices: 1,
          referrers: 1,
        },
      },
      { $sort: { viewCount: -1 } },
      { $limit: limit },
    ]);

    const topPages = pathStats.map((p) => {
      const countryCounts = {};
      (p.countries || []).forEach((c) => { countryCounts[c] = (countryCounts[c] || 0) + 1; });
      const deviceCounts = {};
      (p.devices || []).forEach((d) => { deviceCounts[d] = (deviceCounts[d] || 0) + 1; });
      const referrerCounts = {};
      (p.referrers || []).forEach((r) => { referrerCounts[r] = (referrerCounts[r] || 0) + 1; });
      return {
        pagePath: p.pagePath,
        languageCode: p.languageCode || 'en',
        viewCount: p.viewCount,
        uniqueVisitors: p.uniqueVisitors,
        lastViewed: p.lastViewed,
        countries: Object.entries(countryCounts).map(([country, count]) => ({ country, count })).sort((a, b) => b.count - a.count).slice(0, 5),
        devices: Object.entries(deviceCounts).map(([device, count]) => ({ device, count })).sort((a, b) => b.count - a.count).slice(0, 5),
        referrers: Object.entries(referrerCounts).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count).slice(0, 5),
      };
    });

    res.json({ topPages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analytics: live activity - active visitors (admin only)
router.get('/analytics/live', authenticate, isAdmin, async (req, res) => {
  try {
    const activeWindowMs = 5 * 60 * 1000; // 5 minutes
    const since = new Date(Date.now() - activeWindowMs);
    const match = { type: 'page_view', timestamp: { $gte: since } };

    const sessions = await AnalyticsEvent.aggregate([
      { $match: match },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: { $ifNull: ['$visitorId', '$sessionId'] },
          currentPage: { $first: '$path' },
          languageCode: { $first: { $ifNull: ['$locale', 'en'] } },
          lastActivity: { $first: '$timestamp' },
          sessionStart: { $min: '$timestamp' },
          pageViewsInSession: { $sum: 1 },
          country: { $first: { $ifNull: ['$country', null] } },
          city: { $first: { $ifNull: ['$city', null] } },
          deviceType: { $first: { $ifNull: ['$deviceType', 'desktop'] } },
          referrer: { $first: '$referrer' },
          userId: { $first: '$userId' },
          visitorId: { $first: '$visitorId' },
        },
      },
      { $sort: { lastActivity: -1 } },
      { $limit: 50 },
      {
        $lookup: {
          from: 'visitors',
          localField: 'visitorId',
          foreignField: '_id',
          as: 'visitor',
          pipeline: [{ $project: { country: 1, city: 1 } }],
        },
      },
      { $unwind: { path: '$visitor', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
          pipeline: [{ $project: { username: 1, email: 1 } }],
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    ]);

    const liveVisitors = sessions.map((s) => ({
      visitorId: s._id,
      currentPage: s.currentPage,
      languageCode: s.languageCode,
      lastActivity: s.lastActivity,
      sessionStart: s.sessionStart,
      pageViewsInSession: s.pageViewsInSession,
      country: s.country || s.visitor?.country || null,
      city: s.city || s.visitor?.city || null,
      deviceType: s.deviceType,
      referrer: s.referrer,
      username: s.user?.username || s.user?.email || 'Guest',
      timeOnPage: 0,
      sessionDuration: Math.round((new Date(s.lastActivity) - new Date(s.sessionStart)) / 1000),
      isActive: true,
    }));

    res.json({ success: true, data: liveVisitors });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analytics: recent activity with filters (admin only)
router.get('/analytics/activity', authenticate, isAdmin, async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const skip = (page - 1) * limit;
    const { type, userId, from, to } = req.query;

    const query = {};
    if (type && type !== 'all') {
      if (type === 'view') query.type = 'page_view';
      else if (type === 'interaction' || type === 'usage') query.type = 'user_action';
      if (type === 'interaction') query.action = { $nin: ['watchlist_add', 'favorite_add', 'rate', 'track_movie', 'track_tv', 'blog_view'] };
      else if (type === 'usage') query.action = { $in: ['watchlist_add', 'favorite_add', 'rate', 'track_movie', 'track_tv', 'blog_view'] };
    }
    if (userId) query.userId = userId;
    if (from || to) {
      query.timestamp = {};
      if (from) query.timestamp.$gte = new Date(from);
      if (to) query.timestamp.$lte = new Date(to + 'T23:59:59.999');
    }

    const [events, total] = await Promise.all([
      AnalyticsEvent.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'username email')
        .select('type sessionId visitorId path action resourceType resourceId locale region country city deviceType referrer timestamp')
        .lean(),
      AnalyticsEvent.countDocuments(query),
    ]);

    res.json({
      events,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Audit logs list (admin only)
router.get('/audit-logs', authenticate, isAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const { userId, action, from, to } = req.query;
    const query = {};
    if (userId) query.userId = userId;
    if (action) query.action = action;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }
    const [logs, total] = await Promise.all([
      AuditLog.find(query).populate('userId', 'username email').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments(query),
    ]);
    res.json({
      logs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Image upload (Cloudinary) - admin/editor
router.post('/upload/image', authenticate, isAdminOrEditor, audit('upload_image'), async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'No file uploaded. Use field name "file".' });
    }
    const file = req.files.file;
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type. Use JPEG, PNG, GIF, or WebP.' });
    }
    if (!file.data) {
      return res.status(400).json({ error: 'Could not read file data.' });
    }
    const b64 = Buffer.isBuffer(file.data) ? file.data.toString('base64') : Buffer.from(file.data).toString('base64');
    const dataUri = `data:${file.mimetype};base64,${b64}`;
    const folder = req.query.folder || 'cinehub-ads';
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: folder === 'blog' ? 'cinehub-blog' : folder,
      resource_type: 'image',
    });
    res.json({ url: result.secure_url, publicId: result.public_id });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
});

// Blog Management Routes
router.get('/blog/posts', authenticate, isAdminOrEditor, adminController.getAllBlogPosts);
router.get('/blog/posts/:id', authenticate, isAdminOrEditor, adminController.getBlogPost);
router.post('/blog/posts', authenticate, isAdminOrEditor, audit('blog_create', 'blog'), adminController.createBlogPost);
router.put('/blog/posts/:id', authenticate, isAdminOrEditor, audit('blog_update', 'blog'), adminController.updateBlogPost);
router.delete('/blog/posts/:id', authenticate, isAdmin, audit('blog_delete', 'blog'), adminController.deleteBlogPost);
router.post('/blog/posts/:id/publish', authenticate, isAdminOrEditor, audit('blog_publish', 'blog'), adminController.publishPost);
router.post('/blog/posts/:id/unpublish', authenticate, isAdminOrEditor, audit('blog_unpublish', 'blog'), adminController.unpublishPost);
router.post('/blog/posts/bulk', authenticate, isAdmin, audit('blog_bulk', 'blog'), adminController.bulkBlogActions);

// Category Management
router.get('/blog/categories', authenticate, isAdminOrEditor, adminController.getCategories);
router.post('/blog/categories', authenticate, isAdmin, audit('category_create', 'category'), adminController.createCategory);
router.put('/blog/categories/:id', authenticate, isAdmin, audit('category_update', 'category'), adminController.updateCategory);
router.delete('/blog/categories/:id', authenticate, isAdmin, audit('category_delete', 'category'), adminController.deleteCategory);

// Tag Management
router.get('/blog/tags', authenticate, isAdminOrEditor, adminController.getTags);
router.post('/blog/tags', authenticate, isAdmin, audit('tag_create', 'tag'), adminController.createTag);
router.put('/blog/tags/:id', authenticate, isAdmin, audit('tag_update', 'tag'), adminController.updateTag);
router.delete('/blog/tags/:id', authenticate, isAdmin, audit('tag_delete', 'tag'), adminController.deleteTag);

// Simple Ad Management (CRUD)
router.get('/ads', authenticate, isAdmin, async (req, res) => {
  try {
    const ads = await Ad.find().sort({ createdAt: -1 }).lean();
    res.json({ ads });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/ads', authenticate, isAdmin, audit('ad_create', 'ad'), async (req, res) => {
  try {
    const ad = await Ad.create(req.body);
    res.status(201).json({ ad });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/ads/:id', authenticate, isAdmin, audit('ad_update', 'ad'), async (req, res) => {
  try {
    const { id } = req.params;
    const ad = await Ad.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!ad) {
      return res.status(404).json({ error: 'Ad not found' });
    }
    res.json({ ad });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/ads/:id', authenticate, isAdmin, audit('ad_delete', 'ad'), async (req, res) => {
  try {
    const { id } = req.params;
    const ad = await Ad.findByIdAndDelete(id);
    if (!ad) {
      return res.status(404).json({ error: 'Ad not found' });
    }
    res.json({ message: 'Ad deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/ads/:id/activate', authenticate, isAdmin, audit('ad_activate', 'ad'), async (req, res) => {
  try {
    const { id } = req.params;
    const ad = await Ad.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true }
    );
    if (!ad) {
      return res.status(404).json({ error: 'Ad not found' });
    }
    res.json({ ad });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/ads/:id/deactivate', authenticate, isAdmin, audit('ad_deactivate', 'ad'), async (req, res) => {
  try {
    const { id } = req.params;
    const ad = await Ad.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    if (!ad) {
      return res.status(404).json({ error: 'Ad not found' });
    }
    res.json({ ad });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== Sites (multi-client) ==========
router.get('/sites', authenticate, isAdmin, async (req, res) => {
  try {
    const sites = await Site.find().sort({ slug: 1 }).lean();
    res.json({ sites });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/sites', authenticate, isAdmin, audit('site_create', 'site'), async (req, res) => {
  try {
    const site = await Site.create(req.body);
    res.status(201).json({ site });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/sites/:id', authenticate, isAdmin, audit('site_update', 'site'), async (req, res) => {
  try {
    const { id } = req.params;
    const site = await Site.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }
    res.json({ site });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/sites/:id', authenticate, isAdmin, audit('site_delete', 'site'), async (req, res) => {
  try {
    const { id } = req.params;
    const site = await Site.findByIdAndDelete(id);
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }
    res.json({ message: 'Site deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== Detail Page SEO (curated movie/TV meta) ==========
router.get('/detail-seo', authenticate, isAdmin, detailSeoController.list);
router.get('/detail-seo/:id', authenticate, isAdmin, detailSeoController.getOne);
router.post('/detail-seo', authenticate, isAdmin, audit('detail_seo_create', 'detail_seo'), detailSeoController.create);
router.put('/detail-seo/:id', authenticate, isAdmin, audit('detail_seo_update', 'detail_seo'), detailSeoController.update);
router.delete('/detail-seo/:id', authenticate, isAdmin, audit('detail_seo_delete', 'detail_seo'), detailSeoController.delete);

// ========== Product Deals (affiliate products/deals/coupons) ==========
router.get('/product-deals', authenticate, isAdmin, async (req, res) => {
  try {
    const deals = await ProductDeal.find().sort({ displayOrder: 1, createdAt: -1 }).lean();
    res.json({ deals });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/product-deals', authenticate, isAdmin, audit('product_deal_create', 'product_deal'), async (req, res) => {
  try {
    const deal = await ProductDeal.create(req.body);
    res.status(201).json({ deal });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/product-deals/:id', authenticate, isAdmin, audit('product_deal_update', 'product_deal'), async (req, res) => {
  try {
    const { id } = req.params;
    const deal = await ProductDeal.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!deal) {
      return res.status(404).json({ error: 'Product deal not found' });
    }
    res.json({ deal });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/product-deals/:id', authenticate, isAdmin, audit('product_deal_delete', 'product_deal'), async (req, res) => {
  try {
    const { id } = req.params;
    const deal = await ProductDeal.findByIdAndDelete(id);
    if (!deal) {
      return res.status(404).json({ error: 'Product deal not found' });
    }
    res.json({ message: 'Product deal deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== User Management (admin only) ==========
router.get('/users', authenticate, isAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const { search, role, isActive } = req.query;

    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined && isActive !== '') {
      query.isActive = isActive === 'true';
    }
    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { email: { $regex: s, $options: 'i' } },
        { username: { $regex: s, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(query),
    ]);

    res.json({
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/users/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [listCount, reviewCount] = await Promise.all([
      List.countDocuments({ userId: user._id }),
      Review.countDocuments({ userId: user._id }),
    ]);

    res.json({
      user: { ...user, listCount, reviewCount },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/users/:id', authenticate, isAdmin, audit('user_update', 'user'), async (req, res) => {
  try {
    const { id } = req.params;
    const { role, subscriptionTier, isActive } = req.body;

    const update = {};
    if (role !== undefined) update.role = role;
    if (subscriptionTier !== undefined) update.subscriptionTier = subscriptionTier;
    if (isActive !== undefined) update.isActive = isActive;

    const user = await User.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/users/:id', authenticate, isAdmin, audit('user_delete', 'user'), async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== Review Management (admin only) ==========
router.get('/reviews', authenticate, isAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const { mediaType, userId, tmdbId, from, to } = req.query;

    const query = {};
    if (mediaType) query.mediaType = mediaType;
    if (userId) query.userId = userId;
    if (tmdbId) query.tmdbId = parseInt(tmdbId, 10);
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to + 'T23:59:59');
    }

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('userId', 'username email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(query),
    ]);

    res.json({
      reviews,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/reviews/:id', authenticate, isAdmin, audit('review_delete', 'review'), async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== Watchlist & Lists Management (admin only) ==========
router.get('/lists', authenticate, isAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const { userId, listType } = req.query;

    const query = {};
    if (userId) query.userId = userId;
    if (listType) query.listType = listType;

    const [lists, total] = await Promise.all([
      List.find(query)
        .populate('userId', 'username email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      List.countDocuments(query),
    ]);

    const listIds = lists.map((l) => l._id);
    const itemCounts = await ListItem.aggregate([
      { $match: { listId: { $in: listIds } } },
      { $group: { _id: '$listId', count: { $sum: 1 } } },
    ]);
    const countMap = {};
    itemCounts.forEach((c) => { countMap[c._id.toString()] = c.count; });

    const listsWithCount = lists.map((l) => ({
      ...l,
      itemCount: countMap[l._id.toString()] ?? 0,
    }));

    res.json({
      lists: listsWithCount,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/lists/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const list = await List.findById(req.params.id)
      .populate('userId', 'username email')
      .lean();
    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }

    const items = await ListItem.find({ listId: list._id })
      .sort({ addedAt: -1 })
      .lean();

    res.json({ list: { ...list, items } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/lists/:id', authenticate, isAdmin, audit('list_delete', 'list'), async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }
    await ListItem.deleteMany({ listId: list._id });
    await List.findByIdAndDelete(list._id);
    res.json({ message: 'List deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/user-movies', authenticate, isAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const { userId, status } = req.query;

    const query = {};
    if (userId) query.userId = userId;
    if (status) query.status = status;

    const [userMovies, total] = await Promise.all([
      UserMovie.find(query)
        .populate('userId', 'username email')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      UserMovie.countDocuments(query),
    ]);

    res.json({
      userMovies,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/user-tv-shows', authenticate, isAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const { userId, status } = req.query;

    const query = {};
    if (userId) query.userId = userId;
    if (status) query.status = status;

    const [userTVShows, total] = await Promise.all([
      UserTVShow.find(query)
        .populate('userId', 'username email')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      UserTVShow.countDocuments(query),
    ]);

    res.json({
      userTVShows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

