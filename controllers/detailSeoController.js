const DetailPageSEO = require('../models/DetailPageSEO');
const { siteFilter } = require('../middleware/siteResolver');

const SUPPORTED_LANGUAGES = ['en', 'de', 'es', 'fr', 'it', 'pt', 'nl', 'sv', 'fi', 'da'];

/**
 * Resolve meta for a given language: use translation if present, else default (en) fields.
 */
function resolveMetaForLanguage(doc, language) {
  const lang = (language || 'en').toLowerCase();
  const translation = (doc.translations || []).find((t) => t.language === lang);
  return {
    metaTitle: (translation?.metaTitle && translation.metaTitle.trim()) ? translation.metaTitle.trim() : (doc.metaTitle || '').trim(),
    metaDescription: (translation?.metaDescription && translation.metaDescription.trim()) ? translation.metaDescription.trim() : (doc.metaDescription || '').trim(),
    keywords: Array.isArray(translation?.keywords) && translation.keywords.length > 0
      ? translation.keywords.filter(Boolean)
      : (Array.isArray(doc.keywords) ? doc.keywords : []).filter(Boolean),
  };
}

/**
 * Public: get SEO meta for a movie or TV detail page
 * GET /api/v1/detail-seo/meta?type=movie&tmdbId=12345&site=slug&language=en
 */
exports.getMeta = async (req, res) => {
  try {
    const type = req.query.type; // 'movie' | 'tv'
    const tmdbId = req.query.tmdbId ? parseInt(req.query.tmdbId, 10) : null;
    const language = req.query.language || 'en';

    if (!type || !tmdbId || (type !== 'movie' && type !== 'tv')) {
      return res.status(400).json({ error: 'Query params type (movie|tv) and tmdbId are required' });
    }

    const query = {
      type,
      isActive: true,
    };
    if (type === 'movie') {
      query.tmdbMovieId = tmdbId;
    } else {
      query.tmdbTvId = tmdbId;
    }

    const sf = siteFilter(req.siteId);
    if (Object.keys(sf).length) {
      query.$and = [sf];
    }

    const doc = await DetailPageSEO.findOne(query).lean();
    if (!doc) {
      return res.status(404).json({ error: 'No SEO config for this page' });
    }

    const meta = resolveMetaForLanguage(doc, language);
    const response = { ...meta };
    if (doc.content && String(doc.content).trim()) {
      response.content = doc.content.trim();
    }
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Admin: list all DetailPageSEO entries
 * GET /api/v1/admin/detail-seo?type=movie&siteId=...
 */
exports.list = async (req, res) => {
  try {
    const { type, siteId } = req.query;
    const query = {};
    if (type && (type === 'movie' || type === 'tv')) query.type = type;
    if (siteId) query.siteIds = siteId;

    const list = await DetailPageSEO.find(query)
      .populate('siteIds', 'name slug')
      .sort({ updatedAt: -1 })
      .lean();

    res.json({ list });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Admin: get one by id
 */
exports.getOne = async (req, res) => {
  try {
    const doc = await DetailPageSEO.findById(req.params.id)
      .populate('siteIds', 'name slug')
      .lean();
    if (!doc) {
      return res.status(404).json({ error: 'Detail SEO entry not found' });
    }
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Admin: create
 */
exports.create = async (req, res) => {
  try {
    const body = req.body;
    if (!body.type || (body.type !== 'movie' && body.type !== 'tv')) {
      return res.status(400).json({ error: 'type must be "movie" or "tv"' });
    }
    if (body.type === 'movie') {
      const id = body.tmdbMovieId != null ? parseInt(body.tmdbMovieId, 10) : null;
      if (id === null || isNaN(id)) return res.status(400).json({ error: 'tmdbMovieId is required for type movie' });
      body.tmdbMovieId = id;
      body.tmdbTvId = null;
    } else {
      const id = body.tmdbTvId != null ? parseInt(body.tmdbTvId, 10) : null;
      if (id === null || isNaN(id)) return res.status(400).json({ error: 'tmdbTvId is required for type tv' });
      body.tmdbTvId = id;
      body.tmdbMovieId = null;
    }
    if (!body.metaTitle || !String(body.metaTitle).trim()) {
      return res.status(400).json({ error: 'metaTitle is required' });
    }
    if (Array.isArray(body.keywords)) {
      body.keywords = body.keywords.filter((k) => k != null && String(k).trim()).map((k) => String(k).trim());
    } else if (typeof body.keywords === 'string') {
      body.keywords = body.keywords.split(',').map((k) => k.trim()).filter(Boolean);
    } else {
      body.keywords = [];
    }
    if (Array.isArray(body.translations)) {
      body.translations = body.translations
        .filter((t) => t && t.language)
        .map((t) => ({
          language: String(t.language).toLowerCase().trim(),
          metaTitle: t.metaTitle != null ? String(t.metaTitle).trim() : '',
          metaDescription: t.metaDescription != null ? String(t.metaDescription).trim() : '',
          keywords: Array.isArray(t.keywords) ? t.keywords.map((k) => String(k).trim()).filter(Boolean) : [],
        }));
    } else {
      body.translations = [];
    }
    body.metaDescription = body.metaDescription != null ? String(body.metaDescription).trim() : '';
    body.siteIds = Array.isArray(body.siteIds) ? body.siteIds : [];
    body.displayName = body.displayName != null ? String(body.displayName).trim() : '';
    body.content = body.content != null ? String(body.content).trim() : '';

    const doc = await DetailPageSEO.create(body);
    const populated = await DetailPageSEO.findById(doc._id).populate('siteIds', 'name slug').lean();
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Admin: update
 */
exports.update = async (req, res) => {
  try {
    const body = req.body;
    const doc = await DetailPageSEO.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Detail SEO entry not found' });

    if (body.metaTitle !== undefined) doc.metaTitle = String(body.metaTitle).trim();
    if (body.metaDescription !== undefined) doc.metaDescription = String(body.metaDescription).trim();
    if (body.keywords !== undefined) {
      doc.keywords = Array.isArray(body.keywords)
        ? body.keywords.map((k) => String(k).trim()).filter(Boolean)
        : typeof body.keywords === 'string'
          ? body.keywords.split(',').map((k) => k.trim()).filter(Boolean)
          : [];
    }
    if (body.translations !== undefined) {
      doc.translations = (Array.isArray(body.translations) ? body.translations : [])
        .filter((t) => t && t.language)
        .map((t) => ({
          language: String(t.language).toLowerCase().trim(),
          metaTitle: t.metaTitle != null ? String(t.metaTitle).trim() : '',
          metaDescription: t.metaDescription != null ? String(t.metaDescription).trim() : '',
          keywords: Array.isArray(t.keywords) ? t.keywords.map((k) => String(k).trim()).filter(Boolean) : [],
        }));
    }
    if (body.siteIds !== undefined) doc.siteIds = Array.isArray(body.siteIds) ? body.siteIds : doc.siteIds;
    if (body.isActive !== undefined) doc.isActive = !!body.isActive;
    if (body.displayName !== undefined) doc.displayName = String(body.displayName).trim();
    if (body.content !== undefined) doc.content = String(body.content).trim();

    await doc.save();
    const populated = await DetailPageSEO.findById(doc._id).populate('siteIds', 'name slug').lean();
    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Admin: delete
 */
exports.delete = async (req, res) => {
  try {
    const doc = await DetailPageSEO.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Detail SEO entry not found' });
    res.json({ message: 'Detail SEO entry deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
