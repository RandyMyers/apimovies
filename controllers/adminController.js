const BlogPost = require('../models/BlogPost');
const BlogCategory = require('../models/BlogCategory');
const BlogTag = require('../models/BlogTag');

// Helper function to generate slug from title
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Get all blog posts (admin view - includes all statuses)
exports.getAllBlogPosts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      category,
      tag,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};

    if (status) {
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

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const posts = await BlogPost.find(query)
      .populate('authorId', 'username avatar')
      .populate('categoryId', 'name slug')
      .populate('tags', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await BlogPost.countDocuments(query);

    res.json({
      posts,
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

// Get single blog post (admin view)
exports.getBlogPost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await BlogPost.findById(id)
      .populate('authorId', 'username avatar email')
      .populate('categoryId', 'name slug description')
      .populate('tags', 'name slug');

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({ post });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create blog post
exports.createBlogPost = async (req, res) => {
  try {
    const {
      title,
      slug: slugFromBody,
      excerpt,
      content,
      featuredImage,
      categoryId,
      tags,
      status = 'draft',
      seoTitle,
      seoDescription,
      seoKeywords,
      translations,
      availableRegions,
      siteIds,
    } = req.body;

    if (!title || !excerpt || !content) {
      return res.status(400).json({ error: 'Title, excerpt, and content are required' });
    }

    let slug = slugFromBody && slugFromBody.trim() ? slugFromBody.trim().toLowerCase() : generateSlug(title);
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
      status,
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
      seoKeywords: seoKeywords || [],
      translations: translations || [],
      availableRegions: availableRegions || [],
      siteIds: Array.isArray(siteIds) ? siteIds : [],
    };

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
exports.updateBlogPost = async (req, res) => {
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
      slug: slugFromBody,
      excerpt,
      content,
      featuredImage,
      categoryId,
      tags,
      status,
      seoTitle,
      seoDescription,
      seoKeywords,
      translations,
      availableRegions,
      siteIds,
    } = req.body;

    if (title) post.title = title;

    if (slugFromBody && slugFromBody.trim()) {
      let slug = slugFromBody.trim().toLowerCase();
      let existingPost = await BlogPost.findOne({ slug, _id: { $ne: id } });
      let counter = 1;
      while (existingPost) {
        slug = `${slugFromBody.trim().toLowerCase()}-${counter}`;
        existingPost = await BlogPost.findOne({ slug, _id: { $ne: id } });
        counter++;
      }
      post.slug = slug;
    } else if (title) {
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
      if (status === 'published' && !post.publishedAt) {
        post.publishedAt = new Date();
      }
    }
    if (seoTitle !== undefined) post.seoTitle = seoTitle;
    if (seoDescription !== undefined) post.seoDescription = seoDescription;
    if (seoKeywords !== undefined) post.seoKeywords = seoKeywords;
    if (translations !== undefined) post.translations = translations;
    if (availableRegions !== undefined) post.availableRegions = availableRegions;
    if (siteIds !== undefined) post.siteIds = Array.isArray(siteIds) ? siteIds : [];

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
exports.deleteBlogPost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await BlogPost.findById(id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    await BlogPost.findByIdAndDelete(id);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
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

// Unpublish post
exports.unpublishPost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await BlogPost.findById(id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.authorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to unpublish this post' });
    }

    post.status = 'draft';
    await post.save();

    res.json({ post });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Bulk blog actions
exports.bulkBlogActions = async (req, res) => {
  try {
    const { action, postIds } = req.body;

    if (!action || !Array.isArray(postIds) || postIds.length === 0) {
      return res.status(400).json({ error: 'Action and postIds array are required' });
    }

    let result;
    switch (action) {
      case 'publish':
        result = await BlogPost.updateMany(
          { _id: { $in: postIds } },
          { 
            $set: { 
              status: 'published',
              publishedAt: new Date()
            } 
          }
        );
        break;
      case 'unpublish':
        result = await BlogPost.updateMany(
          { _id: { $in: postIds } },
          { $set: { status: 'draft' } }
        );
        break;
      case 'delete':
        result = await BlogPost.deleteMany({ _id: { $in: postIds } });
        break;
      case 'archive':
        result = await BlogPost.updateMany(
          { _id: { $in: postIds } },
          { $set: { status: 'archived' } }
        );
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    res.json({ 
      message: `Bulk action ${action} completed successfully`,
      modifiedCount: result.modifiedCount || result.deletedCount || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all categories (admin)
exports.getCategories = async (req, res) => {
  try {
    const categories = await BlogCategory.find().sort({ name: 1 });
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create category
exports.createCategory = async (req, res) => {
  try {
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

// Update category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const category = await BlogCategory.findById(id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (name) {
      category.name = name;
      category.slug = generateSlug(name);
    }
    if (description !== undefined) {
      category.description = description;
    }

    await category.save();
    res.json({ category });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Category slug already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

// Delete category
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await BlogCategory.findById(id);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if any posts use this category
    const postsWithCategory = await BlogPost.countDocuments({ categoryId: id });
    if (postsWithCategory > 0) {
      return res.status(400).json({ 
        error: `Cannot delete category. ${postsWithCategory} post(s) are using it.` 
      });
    }

    await BlogCategory.findByIdAndDelete(id);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all tags (admin)
exports.getTags = async (req, res) => {
  try {
    const tags = await BlogTag.find().sort({ name: 1 });
    res.json({ tags });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create tag
exports.createTag = async (req, res) => {
  try {
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

// Update tag
exports.updateTag = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    const tag = await BlogTag.findById(id);
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    tag.name = name;
    tag.slug = generateSlug(name);

    await tag.save();
    res.json({ tag });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Tag slug already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

// Delete tag
exports.deleteTag = async (req, res) => {
  try {
    const { id } = req.params;
    const tag = await BlogTag.findById(id);

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    await BlogTag.findByIdAndDelete(id);
    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

