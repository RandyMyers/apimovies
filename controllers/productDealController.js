const ProductDeal = require('../models/ProductDeal');
const { siteFilter } = require('../middleware/siteResolver');

/**
 * Public: get product deals for a movie or TV show
 * GET /api/v1/product-deals?tmdbMovieId=123  or  ?tmdbTvId=456
 */
exports.getProductDeals = async (req, res) => {
  try {
    const tmdbMovieId = req.query.tmdbMovieId ? parseInt(req.query.tmdbMovieId, 10) : null;
    const tmdbTvId = req.query.tmdbTvId ? parseInt(req.query.tmdbTvId, 10) : null;

    if (!tmdbMovieId && !tmdbTvId) {
      return res.status(400).json({ error: 'Provide tmdbMovieId or tmdbTvId' });
    }

    const now = new Date();
    const query = {
      isActive: true,
      $and: [
        { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
        { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
      ],
    };
    // Only show deals linked to this specific movie or TV show (exact match; no "global" null deals on every page)
    if (tmdbMovieId) query.tmdbMovieId = tmdbMovieId;
    if (tmdbTvId) query.tmdbTvId = tmdbTvId;
    const sf = siteFilter(req.siteId);
    if (Object.keys(sf).length) query.$and.push(sf);

    const deals = await ProductDeal.find(query)
      .sort({ displayOrder: 1, createdAt: -1 })
      .limit(20)
      .lean();

    res.json({ deals });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
