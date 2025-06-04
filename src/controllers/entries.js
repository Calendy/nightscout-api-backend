const Entry = require('../models/Entry');
const { Op } = require('sequelize');
const { parseQuery, buildWhereClause } = require('../utils/query');

// GET /api/v1/entries[.json]
const getEntries = async (req, res) => {
  try {
    const userId = req.user.id;
    const { find, count = 10 } = req.query;
    
    // Parse MongoDB-style query
    const whereClause = buildWhereClause(find, userId);
    
    // Default to last 2 days if no date filter provided
    if (!find || !find.includes('date')) {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      whereClause.date = {
        [Op.gte]: twoDaysAgo.getTime()
      };
    }
    
    const entries = await Entry.findAll({
      where: whereClause,
      order: [['date', 'DESC']],
      limit: Math.min(parseInt(count), 1000) // Cap at 1000 entries
    });
    
    // Convert to Nightscout format
    const nightscoutEntries = entries.map(entry => entry.toNightscoutFormat());
    
    res.json(nightscoutEntries);
  } catch (error) {
    console.error('Error fetching entries:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch entries'
    });
  }
};

// GET /api/v1/entries/{spec}[.json]
const getEntriesBySpec = async (req, res) => {
  try {
    const userId = req.user.id;
    const { spec } = req.params;
    const { find, count = 10 } = req.query;
    
    let whereClause = buildWhereClause(find, userId);
    
    // Handle spec parameter
    if (spec && spec !== 'sgv') {
      // If spec is a UUID, find specific entry
      if (spec.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        whereClause.id = spec;
      } else {
        // Otherwise, treat as type filter
        whereClause.type = spec;
      }
    }
    
    // Default to last 2 days if no date filter provided
    if (!find || !find.includes('date')) {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      whereClause.date = {
        [Op.gte]: twoDaysAgo.getTime()
      };
    }
    
    const entries = await Entry.findAll({
      where: whereClause,
      order: [['date', 'DESC']],
      limit: Math.min(parseInt(count), 1000)
    });
    
    const nightscoutEntries = entries.map(entry => entry.toNightscoutFormat());
    
    res.json(nightscoutEntries);
  } catch (error) {
    console.error('Error fetching entries by spec:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch entries'
    });
  }
};

// POST /api/v1/entries[.json]
const createEntries = async (req, res) => {
  try {
    const userId = req.user.id;
    let entries = req.body;
    
    // Ensure entries is an array
    if (!Array.isArray(entries)) {
      entries = [entries];
    }
    
    const createdEntries = [];
    const rejectedEntries = [];
    
    for (const entryData of entries) {
      try {
        // Validate required fields
        if (!entryData.type) {
          entryData.type = 'sgv';
        }
        
        if (!entryData.dateString && !entryData.date) {
          entryData.dateString = new Date().toISOString();
        }
        
        // Add user_id
        entryData.user_id = userId;
        
        const entry = await Entry.create(entryData);
        createdEntries.push(entry.toNightscoutFormat());
      } catch (validationError) {
        console.error('Entry validation error:', validationError);
        rejectedEntries.push({
          entry: entryData,
          error: validationError.message
        });
      }
    }
    
    // Return rejected entries (empty array means success)
    res.json(rejectedEntries);
  } catch (error) {
    console.error('Error creating entries:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create entries'
    });
  }
};

// DELETE /api/v1/entries
const deleteEntries = async (req, res) => {
  try {
    const userId = req.user.id;
    const { find, count } = req.query;
    
    const whereClause = buildWhereClause(find, userId);
    
    const deleteOptions = {
      where: whereClause
    };
    
    if (count) {
      deleteOptions.limit = parseInt(count);
    }
    
    const deletedCount = await Entry.destroy(deleteOptions);
    
    res.json({
      deleted: deletedCount,
      message: `${deletedCount} entries deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting entries:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete entries'
    });
  }
};

module.exports = {
  getEntries,
  getEntriesBySpec,
  createEntries,
  deleteEntries
};
