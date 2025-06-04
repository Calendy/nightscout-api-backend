const { Op } = require('sequelize');

// Parse MongoDB-style query parameters for Sequelize
const parseQuery = (queryString) => {
  if (!queryString) return {};
  
  try {
    // Handle URL-encoded query parameters
    const decoded = decodeURIComponent(queryString);
    
    // Parse find[field][operator]=value format
    const findParams = {};
    const regex = /find\[([^\]]+)\](?:\[([^\]]+)\])?=([^&]+)/g;
    let match;
    
    while ((match = regex.exec(decoded)) !== null) {
      const field = match[1];
      const operator = match[2];
      const value = match[3];
      
      if (!findParams[field]) {
        findParams[field] = {};
      }
      
      if (operator) {
        findParams[field][operator] = value;
      } else {
        findParams[field] = value;
      }
    }
    
    return findParams;
  } catch (error) {
    console.error('Error parsing query:', error);
    return {};
  }
};

// Convert MongoDB-style operators to Sequelize operators
const convertOperator = (mongoOp, value) => {
  switch (mongoOp) {
    case '$gte':
      return { [Op.gte]: parseValue(value) };
    case '$gt':
      return { [Op.gt]: parseValue(value) };
    case '$lte':
      return { [Op.lte]: parseValue(value) };
    case '$lt':
      return { [Op.lt]: parseValue(value) };
    case '$ne':
      return { [Op.ne]: parseValue(value) };
    case '$in':
      return { [Op.in]: Array.isArray(value) ? value.map(parseValue) : [parseValue(value)] };
    case '$nin':
      return { [Op.notIn]: Array.isArray(value) ? value.map(parseValue) : [parseValue(value)] };
    case '$regex':
      return { [Op.regexp]: value };
    case '$like':
      return { [Op.like]: `%${value}%` };
    default:
      return parseValue(value);
  }
};

// Parse value to appropriate type
const parseValue = (value) => {
  if (typeof value !== 'string') return value;
  
  // Try to parse as number
  if (!isNaN(value) && !isNaN(parseFloat(value))) {
    return parseFloat(value);
  }
  
  // Try to parse as boolean
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  
  // Try to parse as date
  if (value.match(/^\d{4}-\d{2}-\d{2}/) || value.includes('T')) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.getTime(); // Return as timestamp for date fields
    }
  }
  
  return value;
};

// Build Sequelize where clause from find parameters
const buildWhereClause = (findQuery, userId) => {
  const whereClause = { user_id: userId };
  
  if (!findQuery) return whereClause;
  
  // Parse the find query
  let findParams;
  if (typeof findQuery === 'string') {
    findParams = parseQuery(findQuery);
  } else {
    findParams = findQuery;
  }
  
  // Convert each field and its conditions
  Object.keys(findParams).forEach(field => {
    const conditions = findParams[field];
    
    if (typeof conditions === 'object' && conditions !== null) {
      // Handle operators
      const fieldConditions = {};
      Object.keys(conditions).forEach(operator => {
        const converted = convertOperator(operator, conditions[operator]);
        Object.assign(fieldConditions, converted);
      });
      whereClause[field] = fieldConditions;
    } else {
      // Direct value
      whereClause[field] = parseValue(conditions);
    }
  });
  
  return whereClause;
};

// Parse date range queries
const parseDateRange = (dateString) => {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    
    return date.getTime();
  } catch (error) {
    return null;
  }
};

// Build order clause
const buildOrderClause = (sort) => {
  if (!sort) return [['date', 'DESC']];
  
  const orderClauses = [];
  
  if (typeof sort === 'string') {
    const parts = sort.split(',');
    parts.forEach(part => {
      const trimmed = part.trim();
      if (trimmed.startsWith('-')) {
        orderClauses.push([trimmed.substring(1), 'DESC']);
      } else {
        orderClauses.push([trimmed, 'ASC']);
      }
    });
  }
  
  return orderClauses.length > 0 ? orderClauses : [['date', 'DESC']];
};

module.exports = {
  parseQuery,
  convertOperator,
  parseValue,
  buildWhereClause,
  parseDateRange,
  buildOrderClause
};
