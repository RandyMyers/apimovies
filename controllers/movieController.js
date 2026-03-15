const tmdbService = require('../services/tmdbService');
const UserMovie = require('../models/UserMovie');
const List = require('../models/List');
const ListItem = require('../models/ListItem');

// Get popular movies
exports.getPopularMovies = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getPopularMovies(page, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get top rated movies
exports.getTopRatedMovies = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getTopRatedMovies(page, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get upcoming movies
exports.getUpcomingMovies = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getUpcomingMovies(page, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get now playing movies
exports.getNowPlayingMovies = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getNowPlayingMovies(page, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get trending movies
exports.getTrendingMovies = async (req, res) => {
  try {
    const timeWindow = req.query.time_window || 'day';
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getTrending('movie', timeWindow, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Search movies
exports.searchMovies = async (req, res) => {
  try {
    const query = req.query.query;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    const data = await tmdbService.searchMovies(query, {
      page: parseInt(req.query.page) || 1,
      language: req.query.language || 'en-US',
      includeAdult: req.query.include_adult === 'true',
      year: req.query.year,
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Discover movies
exports.discoverMovies = async (req, res) => {
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
    const data = await tmdbService.discoverMovies(filters);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get movie details
exports.getMovieDetails = async (req, res) => {
  try {
    const movieId = parseInt(req.params.id);
    const appendToResponse = req.query.append_to_response || 'videos,images,credits,similar,recommendations,watch/providers';
    const language = req.query.language || 'en-US';
    
    const data = await tmdbService.getMovieDetails(movieId, {
      appendToResponse,
      language,
    });
    
    // If user is authenticated, add user-specific data
    if (req.user) {
      const userMovie = await UserMovie.findOne({
        userId: req.user._id,
        tmdbMovieId: movieId,
      });
      data.userData = userMovie || null;
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get movie videos
exports.getMovieVideos = async (req, res) => {
  try {
    const movieId = parseInt(req.params.id);
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getMovieVideos(movieId, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get movie images
exports.getMovieImages = async (req, res) => {
  try {
    const movieId = parseInt(req.params.id);
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getMovieImages(movieId, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get movie credits
exports.getMovieCredits = async (req, res) => {
  try {
    const movieId = parseInt(req.params.id);
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getMovieCredits(movieId, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get similar movies
exports.getSimilarMovies = async (req, res) => {
  try {
    const movieId = parseInt(req.params.id);
    const page = parseInt(req.query.page) || 1;
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getSimilarMovies(movieId, page, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get movie recommendations
exports.getMovieRecommendations = async (req, res) => {
  try {
    const movieId = parseInt(req.params.id);
    const page = parseInt(req.query.page) || 1;
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getMovieRecommendations(movieId, page, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get movie watch providers
exports.getMovieWatchProviders = async (req, res) => {
  try {
    const movieId = parseInt(req.params.id);
    const region = req.query.region || 'US';
    const data = await tmdbService.getMovieWatchProviders(movieId, region);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add movie to watchlist
exports.addToWatchlist = async (req, res) => {
  try {
    const movieId = parseInt(req.params.id);
    const userId = req.user._id;
    
    // Find or create watchlist
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
    
    // Add item to watchlist
    const listItem = await ListItem.findOneAndUpdate(
      { listId: watchlist._id, tmdbId: movieId, mediaType: 'movie' },
      { listId: watchlist._id, tmdbId: movieId, mediaType: 'movie' },
      { upsert: true, new: true }
    );
    
    res.json({ message: 'Movie added to watchlist', listItem });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Remove movie from watchlist
exports.removeFromWatchlist = async (req, res) => {
  try {
    const movieId = parseInt(req.params.id);
    const userId = req.user._id;
    
    const watchlist = await List.findOne({
      userId,
      listType: 'watchlist',
    });
    
    if (watchlist) {
      await ListItem.deleteOne({
        listId: watchlist._id,
        tmdbId: movieId,
        mediaType: 'movie',
      });
    }
    
    res.json({ message: 'Movie removed from watchlist' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add movie to favorites
exports.addToFavorites = async (req, res) => {
  try {
    const movieId = parseInt(req.params.id);
    const userId = req.user._id;
    
    // Find or create favorites list
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
    
    // Add item to favorites
    const listItem = await ListItem.findOneAndUpdate(
      { listId: favorites._id, tmdbId: movieId, mediaType: 'movie' },
      { listId: favorites._id, tmdbId: movieId, mediaType: 'movie' },
      { upsert: true, new: true }
    );
    
    res.json({ message: 'Movie added to favorites', listItem });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Remove movie from favorites
exports.removeFromFavorites = async (req, res) => {
  try {
    const movieId = parseInt(req.params.id);
    const userId = req.user._id;
    
    const favorites = await List.findOne({
      userId,
      listType: 'favorites',
    });
    
    if (favorites) {
      await ListItem.deleteOne({
        listId: favorites._id,
        tmdbId: movieId,
        mediaType: 'movie',
      });
    }
    
    res.json({ message: 'Movie removed from favorites' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Rate movie
exports.rateMovie = async (req, res) => {
  try {
    const movieId = parseInt(req.params.id);
    const userId = req.user._id;
    const { rating } = req.body;
    
    if (!rating || rating < 1 || rating > 10) {
      return res.status(400).json({ error: 'Rating must be between 1 and 10' });
    }
    
    const userMovie = await UserMovie.findOneAndUpdate(
      { userId, tmdbMovieId: movieId },
      { userId, tmdbMovieId: movieId, rating, status: 'watched' },
      { upsert: true, new: true }
    );
    
    res.json({ message: 'Movie rated successfully', userMovie });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get TMDb reviews for movie
exports.getMovieReviews = async (req, res) => {
  try {
    const movieId = parseInt(req.params.id);
    const page = parseInt(req.query.page) || 1;
    const language = req.query.language || 'en-US';
    
    const data = await tmdbService.getMovieReviews(movieId, page, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Movie extras (TMDB unused endpoints)
exports.getMovieLatest = async (req, res) => {
  try {
    const data = await tmdbService.getMovieLatest();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMovieChanges = async (req, res) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      startDate: req.query.start_date,
      endDate: req.query.end_date,
    };
    const data = await tmdbService.getMovieChanges(options);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMovieAlternativeTitles = async (req, res) => {
  try {
    const movieId = parseInt(req.params.id);
    const country = req.query.country;
    const data = await tmdbService.getMovieAlternativeTitles(movieId, country);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMovieExternalIds = async (req, res) => {
  try {
    const movieId = parseInt(req.params.id);
    const data = await tmdbService.getMovieExternalIds(movieId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMovieKeywords = async (req, res) => {
  try {
    const movieId = parseInt(req.params.id);
    const data = await tmdbService.getMovieKeywords(movieId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMovieReleaseDates = async (req, res) => {
  try {
    const movieId = parseInt(req.params.id);
    const data = await tmdbService.getMovieReleaseDates(movieId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMovieTranslations = async (req, res) => {
  try {
    const movieId = parseInt(req.params.id);
    const data = await tmdbService.getMovieTranslations(movieId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMovieLists = async (req, res) => {
  try {
    const movieId = parseInt(req.params.id);
    const page = parseInt(req.query.page) || 1;
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getMovieLists(movieId, page, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Movie extras (TMDB unused endpoints)
exports.getMovieAlternativeTitles = async (req, res) => {
  try {
    const movieId = parseInt(req.params.id);
    const data = await tmdbService.getMovieAlternativeTitles(movieId, req.query.country);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMovieExternalIds = async (req, res) => {
  try {
    const movieId = parseInt(req.params.id);
    const data = await tmdbService.getMovieExternalIds(movieId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMovieKeywords = async (req, res) => {
  try {
    const movieId = parseInt(req.params.id);
    const data = await tmdbService.getMovieKeywords(movieId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMovieReleaseDates = async (req, res) => {
  try {
    const movieId = parseInt(req.params.id);
    const data = await tmdbService.getMovieReleaseDates(movieId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMovieTranslations = async (req, res) => {
  try {
    const movieId = parseInt(req.params.id);
    const data = await tmdbService.getMovieTranslations(movieId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMovieLists = async (req, res) => {
  try {
    const movieId = parseInt(req.params.id);
    const page = parseInt(req.query.page) || 1;
    const language = req.query.language || 'en-US';
    const data = await tmdbService.getMovieLists(movieId, page, language);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMovieLatest = async (req, res) => {
  try {
    const data = await tmdbService.getMovieLatest();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMovieChanges = async (req, res) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      startDate: req.query.start_date,
      endDate: req.query.end_date,
    };
    const data = await tmdbService.getMovieChanges(options);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

