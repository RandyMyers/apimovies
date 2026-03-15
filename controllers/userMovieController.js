const UserMovie = require('../models/UserMovie');

// Track a movie (create or update)
exports.trackMovie = async (req, res) => {
  try {
    const movieId = parseInt(req.params.movieId);
    const userId = req.user._id;
    const { status, rating, watchedDate, notes } = req.body;

    const userMovie = await UserMovie.findOneAndUpdate(
      { userId, tmdbMovieId: movieId },
      {
        userId,
        tmdbMovieId: movieId,
        status: status || 'want_to_watch',
        rating: rating || null,
        watchedDate: watchedDate ? new Date(watchedDate) : null,
        notes: notes || null,
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({ message: 'Movie tracked successfully', userMovie });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update movie tracking
exports.updateMovieTracking = async (req, res) => {
  try {
    const movieId = parseInt(req.params.movieId);
    const userId = req.user._id;
    const { status, rating, watchedDate, notes } = req.body;

    const userMovie = await UserMovie.findOne({ userId, tmdbMovieId: movieId });

    if (!userMovie) {
      return res.status(404).json({ error: 'Movie not found in your tracking' });
    }

    if (status) userMovie.status = status;
    if (rating !== undefined) userMovie.rating = rating;
    if (watchedDate) userMovie.watchedDate = new Date(watchedDate);
    if (notes !== undefined) userMovie.notes = notes;

    await userMovie.save();

    res.json({ message: 'Movie tracking updated', userMovie });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Remove movie from tracking
exports.removeMovieTracking = async (req, res) => {
  try {
    const movieId = parseInt(req.params.movieId);
    const userId = req.user._id;

    await UserMovie.deleteOne({ userId, tmdbMovieId: movieId });

    res.json({ message: 'Movie removed from tracking' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user's tracked movies
exports.getUserMovies = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { userId };
    if (status) query.status = status;

    const userMovies = await UserMovie.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await UserMovie.countDocuments(query);

    res.json({
      userMovies,
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

// Get specific movie tracking
exports.getUserMovie = async (req, res) => {
  try {
    const movieId = parseInt(req.params.movieId);
    const userId = req.user._id;

    const userMovie = await UserMovie.findOne({ userId, tmdbMovieId: movieId });

    if (!userMovie) {
      return res.status(404).json({ error: 'Movie not found in your tracking' });
    }

    res.json(userMovie);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

