const UserTVShow = require('../models/UserTVShow');

// Track a TV show (create or update)
exports.trackTV = async (req, res) => {
  try {
    const tvId = parseInt(req.params.tvId);
    const userId = req.user._id;
    const { status, currentSeason, currentEpisode, rating, notes } = req.body;

    const userTV = await UserTVShow.findOneAndUpdate(
      { userId, tmdbTvId: tvId },
      {
        userId,
        tmdbTvId: tvId,
        status: status || 'want_to_watch',
        currentSeason: currentSeason || 1,
        currentEpisode: currentEpisode || 1,
        rating: rating || null,
        notes: notes || null,
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({ message: 'TV show tracked successfully', userTV });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update TV show tracking
exports.updateTVTracking = async (req, res) => {
  try {
    const tvId = parseInt(req.params.tvId);
    const userId = req.user._id;
    const { status, currentSeason, currentEpisode, rating, notes } = req.body;

    const userTV = await UserTVShow.findOne({ userId, tmdbTvId: tvId });

    if (!userTV) {
      return res.status(404).json({ error: 'TV show not found in your tracking' });
    }

    if (status) userTV.status = status;
    if (currentSeason !== undefined) userTV.currentSeason = currentSeason;
    if (currentEpisode !== undefined) userTV.currentEpisode = currentEpisode;
    if (rating !== undefined) userTV.rating = rating;
    if (notes !== undefined) userTV.notes = notes;

    await userTV.save();

    res.json({ message: 'TV show tracking updated', userTV });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Remove TV show from tracking
exports.removeTVTracking = async (req, res) => {
  try {
    const tvId = parseInt(req.params.tvId);
    const userId = req.user._id;

    await UserTVShow.deleteOne({ userId, tmdbTvId: tvId });

    res.json({ message: 'TV show removed from tracking' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user's tracked TV shows
exports.getUserTVShows = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { userId };
    if (status) query.status = status;

    const userTVShows = await UserTVShow.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await UserTVShow.countDocuments(query);

    res.json({
      userTVShows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get specific TV show tracking
exports.getUserTV = async (req, res) => {
  try {
    const tvId = parseInt(req.params.tvId);
    const userId = req.user._id;

    const userTV = await UserTVShow.findOne({ userId, tmdbTvId: tvId });

    if (!userTV) {
      return res.status(404).json({ error: 'TV show not found in your tracking' });
    }

    res.json(userTV);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

