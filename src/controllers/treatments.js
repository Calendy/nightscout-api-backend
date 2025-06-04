const Treatment = require('../models/Treatment');
const { Op } = require('sequelize');
const { buildWhereClause } = require('../utils/query');

// GET /api/v1/treatments[.json]
const getTreatments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { find, count = 10 } = req.query;
    
    // Parse MongoDB-style query
    const whereClause = buildWhereClause(find, userId);
    
    // Default to last 2 days if no date filter provided
    if (!find || !find.includes('created_at')) {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      whereClause.created_at = {
        [Op.gte]: twoDaysAgo
      };
    }
    
    const treatments = await Treatment.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: Math.min(parseInt(count), 1000) // Cap at 1000 treatments
    });
    
    // Convert to Nightscout format
    const nightscoutTreatments = treatments.map(treatment => treatment.toNightscoutFormat());
    
    res.json(nightscoutTreatments);
  } catch (error) {
    console.error('Error fetching treatments:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch treatments'
    });
  }
};

// POST /api/v1/treatments[.json]
const createTreatments = async (req, res) => {
  try {
    const userId = req.user.id;
    let treatments = req.body;
    
    // Ensure treatments is an array
    if (!Array.isArray(treatments)) {
      treatments = [treatments];
    }
    
    const createdTreatments = [];
    const rejectedTreatments = [];
    
    for (const treatmentData of treatments) {
      try {
        // Validate required fields
        if (!treatmentData.eventType) {
          rejectedTreatments.push({
            treatment: treatmentData,
            error: 'eventType is required'
          });
          continue;
        }
        
        if (!treatmentData.created_at) {
          treatmentData.created_at = new Date();
        }
        
        // Add user_id
        treatmentData.user_id = userId;
        
        const treatment = await Treatment.create(treatmentData);
        createdTreatments.push(treatment.toNightscoutFormat());
      } catch (validationError) {
        console.error('Treatment validation error:', validationError);
        rejectedTreatments.push({
          treatment: treatmentData,
          error: validationError.message
        });
      }
    }
    
    // Return rejected treatments (empty array means success)
    res.json(rejectedTreatments);
  } catch (error) {
    console.error('Error creating treatments:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create treatments'
    });
  }
};

// DELETE /api/v1/treatments
const deleteTreatments = async (req, res) => {
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
    
    const deletedCount = await Treatment.destroy(deleteOptions);
    
    res.json({
      deleted: deletedCount,
      message: `${deletedCount} treatments deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting treatments:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete treatments'
    });
  }
};

// DELETE /api/v1/treatments/{id}
const deleteTreatmentById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { spec: treatmentId } = req.params;
    
    const deletedCount = await Treatment.destroy({
      where: {
        id: treatmentId,
        user_id: userId
      }
    });
    
    if (deletedCount === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Treatment not found'
      });
    }
    
    res.json({
      n: deletedCount,
      ok: 1,
      message: 'Treatment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting treatment by ID:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete treatment'
    });
  }
};

module.exports = {
  getTreatments,
  createTreatments,
  deleteTreatments,
  deleteTreatmentById
};
