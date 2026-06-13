/**
 * Centralised error handler. Translates known Mongoose errors into 4xx
 * responses and falls back to a generic 500 for everything else.
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error('[error]', err);

  if (err && err.name === 'ValidationError') {
    const errors = {};
    for (const [k, v] of Object.entries(err.errors || {})) {
      errors[k] = v.message;
    }
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  if (err && err.name === 'CastError') {
    return res.status(400).json({ message: `Invalid value for ${err.path}` });
  }

  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Internal server error' });
}

function notFound(req, res) {
  res.status(404).json({ message: 'Route not found' });
}

module.exports = { errorHandler, notFound };
