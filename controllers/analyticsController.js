const AnalyticsEvent = require('../models/AnalyticsEvent');
const Visitor = require('../models/Visitor');
const UserMovie = require('../models/UserMovie');
const UserTVShow = require('../models/UserTVShow');
const List = require('../models/List');
const ListItem = require('../models/ListItem');
const tmdbService = require('../services/tmdbService');
const { parseDeviceType } = require('../utils/deviceParser');
const socketService = require('../services/socketService');

function isPrivateIp(ip) {
  if (!ip || typeof ip !== 'string') return true;
  const trimmed = ip.replace(/^::ffff:/, '').trim();
  if (trimmed === '127.0.0.1' || trimmed === '::1' || trimmed === 'localhost') return true;
  if (trimmed.startsWith('192.168.') || trimmed.startsWith('10.')) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(trimmed)) return true;
  return false;
}

async function getGeoFromIp(req) {
  const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress;
  if (!ip) return { country: null, city: null };

  if (isPrivateIp(ip)) {
    return { country: 'LOCAL', city: 'Local' };
  }

  try {
    const geoip = require('geoip-lite');
    const geo = geoip.lookup(ip);
    if (geo) {
      return { country: geo.country || null, city: geo.city || null };
    }
  } catch (err) {
    // geoip-lite optional
  }

  try {
    const axios = require('axios');
    const { data } = await axios.get(`http://ip-api.com/json/${ip}?fields=countryCode,city`, { timeout: 2000 });
    if (data?.countryCode) {
      return { country: data.countryCode, city: data.city || null };
    }
  } catch (err) {
    // ip-api fallback optional
  }
  return { country: null, city: null };
}

async function getOrCreateVisitor(req, geo) {
  const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '0.0.0.0';
  const userAgent = req.headers['user-agent'] || '';
  const deviceType = parseDeviceType(userAgent);
  const country = geo.country || null;
  const city = geo.city || null;

  let visitor = await Visitor.findOne({ ip, userAgent }).sort({ lastSeenAt: -1 }).lean();
  if (visitor) {
    await Visitor.findByIdAndUpdate(visitor._id, {
      lastSeenAt: new Date(),
      $inc: { visitCount: 1 },
      ...(req.user?._id && { userId: req.user._id }),
      ...(country && { country }),
      ...(city && { city }),
      deviceType,
    });
    return { _id: visitor._id, country: country || visitor.country, city: city || visitor.city, deviceType };
  }

  visitor = await Visitor.create({
    ip,
    userAgent,
    country,
    city,
    deviceType,
    userId: req.user?._id || null,
  });
  return { _id: visitor._id, country, city, deviceType };
}

exports.ingest = async (req, res) => {
  try {
    const { type, sessionId, path, action, resourceType, resourceId, locale, region, referrer, country: bodyCountry, city: bodyCity } = req.body;
    if (!type || !['page_view', 'user_action'].includes(type)) {
      return res.status(400).json({ error: 'Invalid or missing type. Use page_view or user_action.' });
    }
    if (type === 'page_view' && !path) {
      return res.status(400).json({ error: 'path is required for page_view.' });
    }
    if (type === 'user_action' && !action) {
      return res.status(400).json({ error: 'action is required for user_action.' });
    }

    const geo = await getGeoFromIp(req);
    const country = bodyCountry || geo.country || null;
    const city = (bodyCity || geo.city || '').trim() || null;
    const userAgent = req.headers['user-agent'] || null;
    const deviceType = userAgent ? parseDeviceType(userAgent) : null;

    let visitorId = null;
    try {
      const visitor = await getOrCreateVisitor(req, geo);
      visitorId = visitor._id;
    } catch (err) {
      // Visitor creation optional - continue without
    }

    const doc = {
      type,
      sessionId: sessionId || null,
      visitorId,
      userId: req.user?._id || null,
      path: path || null,
      action: action || null,
      resourceType: resourceType || null,
      resourceId: resourceId ?? null,
      locale: locale || null,
      region: region || null,
      country,
      city,
      referrer: referrer || null,
      userAgent,
      deviceType,
    };
    const event = await AnalyticsEvent.create(doc);

    if (type === 'page_view') {
      try {
        socketService.emitToAdmin('newView', {
          view: {
            path: doc.path,
            locale: doc.locale,
            country: doc.country,
            city: doc.city,
            deviceType: doc.deviceType,
            referrer: doc.referrer,
            timestamp: event.timestamp,
            sessionId: doc.sessionId,
            userId: doc.userId,
          },
        });
      } catch (socketErr) {
        // ignore
      }
    }

    res.status(201).json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

function getDateFilter(period) {
  if (!period || period === 'all') return {};
  const now = new Date();
  let ms = 30 * 24 * 60 * 60 * 1000;
  if (period === '7d') ms = 7 * 24 * 60 * 60 * 1000;
  else if (period === '30d') ms = 30 * 24 * 60 * 60 * 1000;
  return { $gte: new Date(now.getTime() - ms) };
}

exports.getTopMovies = async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const metric = req.query.metric || 'watchlist';
    const period = req.query.period || 'all';
    const dateFilter = getDateFilter(period);

    let pipeline = [];

    if (metric === 'watchlist') {
      const umMatch = { status: { $in: ['want_to_watch', 'watching'] } };
      if (Object.keys(dateFilter).length) umMatch.createdAt = dateFilter;
      const umAgg = await UserMovie.aggregate([
        { $match: umMatch },
        { $group: { _id: '$tmdbMovieId', count: { $sum: 1 } } },
      ]);
      const listIds = await List.find({ listType: 'watchlist' }).select('_id').lean();
      const listMatch = { listId: { $in: listIds.map((l) => l._id) }, mediaType: 'movie' };
      if (Object.keys(dateFilter).length) listMatch.addedAt = dateFilter;
      const liAgg = await ListItem.aggregate([
        { $match: listMatch },
        { $group: { _id: '$tmdbId', count: { $sum: 1 } } },
      ]);
      const combined = {};
      for (const r of umAgg) {
        combined[r._id] = (combined[r._id] || 0) + r.count;
      }
      for (const r of liAgg) {
        combined[r._id] = (combined[r._id] || 0) + r.count;
      }
      pipeline = Object.entries(combined).map(([id, count]) => ({ tmdbMovieId: parseInt(id, 10), count }));
    } else if (metric === 'favorites') {
      const listIds = await List.find({ listType: 'favorites' }).select('_id').lean();
      const listMatch = { listId: { $in: listIds.map((l) => l._id) }, mediaType: 'movie' };
      if (Object.keys(dateFilter).length) listMatch.addedAt = dateFilter;
      const liAgg = await ListItem.aggregate([
        { $match: listMatch },
        { $group: { _id: '$tmdbId', count: { $sum: 1 } } },
      ]);
      pipeline = liAgg.map((r) => ({ tmdbMovieId: r._id, count: r.count }));
    } else if (metric === 'rating') {
      const umMatch = { rating: { $exists: true, $ne: null } };
      if (Object.keys(dateFilter).length) umMatch.updatedAt = dateFilter;
      pipeline = await UserMovie.aggregate([
        { $match: umMatch },
        { $group: { _id: '$tmdbMovieId', count: { $sum: 1 }, avgRating: { $avg: '$rating' } } },
        { $match: { count: { $gt: 0 } } },
      ]);
      pipeline = pipeline.map((r) => ({
        tmdbMovieId: r._id,
        count: r.count,
        avgRating: Math.round(r.avgRating * 10) / 10,
      }));
    } else if (metric === 'watched') {
      const umMatch = { status: 'watched' };
      if (Object.keys(dateFilter).length) umMatch.updatedAt = dateFilter;
      const umAgg = await UserMovie.aggregate([
        { $match: umMatch },
        { $group: { _id: '$tmdbMovieId', count: { $sum: 1 } } },
      ]);
      pipeline = umAgg.map((r) => ({ tmdbMovieId: r._id, count: r.count }));
    } else {
      return res.status(400).json({ error: 'Invalid metric. Use watchlist, favorites, rating, or watched.' });
    }

    pipeline.sort((a, b) => b.count - a.count);
    let top = pipeline.slice(0, limit);
    if (req.query.enrich === '1') {
      top = await tmdbService.enrichMovies(top, limit);
    }
    res.json({ movies: top, metric, period });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTopTVShows = async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const metric = req.query.metric || 'watchlist';
    const period = req.query.period || 'all';
    const dateFilter = getDateFilter(period);

    let pipeline = [];

    if (metric === 'watchlist') {
      const utMatch = { status: { $in: ['want_to_watch', 'watching'] } };
      if (Object.keys(dateFilter).length) utMatch.createdAt = dateFilter;
      const utAgg = await UserTVShow.aggregate([
        { $match: utMatch },
        { $group: { _id: '$tmdbTvId', count: { $sum: 1 } } },
      ]);
      const listIds = await List.find({ listType: 'watchlist' }).select('_id').lean();
      const listMatch = { listId: { $in: listIds.map((l) => l._id) }, mediaType: 'tv' };
      if (Object.keys(dateFilter).length) listMatch.addedAt = dateFilter;
      const liAgg = await ListItem.aggregate([
        { $match: listMatch },
        { $group: { _id: '$tmdbId', count: { $sum: 1 } } },
      ]);
      const combined = {};
      for (const r of utAgg) {
        combined[r._id] = (combined[r._id] || 0) + r.count;
      }
      for (const r of liAgg) {
        combined[r._id] = (combined[r._id] || 0) + r.count;
      }
      pipeline = Object.entries(combined).map(([id, count]) => ({ tmdbTvId: parseInt(id, 10), count }));
    } else if (metric === 'favorites') {
      const listIds = await List.find({ listType: 'favorites' }).select('_id').lean();
      const listMatch = { listId: { $in: listIds.map((l) => l._id) }, mediaType: 'tv' };
      if (Object.keys(dateFilter).length) listMatch.addedAt = dateFilter;
      const liAgg = await ListItem.aggregate([
        { $match: listMatch },
        { $group: { _id: '$tmdbId', count: { $sum: 1 } } },
      ]);
      pipeline = liAgg.map((r) => ({ tmdbTvId: r._id, count: r.count }));
    } else if (metric === 'rating') {
      const utMatch = { rating: { $exists: true, $ne: null } };
      if (Object.keys(dateFilter).length) utMatch.updatedAt = dateFilter;
      const utAgg = await UserTVShow.aggregate([
        { $match: utMatch },
        { $group: { _id: '$tmdbTvId', count: { $sum: 1 }, avgRating: { $avg: '$rating' } } },
        { $match: { count: { $gt: 0 } } },
      ]);
      pipeline = utAgg.map((r) => ({
        tmdbTvId: r._id,
        count: r.count,
        avgRating: Math.round(r.avgRating * 10) / 10,
      }));
    } else if (metric === 'watched') {
      const utMatch = { status: 'completed' };
      if (Object.keys(dateFilter).length) utMatch.updatedAt = dateFilter;
      const utAgg = await UserTVShow.aggregate([
        { $match: utMatch },
        { $group: { _id: '$tmdbTvId', count: { $sum: 1 } } },
      ]);
      pipeline = utAgg.map((r) => ({ tmdbTvId: r._id, count: r.count }));
    } else {
      return res.status(400).json({ error: 'Invalid metric. Use watchlist, favorites, rating, or watched.' });
    }

    pipeline.sort((a, b) => b.count - a.count);
    let top = pipeline.slice(0, limit);
    if (req.query.enrich === '1') {
      top = await tmdbService.enrichTVShows(top, limit);
    }
    res.json({ tvShows: top, metric, period });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
