const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { authenticate, optionalAuth } = require('../middleware/auth');

// Public routes
router.get('/posts', optionalAuth, blogController.getPosts);
router.get('/posts/featured', blogController.getFeaturedPosts);
router.get('/posts/sitemap-slugs', blogController.getSitemapSlugs);
router.get('/posts/:slug', optionalAuth, blogController.getPost);
router.get('/categories', blogController.getCategories);
router.get('/tags', blogController.getTags);

// Protected routes (authenticated users)
router.post('/posts', authenticate, blogController.createPost);
router.put('/posts/:id', authenticate, blogController.updatePost);
router.delete('/posts/:id', authenticate, blogController.deletePost);
router.post('/posts/:id/publish', authenticate, blogController.publishPost);
router.post('/categories', authenticate, blogController.createCategory);
router.post('/tags', authenticate, blogController.createTag);

module.exports = router;

