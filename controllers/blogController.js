const BlogPost = require('../models/BlogPost');
const BlogCategory = require('../models/BlogCategory');
const BlogTag = require('../models/BlogTag');
const { siteFilter } = require('../middleware/siteResolver');

// Helper function to generate slug from title
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Apply language/region locale to a single post document
const applyLocaleToPost = (post, locale) => {
  if (!post || !locale) return post;
  const { language, region } = locale;

  // Region filtering: if post has availableRegions and region is not included, exclude
  if (Array.isArray(post.availableRegions) && post.availableRegions.length > 0) {
    if (!region || !post.availableRegions.includes(region)) {
      return null;
    }
  }

  if (!Array.isArray(post.translations) || post.translations.length === 0) {
    return post;
  }

  const translation = post.translations.find((t) => t.language === language);
  if (!translation) {
    return post;
  }

  return {
    ...post,
    title: translation.title || post.title,
    excerpt: translation.excerpt || post.excerpt,
    content: translation.content || post.content,
    seoTitle: translation.seoTitle || post.seoTitle,
    seoDescription: translation.seoDescription || post.seoDescription,
    seoKeywords:
      translation.seoKeywords && translation.seoKeywords.length > 0
        ? translation.seoKeywords
        : post.seoKeywords,
  };
};

// Apply language locale to a category document
const applyLocaleToCategory = (category, locale) => {
  if (!category || !locale) return category;
  const { language } = locale;

  if (!Array.isArray(category.translations) || category.translations.length === 0) {
    return category;
  }

  const translation = category.translations.find((t) => t.language === language);
  if (!translation) {
    return category;
  }

  return {
    ...category,
    name: translation.name || category.name,
    description: translation.description || category.description,
  };
};

// Get all blog posts (public - only published, localized)
exports.getPosts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      tag,
      status,
      search,
      featured,
    } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};

    // Only show published posts to non-authenticated users or non-admins
    if (!req.user || req.user.role !== 'admin') {
      query.status = 'published';
    } else if (status) {
      query.status = status;
    }

    if (category) {
      const categoryDoc = await BlogCategory.findOne({ slug: category });
      if (categoryDoc) {
        query.categoryId = categoryDoc._id;
      }
    }

    if (tag) {
      const tagDoc = await BlogTag.findOne({ slug: tag });
      if (tagDoc) {
        query.tags = tagDoc._id;
      }
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    if (featured === 'true') {
      query.featured = true;
    }

    const sf = siteFilter(req.siteId);
    if (Object.keys(sf).length) query.$and = [...(query.$and || []), sf];

    const postsRaw = await BlogPost.find(query)
      .populate('authorId', 'username avatar')
      .populate('categoryId', 'name slug')
      .populate('tags', 'name slug')
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const localizedPosts = postsRaw
      .map((post) => {
        const localizedPost = applyLocaleToPost(post, req.locale);
        if (!localizedPost) return null;
        // Also localize category if present
        if (localizedPost.categoryId && typeof localizedPost.categoryId === 'object') {
          localizedPost.categoryId = applyLocaleToCategory(localizedPost.categoryId, req.locale);
        }
        return localizedPost;
      })
      .filter(Boolean);

    const total = await BlogPost.countDocuments(query);

    res.json({
      posts: localizedPosts,
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

// Get slugs for sitemap (public, no locale filter - returns all published)
exports.getSitemapSlugs = async (req, res) => {
  try {
    const query = { status: 'published' };
    const sf = siteFilter(req.siteId);
    if (Object.keys(sf).length) query.$and = [sf];
    const posts = await BlogPost.find(query)
      .select('slug updatedAt availableRegions')
      .limit(10000)
      .lean();
    res.json({ slugs: posts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single blog post (localized)
exports.getPost = async (req, res) => {
  try {
    const { slug } = req.params;
    const query = { slug };
    const sf = siteFilter(req.siteId);
    if (Object.keys(sf).length) Object.assign(query, sf);
    let post = await BlogPost.findOne(query)
      .populate('authorId', 'username avatar')
      .populate('categoryId', 'name slug description')
      .populate('tags', 'name slug');

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Only show published posts to non-authenticated users or non-admins
    if (post.status !== 'published' && (!req.user || req.user.role !== 'admin')) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Apply locale and region filtering
    const localized = applyLocaleToPost(post.toObject(), req.locale);
    if (!localized) {
      return res.status(404).json({ error: 'Post not available in your region' });
    }

    // Also localize category if present
    if (localized.categoryId && typeof localized.categoryId === 'object') {
      localized.categoryId = applyLocaleToCategory(localized.categoryId, req.locale);
    }

    // Increment view count (on base document)
    post.viewCount += 1;
    await post.save();

    res.json({ post: localized });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create blog post (admin/editor only)
exports.createPost = async (req, res) => {
  try {
    // Check if user is admin or editor (for now, allow all authenticated users)
    // TODO: Add role-based access control
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const {
      title,
      excerpt,
      content,
      featuredImage,
      categoryId,
      tags,
      status,
      seoTitle,
      seoDescription,
      seoKeywords,
    } = req.body;

    if (!title || !excerpt || !content) {
      return res.status(400).json({ error: 'Title, excerpt, and content are required' });
    }

    // Generate slug from title
    let slug = generateSlug(title);
    
    // Ensure slug is unique
    let existingPost = await BlogPost.findOne({ slug });
    let counter = 1;
    while (existingPost) {
      slug = `${generateSlug(title)}-${counter}`;
      existingPost = await BlogPost.findOne({ slug });
      counter++;
    }

    const postData = {
      authorId: req.user._id,
      title,
      slug,
      excerpt,
      content,
      featuredImage: featuredImage || null,
      categoryId: categoryId || null,
      tags: tags || [],
      status: status || 'draft',
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
      seoKeywords: seoKeywords || [],
    };

    // Set publishedAt if status is published
    if (status === 'published') {
      postData.publishedAt = new Date();
    }

    const post = await BlogPost.create(postData);
    await post.populate('authorId', 'username avatar');
    await post.populate('categoryId', 'name slug');
    await post.populate('tags', 'name slug');

    res.status(201).json({ post });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update blog post
exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await BlogPost.findById(id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user is author or admin
    if (post.authorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this post' });
    }

    const {
      title,
      excerpt,
      content,
      featuredImage,
      categoryId,
      tags,
      status,
      seoTitle,
      seoDescription,
      seoKeywords,
    } = req.body;

    if (title) {
      post.title = title;
      // Regenerate slug if title changed
      const newSlug = generateSlug(title);
      if (newSlug !== post.slug) {
        let slug = newSlug;
        let existingPost = await BlogPost.findOne({ slug, _id: { $ne: id } });
        let counter = 1;
        while (existingPost) {
          slug = `${newSlug}-${counter}`;
          existingPost = await BlogPost.findOne({ slug, _id: { $ne: id } });
          counter++;
        }
        post.slug = slug;
      }
    }

    if (excerpt !== undefined) post.excerpt = excerpt;
    if (content !== undefined) post.content = content;
    if (featuredImage !== undefined) post.featuredImage = featuredImage;
    if (categoryId !== undefined) post.categoryId = categoryId;
    if (tags !== undefined) post.tags = tags;
    if (status !== undefined) {
      post.status = status;
      // Set publishedAt if status changed to published
      if (status === 'published' && !post.publishedAt) {
        post.publishedAt = new Date();
      }
    }
    if (seoTitle !== undefined) post.seoTitle = seoTitle;
    if (seoDescription !== undefined) post.seoDescription = seoDescription;
    if (seoKeywords !== undefined) post.seoKeywords = seoKeywords;

    await post.save();
    await post.populate('authorId', 'username avatar');
    await post.populate('categoryId', 'name slug');
    await post.populate('tags', 'name slug');

    res.json({ post });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete blog post
exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await BlogPost.findById(id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user is author or admin
    if (post.authorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    await BlogPost.findByIdAndDelete(id);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all categories
exports.getCategories = async (req, res) => {
  try {
    const categoriesRaw = await BlogCategory.find().sort({ name: 1 }).lean();
    const localizedCategories = categoriesRaw.map((category) =>
      applyLocaleToCategory(category, req.locale)
    );
    res.json({ categories: localizedCategories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all tags
exports.getTags = async (req, res) => {
  try {
    const tags = await BlogTag.find().sort({ name: 1 });
    res.json({ tags });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create category (admin only)
exports.createCategory = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const slug = generateSlug(name);
    const category = await BlogCategory.create({ name, slug, description });

    res.status(201).json({ category });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Category already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

// Create tag (admin only)
exports.createTag = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    const slug = generateSlug(name);
    const tag = await BlogTag.create({ name, slug });

    res.status(201).json({ tag });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Tag already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

// Publish post
exports.publishPost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await BlogPost.findById(id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user is author or admin
    if (post.authorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to publish this post' });
    }

    post.status = 'published';
    if (!post.publishedAt) {
      post.publishedAt = new Date();
    }

    await post.save();
    await post.populate('authorId', 'username avatar');
    await post.populate('categoryId', 'name slug');
    await post.populate('tags', 'name slug');

    res.json({ post });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get featured posts (for now, just get most recent published posts)
exports.getFeaturedPosts = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const query = { status: 'published' };
    const sf = siteFilter(req.siteId);
    if (Object.keys(sf).length) query.$and = [sf];
    const postsRaw = await BlogPost.find(query)
      .populate('authorId', 'username avatar')
      .populate('categoryId', 'name slug')
      .populate('tags', 'name slug')
      .sort({ publishedAt: -1, viewCount: -1 })
      .limit(parseInt(limit))
      .lean();

    // Apply locale to posts and filter by region
    const localizedPosts = postsRaw
      .map((post) => {
        const localizedPost = applyLocaleToPost(post, req.locale);
        if (!localizedPost) return null;
        // Also localize category if present
        if (localizedPost.categoryId && typeof localizedPost.categoryId === 'object') {
          localizedPost.categoryId = applyLocaleToCategory(localizedPost.categoryId, req.locale);
        }
        return localizedPost;
      })
      .filter(Boolean);

    res.json({ posts: localizedPosts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

