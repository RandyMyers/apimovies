const List = require('../models/List');
const ListItem = require('../models/ListItem');

// Get user lists
exports.getUserLists = async (req, res) => {
  try {
    const lists = await List.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.json(lists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create list
exports.createList = async (req, res) => {
  try {
    const { name, description, isPublic, listType } = req.body;

    if (!name || !listType) {
      return res.status(400).json({ error: 'Name and listType are required' });
    }

    // Validate listType
    if (!['favorites', 'watchlist', 'custom'].includes(listType)) {
      return res.status(400).json({ error: 'Invalid listType' });
    }

    const list = await List.create({
      userId: req.user._id,
      name,
      description,
      isPublic: isPublic || false,
      listType,
    });

    res.status(201).json({ message: 'List created successfully', list });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get list by ID
exports.getList = async (req, res) => {
  try {
    const list = await List.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }

    const items = await ListItem.find({ listId: list._id });

    res.json({ list, items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update list
exports.updateList = async (req, res) => {
  try {
    const { name, description, isPublic, coverImage } = req.body;

    const list = await List.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (coverImage) updateData.coverImage = coverImage;

    const updatedList = await List.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({ message: 'List updated successfully', list: updatedList });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete list
exports.deleteList = async (req, res) => {
  try {
    const list = await List.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }

    // Delete all items in the list
    await ListItem.deleteMany({ listId: list._id });

    // Delete the list
    await List.findByIdAndDelete(req.params.id);

    res.json({ message: 'List deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get list items
exports.getListItems = async (req, res) => {
  try {
    const list = await List.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }

    const items = await ListItem.find({ listId: list._id })
      .sort({ addedAt: -1 });

    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add item to list
exports.addListItem = async (req, res) => {
  try {
    const { tmdbId, mediaType, priority, notes } = req.body;

    if (!tmdbId || !mediaType) {
      return res.status(400).json({ error: 'tmdbId and mediaType are required' });
    }

    const list = await List.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }

    const listItem = await ListItem.findOneAndUpdate(
      { listId: list._id, tmdbId, mediaType },
      { listId: list._id, tmdbId, mediaType, priority, notes },
      { upsert: true, new: true }
    );

    res.json({ message: 'Item added to list', listItem });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Remove item from list
exports.removeListItem = async (req, res) => {
  try {
    const list = await List.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }

    await ListItem.findByIdAndDelete(req.params.itemId);

    res.json({ message: 'Item removed from list' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get watchlist
exports.getWatchlist = async (req, res) => {
  try {
    const watchlist = await List.findOne({
      userId: req.user._id,
      listType: 'watchlist',
    });

    if (!watchlist) {
      return res.json({ list: null, items: [] });
    }

    const items = await ListItem.find({ listId: watchlist._id })
      .sort({ addedAt: -1 });

    res.json({ list: watchlist, items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get favorites
exports.getFavorites = async (req, res) => {
  try {
    const favorites = await List.findOne({
      userId: req.user._id,
      listType: 'favorites',
    });

    if (!favorites) {
      return res.json({ list: null, items: [] });
    }

    const items = await ListItem.find({ listId: favorites._id })
      .sort({ addedAt: -1 });

    res.json({ list: favorites, items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

