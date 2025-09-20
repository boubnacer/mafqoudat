/**
 * GraphQL-style Field Selection Utilities
 * 
 * Features:
 * - Parse GraphQL-style field selection queries
 * - Support nested field selection
 * - Generate MongoDB projection objects
 * - Validate field selections against schema
 */

/**
 * Parse GraphQL-style field selection string
 * @param {string} fieldQuery - GraphQL field selection query
 * @returns {object} Parsed field selection object
 */
function parseGraphQLFieldSelection(fieldQuery) {
  if (!fieldQuery || typeof fieldQuery !== 'string') {
    return null;
  }
  
  try {
    // Remove extra whitespace and normalize
    const normalizedQuery = fieldQuery.trim().replace(/\s+/g, ' ');
    
    // Parse the field selection
    const fields = {};
    let currentIndex = 0;
    
    while (currentIndex < normalizedQuery.length) {
      const { field, newIndex } = parseField(normalizedQuery, currentIndex);
      if (field) {
        fields[field.name] = field.selection;
      }
      currentIndex = newIndex;
      
      // Skip comma separator
      while (currentIndex < normalizedQuery.length && normalizedQuery[currentIndex] === ',') {
        currentIndex++;
      }
    }
    
    return fields;
  } catch (error) {
    throw new Error(`Invalid GraphQL field selection: ${error.message}`);
  }
}

/**
 * Parse a single field from the query string
 * @param {string} query - Query string
 * @param {number} startIndex - Starting index
 * @returns {object} Parsed field and new index
 */
function parseField(query, startIndex) {
  let index = startIndex;
  
  // Skip whitespace
  while (index < query.length && /\s/.test(query[index])) {
    index++;
  }
  
  if (index >= query.length) {
    return { field: null, newIndex: index };
  }
  
  // Parse field name
  let fieldName = '';
  while (index < query.length && /[a-zA-Z_][a-zA-Z0-9_]*/.test(query[index])) {
    fieldName += query[index];
    index++;
  }
  
  if (!fieldName) {
    throw new Error(`Expected field name at position ${index}`);
  }
  
  // Skip whitespace
  while (index < query.length && /\s/.test(query[index])) {
    index++;
  }
  
  // Check for nested selection
  if (index < query.length && query[index] === '{') {
    index++; // Skip opening brace
    
    const { nestedSelection, newIndex } = parseNestedSelection(query, index);
    return {
      field: {
        name: fieldName,
        selection: nestedSelection
      },
      newIndex: newIndex
    };
  }
  
  return {
    field: {
      name: fieldName,
      selection: true
    },
    newIndex: index
  };
}

/**
 * Parse nested field selection
 * @param {string} query - Query string
 * @param {number} startIndex - Starting index
 * @returns {object} Nested selection and new index
 */
function parseNestedSelection(query, startIndex) {
  let index = startIndex;
  const selection = {};
  
  while (index < query.length && query[index] !== '}') {
    // Skip whitespace
    while (index < query.length && /\s/.test(query[index])) {
      index++;
    }
    
    if (index >= query.length) {
      throw new Error('Unclosed nested selection');
    }
    
    if (query[index] === '}') {
      break;
    }
    
    // Parse nested field
    const { field, newIndex } = parseField(query, index);
    if (field) {
      selection[field.name] = field.selection;
    }
    index = newIndex;
    
    // Skip comma separator
    while (index < query.length && query[index] === ',') {
      index++;
    }
  }
  
  if (index >= query.length || query[index] !== '}') {
    throw new Error('Expected closing brace for nested selection');
  }
  
  return {
    nestedSelection: selection,
    newIndex: index + 1
  };
}

/**
 * Convert GraphQL field selection to MongoDB projection
 * @param {object} fieldSelection - Parsed field selection
 * @param {object} schema - Available fields schema
 * @returns {object} MongoDB projection object
 */
function graphQLToMongoProjection(fieldSelection, schema = {}) {
  if (!fieldSelection) {
    return {};
  }
  
  const projection = {};
  
  for (const [fieldName, selection] of Object.entries(fieldSelection)) {
    if (selection === true) {
      // Simple field inclusion
      projection[fieldName] = 1;
    } else if (typeof selection === 'object') {
      // Nested field selection
      const nestedSchema = schema[fieldName]?.fields || {};
      const nestedProjection = graphQLToMongoProjection(selection, nestedSchema);
      
      // For nested fields, we need to handle them in aggregation pipeline
      projection[`${fieldName}_selection`] = nestedProjection;
    }
  }
  
  return projection;
}

/**
 * Validate field selection against available schema
 * @param {object} fieldSelection - Parsed field selection
 * @param {object} schema - Available fields schema
 * @returns {object} Validation result
 */
function validateFieldSelection(fieldSelection, schema) {
  const errors = [];
  const warnings = [];
  
  if (!fieldSelection) {
    return { valid: true, errors, warnings };
  }
  
  for (const [fieldName, selection] of Object.entries(fieldSelection)) {
    // Check if field exists in schema
    if (!schema[fieldName]) {
      errors.push(`Field '${fieldName}' does not exist in schema`);
      continue;
    }
    
    // Validate nested selection
    if (typeof selection === 'object' && selection !== true) {
      const nestedSchema = schema[fieldName].fields || {};
      if (Object.keys(nestedSchema).length === 0) {
        warnings.push(`Field '${fieldName}' does not support nested selection`);
      } else {
        const nestedValidation = validateFieldSelection(selection, nestedSchema);
        errors.push(...nestedValidation.errors.map(error => `${fieldName}.${error}`));
        warnings.push(...nestedValidation.warnings.map(warning => `${fieldName}.${warning}`));
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Generate field selection documentation
 * @param {object} schema - Available fields schema
 * @returns {object} Documentation object
 */
function generateFieldSelectionDocs(schema) {
  const docs = {
    availableFields: {},
    examples: []
  };
  
  for (const [fieldName, fieldInfo] of Object.entries(schema)) {
    docs.availableFields[fieldName] = {
      description: fieldInfo.description || `${fieldName} field`,
      type: fieldInfo.type || 'string',
      nested: !!fieldInfo.fields
    };
    
    if (fieldInfo.fields) {
      docs.availableFields[fieldName].nestedFields = Object.keys(fieldInfo.fields);
    }
  }
  
  // Generate example queries
  docs.examples = [
    'id,description,contact,createdAt',
    'id,description,user{username},category{code,labels}',
    'id,description,contact,exactLocation,city{code,labels}',
    'id,description,user{username},category{code},country{code,labels}'
  ];
  
  return docs;
}

/**
 * Posts schema definition for GraphQL-style field selection
 */
const POSTS_SCHEMA = {
  id: {
    description: 'Post unique identifier',
    type: 'string'
  },
  description: {
    description: 'Post description',
    type: 'string'
  },
  contact: {
    description: 'Contact information',
    type: 'string'
  },
  exactLocation: {
    description: 'Exact location where item was found/lost',
    type: 'string'
  },
  createdAt: {
    description: 'Post creation timestamp',
    type: 'date'
  },
  updatedAt: {
    description: 'Post last update timestamp',
    type: 'date'
  },
  image: {
    description: 'Post image URL',
    type: 'string'
  },
  returned: {
    description: 'Whether the item was returned to owner',
    type: 'boolean'
  },
  username: {
    description: 'Username of the post author',
    type: 'string'
  },
  categoryname: {
    description: 'Category name/code',
    type: 'string'
  },
  countryname: {
    description: 'Country name/code',
    type: 'string'
  },
  cityName: {
    description: 'City name',
    type: 'string'
  },
  user: {
    description: 'User information',
    type: 'object',
    fields: {
      id: {
        description: 'User ID',
        type: 'string'
      },
      username: {
        description: 'Username',
        type: 'string'
      }
    }
  },
  category: {
    description: 'Category information',
    type: 'object',
    fields: {
      id: {
        description: 'Category ID',
        type: 'string'
      },
      code: {
        description: 'Category code',
        type: 'string'
      },
      labels: {
        description: 'Category labels in different languages',
        type: 'object'
      }
    }
  },
  country: {
    description: 'Country information',
    type: 'object',
    fields: {
      id: {
        description: 'Country ID',
        type: 'string'
      },
      code: {
        description: 'Country code',
        type: 'string'
      },
      labels: {
        description: 'Country labels in different languages',
        type: 'object'
      }
    }
  },
  city: {
    description: 'City information',
    type: 'object',
    fields: {
      id: {
        description: 'City ID',
        type: 'string'
      },
      code: {
        description: 'City code',
        type: 'string'
      },
      labels: {
        description: 'City labels in different languages',
        type: 'object'
      },
      isDynamic: {
        description: 'Whether city was dynamically created',
        type: 'boolean'
      }
    }
  },
  foundLost: {
    description: 'Found/Lost type information',
    type: 'object',
    fields: {
      id: {
        description: 'Found/Lost type ID',
        type: 'string'
      },
      code: {
        description: 'Found/Lost type code',
        type: 'string'
      },
      labels: {
        description: 'Found/Lost type labels in different languages',
        type: 'object'
      }
    }
  }
};

module.exports = {
  parseGraphQLFieldSelection,
  graphQLToMongoProjection,
  validateFieldSelection,
  generateFieldSelectionDocs,
  POSTS_SCHEMA
};
