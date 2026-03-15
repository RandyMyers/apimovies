const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserMovie = require('../models/UserMovie');
const UserTVShow = require('../models/UserTVShow');
const Review = require('../models/Review');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Register new user
exports.register = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Validate input
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Email, username, and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user
    const user = await User.create({
      email,
      username,
      password,
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        role: user.role,
        subscriptionTier: user.subscriptionTier,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (user.isActive === false) {
      return res.status(403).json({ error: 'Account is suspended' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        role: user.role,
        subscriptionTier: user.subscriptionTier,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get current user
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        role: user.role,
        preferences: user.preferences,
        subscriptionTier: user.subscriptionTier,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { username, bio, avatar, preferences } = req.body;
    const updateData = {};

    if (username) updateData.username = username;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar) updateData.avatar = avatar;
    if (preferences) updateData.preferences = { ...req.user.preferences, ...preferences };

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        role: user.role,
        preferences: user.preferences,
        subscriptionTier: user.subscriptionTier,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Logout (client-side token removal, but we can track it here if needed)
exports.logout = async (req, res) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // But we can add token blacklisting here if needed
    res.json({ message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Refresh token
exports.refreshToken = async (req, res) => {
  try {
    const newToken = generateToken(req.user._id);
    res.json({
      message: 'Token refreshed',
      token: newToken,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user statistics
exports.getUserStatistics = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get movie statistics
    const watchedMovies = await UserMovie.countDocuments({ userId, status: 'watched' });
    const watchingMovies = await UserMovie.countDocuments({ userId, status: 'watching' });
    const wantToWatchMovies = await UserMovie.countDocuments({ userId, status: 'want_to_watch' });
    const ratedMovies = await UserMovie.countDocuments({ userId, rating: { $ne: null } });
    
    // Calculate average movie rating
    const movieRatings = await UserMovie.find({ userId, rating: { $ne: null } }).select('rating');
    const avgMovieRating = movieRatings.length > 0
      ? (movieRatings.reduce((sum, m) => sum + m.rating, 0) / movieRatings.length).toFixed(2)
      : null;

    // Get TV show statistics
    const completedTVShows = await UserTVShow.countDocuments({ userId, status: 'completed' });
    const watchingTVShows = await UserTVShow.countDocuments({ userId, status: 'watching' });
    const wantToWatchTVShows = await UserTVShow.countDocuments({ userId, status: 'want_to_watch' });
    const ratedTVShows = await UserTVShow.countDocuments({ userId, rating: { $ne: null } });
    
    // Calculate average TV rating
    const tvRatings = await UserTVShow.find({ userId, rating: { $ne: null } }).select('rating');
    const avgTVRating = tvRatings.length > 0
      ? (tvRatings.reduce((sum, t) => sum + t.rating, 0) / tvRatings.length).toFixed(2)
      : null;

    // Get review statistics
    const totalReviews = await Review.countDocuments({ userId });
    const movieReviews = await Review.countDocuments({ userId, mediaType: 'movie' });
    const tvReviews = await Review.countDocuments({ userId, mediaType: 'tv' });

    // Calculate overall average rating (movies + TV)
    const allRatings = [...movieRatings, ...tvRatings];
    const overallAvgRating = allRatings.length > 0
      ? (allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length).toFixed(2)
      : null;

    res.json({
      statistics: {
        movies: {
          watched: watchedMovies,
          watching: watchingMovies,
          wantToWatch: wantToWatchMovies,
          rated: ratedMovies,
          averageRating: avgMovieRating ? parseFloat(avgMovieRating) : null,
        },
        tvShows: {
          completed: completedTVShows,
          watching: watchingTVShows,
          wantToWatch: wantToWatchTVShows,
          rated: ratedTVShows,
          averageRating: avgTVRating ? parseFloat(avgTVRating) : null,
        },
        reviews: {
          total: totalReviews,
          movies: movieReviews,
          tv: tvReviews,
        },
        overall: {
          totalWatched: watchedMovies + completedTVShows,
          totalRated: ratedMovies + ratedTVShows,
          averageRating: overallAvgRating ? parseFloat(overallAvgRating) : null,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get watch history timeline
exports.getWatchHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { mediaType, limit = 50, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const timeline = [];

    // Get watched movies with watchedDate
    if (!mediaType || mediaType === 'movie') {
      const watchedMovies = await UserMovie.find({
        userId,
        status: 'watched',
        watchedDate: { $ne: null },
      })
        .sort({ watchedDate: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean();

      for (const movie of watchedMovies) {
        timeline.push({
          id: movie._id,
          tmdbId: movie.tmdbMovieId,
          mediaType: 'movie',
          status: movie.status,
          rating: movie.rating,
          watchedDate: movie.watchedDate,
          updatedAt: movie.updatedAt,
        });
      }
    }

    // Get completed TV shows with updatedAt
    if (!mediaType || mediaType === 'tv') {
      const completedTVShows = await UserTVShow.find({
        userId,
        status: 'completed',
      })
        .sort({ updatedAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean();

      for (const tvShow of completedTVShows) {
        timeline.push({
          id: tvShow._id,
          tmdbId: tvShow.tmdbTvId,
          mediaType: 'tv',
          status: tvShow.status,
          rating: tvShow.rating,
          watchedDate: tvShow.updatedAt, // Use updatedAt as completion date
          updatedAt: tvShow.updatedAt,
        });
      }
    }

    // Sort timeline by watchedDate/updatedAt (most recent first)
    timeline.sort((a, b) => {
      const dateA = new Date(a.watchedDate || a.updatedAt);
      const dateB = new Date(b.watchedDate || b.updatedAt);
      return dateB - dateA;
    });

    // Limit to requested limit
    const limitedTimeline = timeline.slice(0, parseInt(limit));

    res.json({
      timeline: limitedTimeline,
      page: parseInt(page),
      limit: parseInt(limit),
      total: timeline.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Check if user is admin
exports.checkAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      isAdmin: user.role === 'admin',
      isEditor: user.role === 'editor' || user.role === 'admin',
      role: user.role,
      userId: user._id.toString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

