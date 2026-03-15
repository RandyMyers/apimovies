const tmdbService = require('../services/tmdbService');
const UserTVShow = require('../models/UserTVShow');
const List = require('../models/List');
const ListItem = require('../models/ListItem');

// Get popular TV shows
exports.getPopularTV = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getPopularTV(page, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get top rated TV shows
exports.getTopRatedTV = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getTopRatedTV(page, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get on the air TV shows
exports.getOnTheAirTV = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getOnTheAirTV(page, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get trending TV shows
exports.getTrendingTV = async (req, res) => {
  try {
    const timeWindow = req.query.time_window || 'day';
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getTrending('tv', timeWindow, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Search TV shows
exports.searchTV = async (req, res) => {
  try {
    const query = req.query.query;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    const data = await tmdbService.searchTV(query, {
      page: parseInt(req.query.page) || 1,
      language: req.query.language || 'en-US',
      includeAdult: req.query.include_adult === 'true',
      firstAirDateYear: req.query.first_air_date_year,
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Discover TV shows
exports.discoverTV = async (req, res) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      language: req.query.language || 'en-US',
      sortBy: req.query.sort_by,
      genres: req.query.with_genres,
      year: req.query.year,
      minRating: req.query['vote_average.gte'],
      maxRating: req.query['vote_average.lte'],
      watchProviders: req.query.with_watch_providers,
      watchRegion: req.query.watch_region || 'US',
    };
    const data = await tmdbService.discoverTV(filters);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get TV show details
exports.getTVDetails = async (req, res) => {
  try {
    const tvId = parseInt(req.params.id);
    const appendToResponse = req.query.append_to_response || 'videos,images,credits,similar,recommendations,watch/providers,content_ratings,keywords';
    const language = req.query.language || 'en-US';
    
    const data = await tmdbService.getTVDetails(tvId, {
      appendToResponse,
      language,
    });
    
    // If user is authenticated, add user-specific data
    if (req.user) {
      const userTVShow = await UserTVShow.findOne({
        userId: req.user._id,
        tmdbTvId: tvId,
      });
      data.userData = userTVShow || null;
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get TV season details (episodes) - TMDB: tv/{series_id}/season/{season_number}
exports.getTVSeasonDetails = async (req, res) => {
  try {
    const seriesId = parseInt(req.params.id);
    const seasonNumber = parseInt(req.params.seasonNumber);
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getTVSeason(seriesId, seasonNumber, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get TV videos
exports.getTVVideos = async (req, res) => {
  try {
    const tvId = parseInt(req.params.id);
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getTVVideos(tvId, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get TV images
exports.getTVImages = async (req, res) => {
  try {
    const tvId = parseInt(req.params.id);
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getTVImages(tvId, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get TV credits
exports.getTVCredits = async (req, res) => {
  try {
    const tvId = parseInt(req.params.id);
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getTVCredits(tvId, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get similar TV shows
exports.getSimilarTV = async (req, res) => {
  try {
    const tvId = parseInt(req.params.id);
    const page = parseInt(req.query.page) || 1;
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getSimilarTV(tvId, page, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get TV recommendations
exports.getTVRecommendations = async (req, res) => {
  try {
    const tvId = parseInt(req.params.id);
    const page = parseInt(req.query.page) || 1;
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getTVRecommendations(tvId, page, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get TV watch providers
exports.getTVWatchProviders = async (req, res) => {
  try {
    const tvId = parseInt(req.params.id);
    const region = req.query.region || 'US';
    const data = await tmdbService.getTVWatchProviders(tvId, region);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get TMDb reviews for TV show
exports.getTVReviews = async (req, res) => {
  try {
    const tvId = parseInt(req.params.id);
    const page = parseInt(req.query.page) || 1;
    const language = req.query.language || 'en-US';
    
    const data = await tmdbService.getTVReviews(tvId, page, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// TV extras (TMDB unused endpoints)
exports.getTVLatest = async (req, res) => {
  try {
    const data = await tmdbService.getTVLatest();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTVChanges = async (req, res) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      startDate: req.query.start_date,
      endDate: req.query.end_date,
    };
    const data = await tmdbService.getTVChanges(options);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTVEpisodeGroup = async (req, res) => {
  try {
    const episodeGroupId = req.params.episodeGroupId;
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getTVEpisodeGroup(episodeGroupId, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTVAggregateCredits = async (req, res) => {
  try {
    const tvId = parseInt(req.params.id);
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getTVAggregateCredits(tvId, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTVAlternativeTitles = async (req, res) => {
  try {
    const tvId = parseInt(req.params.id);
    const data = await tmdbService.getTVAlternativeTitles(tvId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTVContentRatings = async (req, res) => {
  try {
    const tvId = parseInt(req.params.id);
    const data = await tmdbService.getTVContentRatings(tvId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTVKeywords = async (req, res) => {
  try {
    const tvId = parseInt(req.params.id);
    const data = await tmdbService.getTVKeywords(tvId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTVTranslations = async (req, res) => {
  try {
    const tvId = parseInt(req.params.id);
    const data = await tmdbService.getTVTranslations(tvId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTVLists = async (req, res) => {
  try {
    const tvId = parseInt(req.params.id);
    const page = parseInt(req.query.page) || 1;
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getTVLists(tvId, page, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTVEpisodeGroups = async (req, res) => {
  try {
    const tvId = parseInt(req.params.id);
    const data = await tmdbService.getTVEpisodeGroups(tvId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTVScreenedTheatrically = async (req, res) => {
  try {
    const tvId = parseInt(req.params.id);
    const data = await tmdbService.getTVScreenedTheatrically(tvId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTVSeasonCredits = async (req, res) => {
  try {
    const tvId = parseInt(req.params.id);
    const seasonNumber = parseInt(req.params.seasonNumber);
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getTVSeasonCredits(tvId, seasonNumber, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTVSeasonImages = async (req, res) => {
  try {
    const tvId = parseInt(req.params.id);
    const seasonNumber = parseInt(req.params.seasonNumber);
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getTVSeasonImages(tvId, seasonNumber, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTVSeasonVideos = async (req, res) => {
  try {
    const tvId = parseInt(req.params.id);
    const seasonNumber = parseInt(req.params.seasonNumber);
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getTVSeasonVideos(tvId, seasonNumber, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTVEpisodeCredits = async (req, res) => {
  try {
    const tvId = parseInt(req.params.id);
    const seasonNumber = parseInt(req.params.seasonNumber);
    const episodeNumber = parseInt(req.params.episodeNumber);
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getTVEpisodeCredits(tvId, seasonNumber, episodeNumber, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTVEpisodeImages = async (req, res) => {
  try {
    const tvId = parseInt(req.params.id);
    const seasonNumber = parseInt(req.params.seasonNumber);
    const episodeNumber = parseInt(req.params.episodeNumber);
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getTVEpisodeImages(tvId, seasonNumber, episodeNumber, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTVEpisodeVideos = async (req, res) => {
  try {
    const tvId = parseInt(req.params.id);
    const seasonNumber = parseInt(req.params.seasonNumber);
    const episodeNumber = parseInt(req.params.episodeNumber);
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getTVEpisodeVideos(tvId, seasonNumber, episodeNumber, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add TV show to watchlist
exports.addToWatchlist = async (req, res) => {
  try {
    const tvId = parseInt(req.params.id);
    const userId = req.user._id;
    
    let watchlist = await List.findOne({
      userId,
      listType: 'watchlist',
    });
    
    if (!watchlist) {
      watchlist = await List.create({
        userId,
        name: 'My Watchlist',
        listType: 'watchlist',
        isPublic: false,
      });
    }
    
    const listItem = await ListItem.findOneAndUpdate(
      { listId: watchlist._id, tmdbId: tvId, mediaType: 'tv' },
      { listId: watchlist._id, tmdbId: tvId, mediaType: 'tv' },
      { upsert: true, new: true }
    );
    
    res.json({ message: 'TV show added to watchlist', listItem });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Remove TV show from watchlist
exports.removeFromWatchlist = async (req, res) => {
  try {
    const tvId = parseInt(req.params.id);
    const userId = req.user._id;
    
    const watchlist = await List.findOne({
      userId,
      listType: 'watchlist',
    });
    
    if (watchlist) {
      await ListItem.deleteOne({
        listId: watchlist._id,
        tmdbId: tvId,
        mediaType: 'tv',
      });
    }
    
    res.json({ message: 'TV show removed from watchlist' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add TV show to favorites
exports.addToFavorites = async (req, res) => {
  try {
    const tvId = parseInt(req.params.id);
    const userId = req.user._id;
    
    let favorites = await List.findOne({
      userId,
      listType: 'favorites',
    });
    
    if (!favorites) {
      favorites = await List.create({
        userId,
        name: 'My Favorites',
        listType: 'favorites',
        isPublic: false,
      });
    }
    
    const listItem = await ListItem.findOneAndUpdate(
      { listId: favorites._id, tmdbId: tvId, mediaType: 'tv' },
      { listId: favorites._id, tmdbId: tvId, mediaType: 'tv' },
      { upsert: true, new: true }
    );
    
    res.json({ message: 'TV show added to favorites', listItem });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Remove TV show from favorites
exports.removeFromFavorites = async (req, res) => {
  try {
    const tvId = parseInt(req.params.id);
    const userId = req.user._id;
    
    const favorites = await List.findOne({
      userId,
      listType: 'favorites',
    });
    
    if (favorites) {
      await ListItem.deleteOne({
        listId: favorites._id,
        tmdbId: tvId,
        mediaType: 'tv',
      });
    }
    
    res.json({ message: 'TV show removed from favorites' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Rate TV show
exports.rateTV = async (req, res) => {
  try {
    const tvId = parseInt(req.params.id);
    const userId = req.user._id;
    const { rating } = req.body;
    
    if (!rating || rating < 1 || rating > 10) {
      return res.status(400).json({ error: 'Rating must be between 1 and 10' });
    }
    
    const userTVShow = await UserTVShow.findOneAndUpdate(
      { userId, tmdbTvId: tvId },
      { userId, tmdbTvId: tvId, rating, status: 'watching' },
      { upsert: true, new: true }
    );
    
    res.json({ message: 'TV show rated successfully', userTVShow });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// TV extras (TMDB unused endpoints)
exports.getTVAggregateCredits = async (req, res) => {
  try {
    const tvId = parseInt(req.params.id);
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getTVAggregateCredits(tvId, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTVAlternativeTitles = async (req, res) => {
  try {
    const tvId = parseInt(req.params.id);
    const data = await tmdbService.getTVAlternativeTitles(tvId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTVContentRatings = async (req, res) => {
  try {
    const tvId = parseInt(req.params.id);
    const data = await tmdbService.getTVContentRatings(tvId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTVKeywords = async (req, res) => {
  try {
    const tvId = parseInt(req.params.id);
    const data = await tmdbService.getTVKeywords(tvId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTVTranslations = async (req, res) => {
  try {
    const tvId = parseInt(req.params.id);
    const data = await tmdbService.getTVTranslations(tvId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTVLists = async (req, res) => {
  try {
    const tvId = parseInt(req.params.id);
    const page = parseInt(req.query.page) || 1;
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getTVLists(tvId, page, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTVEpisodeGroups = async (req, res) => {
  try {
    const tvId = parseInt(req.params.id);
    const data = await tmdbService.getTVEpisodeGroups(tvId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTVScreenedTheatrically = async (req, res) => {
  try {
    const tvId = parseInt(req.params.id);
    const data = await tmdbService.getTVScreenedTheatrically(tvId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTVLatest = async (req, res) => {
  try {
    const data = await tmdbService.getTVLatest();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTVChanges = async (req, res) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      startDate: req.query.start_date,
      endDate: req.query.end_date,
    };
    const data = await tmdbService.getTVChanges(options);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTVSeasonCredits = async (req, res) => {
  try {
    const tvId = parseInt(req.params.id);
    const seasonNumber = parseInt(req.params.seasonNumber);
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getTVSeasonCredits(tvId, seasonNumber, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTVSeasonImages = async (req, res) => {
  try {
    const tvId = parseInt(req.params.id);
    const seasonNumber = parseInt(req.params.seasonNumber);
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getTVSeasonImages(tvId, seasonNumber, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTVSeasonVideos = async (req, res) => {
  try {
    const tvId = parseInt(req.params.id);
    const seasonNumber = parseInt(req.params.seasonNumber);
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getTVSeasonVideos(tvId, seasonNumber, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTVEpisodeCredits = async (req, res) => {
  try {
    const tvId = parseInt(req.params.id);
    const seasonNumber = parseInt(req.params.seasonNumber);
    const episodeNumber = parseInt(req.params.episodeNumber);
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getTVEpisodeCredits(tvId, seasonNumber, episodeNumber, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTVEpisodeImages = async (req, res) => {
  try {
    const tvId = parseInt(req.params.id);
    const seasonNumber = parseInt(req.params.seasonNumber);
    const episodeNumber = parseInt(req.params.episodeNumber);
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getTVEpisodeImages(tvId, seasonNumber, episodeNumber, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTVEpisodeVideos = async (req, res) => {
  try {
    const tvId = parseInt(req.params.id);
    const seasonNumber = parseInt(req.params.seasonNumber);
    const episodeNumber = parseInt(req.params.episodeNumber);
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getTVEpisodeVideos(tvId, seasonNumber, episodeNumber, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTVEpisodeGroup = async (req, res) => {
  try {
    const episodeGroupId = req.params.episodeGroupId;
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getTVEpisodeGroup(episodeGroupId, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

