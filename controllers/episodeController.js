const EpisodeTracking = require('../models/EpisodeTracking');

// Mark episode as watched
exports.markEpisodeWatched = async (req, res) => {
  try {
    const tvId = parseInt(req.params.tvId);
    const seasonNumber = parseInt(req.params.seasonNumber);
    const episodeNumber = parseInt(req.params.episodeNumber);
    const userId = req.user._id;

    const episodeTracking = await EpisodeTracking.findOneAndUpdate(
      {
        userId,
        tmdbTvId: tvId,
        seasonNumber,
        episodeNumber,
      },
      {
        userId,
        tmdbTvId: tvId,
        seasonNumber,
        episodeNumber,
        isWatched: true,
        watchedDate: new Date(),
      },
      { upsert: true, new: true }
    );

    res.json({
      message: 'Episode marked as watched',
      episodeTracking,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark episode as unwatched
exports.markEpisodeUnwatched = async (req, res) => {
  try {
    const tvId = parseInt(req.params.tvId);
    const seasonNumber = parseInt(req.params.seasonNumber);
    const episodeNumber = parseInt(req.params.episodeNumber);
    const userId = req.user._id;

    await EpisodeTracking.deleteOne({
      userId,
      tmdbTvId: tvId,
      seasonNumber,
      episodeNumber,
    });

    res.json({ message: 'Episode marked as unwatched' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get episode tracking status
exports.getEpisodeStatus = async (req, res) => {
  try {
    const tvId = parseInt(req.params.tvId);
    const seasonNumber = parseInt(req.params.seasonNumber);
    const episodeNumber = parseInt(req.params.episodeNumber);
    const userId = req.user._id;

    const episodeTracking = await EpisodeTracking.findOne({
      userId,
      tmdbTvId: tvId,
      seasonNumber,
      episodeNumber,
    });

    res.json({
      isWatched: !!episodeTracking,
      watchedDate: episodeTracking?.watchedDate || null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

