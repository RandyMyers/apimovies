const Review = require('../models/Review');

// Create review
exports.createReview = async (req, res) => {
  try {
    const { tmdbId, mediaType, rating, title, content, containsSpoilers } = req.body;
    const userId = req.user._id;

    if (!tmdbId || !mediaType || !rating || !title || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user already reviewed this content
    const existingReview = await Review.findOne({
      userId,
      tmdbId,
      mediaType,
    });

    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this content' });
    }

    const review = await Review.create({
      userId,
      tmdbId,
      mediaType,
      rating,
      title,
      content,
      containsSpoilers: containsSpoilers || false,
    });

    // Populate user data
    await review.populate('userId', 'username avatar');

    res.status(201).json({ message: 'Review created successfully', review });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get review by ID
exports.getReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('userId', 'username avatar')
      .populate('likesCount');

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get reviews for a movie
exports.getMovieReviews = async (req, res) => {
  try {
    const movieId = parseInt(req.params.movieId);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({
      tmdbId: movieId,
      mediaType: 'movie',
    })
      .populate('userId', 'username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({
      tmdbId: movieId,
      mediaType: 'movie',
    });

    res.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get reviews for a TV show
exports.getTVReviews = async (req, res) => {
  try {
    const tvId = parseInt(req.params.tvId);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({
      tmdbId: tvId,
      mediaType: 'tv',
    })
      .populate('userId', 'username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({
      tmdbId: tvId,
      mediaType: 'tv',
    });

    res.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user reviews
exports.getUserReviews = async (req, res) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ userId });

    res.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update review
exports.updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check if user owns the review
    if (review.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this review' });
    }

    const { rating, title, content, containsSpoilers } = req.body;
    const updateData = {};

    if (rating) updateData.rating = rating;
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (containsSpoilers !== undefined) updateData.containsSpoilers = containsSpoilers;

    const updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('userId', 'username avatar');

    res.json({ message: 'Review updated successfully', review: updatedReview });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete review
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check if user owns the review
    if (review.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this review' });
    }

    await Review.findByIdAndDelete(req.params.id);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Like review
exports.likeReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Increment likes count
    review.likesCount += 1;
    await review.save();

    res.json({ message: 'Review liked', review });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Unlike review
exports.unlikeReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Decrement likes count (minimum 0)
    review.likesCount = Math.max(0, review.likesCount - 1);
    await review.save();

    res.json({ message: 'Review unliked', review });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

