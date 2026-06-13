const { CATEGORIES, PRIORITIES } = require('./constants');

/**
 * Validate ticket creation body. Returns { valid, errors } where
 * `errors` is a field-keyed map matching the frontend's structure.
 */
function validateCreateTicket(body = {}) {
  const errors = {};
  const { title, description, category, priority } = body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    errors.title = 'Title is required';
  } else if (title.trim().length < 5) {
    errors.title = 'Title must be at least 5 characters';
  } else if (title.trim().length > 100) {
    errors.title = 'Title cannot exceed 100 characters';
  }

  if (!description || typeof description !== 'string' || !description.trim()) {
    errors.description = 'Description is required';
  } else if (description.trim().length < 20) {
    errors.description = 'Description must be at least 20 characters';
  }

  if (!category) {
    errors.category = 'Category is required';
  } else if (!CATEGORIES.includes(category)) {
    errors.category = 'Invalid category';
  }

  if (!priority) {
    errors.priority = 'Priority is required';
  } else if (!PRIORITIES.includes(priority)) {
    errors.priority = 'Invalid priority';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

function validateComment(body = {}) {
  const errors = {};
  if (!body.text || typeof body.text !== 'string' || body.text.trim().length < 3) {
    errors.text = 'Comment must be at least 3 characters';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

module.exports = { validateCreateTicket, validateComment };
