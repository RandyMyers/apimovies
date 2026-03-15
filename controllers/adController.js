const Ad = require('../models/Ad');
const { siteFilter } = require('../middleware/siteResolver');

// Helper to check if ad is currently within its active date range
const isWithinDateRange = (ad) => {
  const now = new Date();
  if (ad.startDate && ad.startDate > now) return false;
  if (ad.endDate && ad.endDate < now) return false;
  return true;
};

// Get active ads for a given position / locale
exports.getActiveAds = async (req, res) => {
  try {
    const { position } = req.query;
    const { language, region } = req.locale || { language: 'en', region: 'US' };

    if (!position) {
      return res.status(400).json({ error: 'position query parameter is required' });
    }

    // Base query: active ads for this position
    const query = {
      position,
      isActive: true,
    };
    const sf = siteFilter(req.siteId);
    if (Object.keys(sf).length) query.$and = [sf];

    let ads = await Ad.find(query).lean();

    // Filter by date range
    ads = ads.filter(isWithinDateRange);

    // Filter by region (if ad has regions targeting)
    ads = ads.filter((ad) => {
      if (!Array.isArray(ad.regions) || ad.regions.length === 0) return true;
      return ad.regions.includes(region);
    });

    // Filter by language (if ad has language targeting)
    ads = ads.filter((ad) => {
      if (!Array.isArray(ad.languages) || ad.languages.length === 0) return true;
      return ad.languages.includes(language);
    });

    // Increment impressions for returned ads (best-effort, not awaited)
    const adIds = ads.map((ad) => ad._id);
    if (adIds.length > 0) {
      Ad.updateMany({ _id: { $in: adIds } }, { $inc: { impressions: 1 } }).catch(() => {});
    }

    res.json({ ads });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Track a click on an ad
exports.trackClick = async (req, res) => {
  try {
    const { id } = req.params;
    const ad = await Ad.findByIdAndUpdate(
      id,
      { $inc: { clicks: 1 } },
      { new: true }
    );

    if (!ad) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};







