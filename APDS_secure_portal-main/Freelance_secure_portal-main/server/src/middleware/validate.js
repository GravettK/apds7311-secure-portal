
const { ZodError } = require('zod');


function trimStrings(obj) {
  if (obj && typeof obj === 'object') {
    for (const k of Object.keys(obj)) {
      if (typeof obj[k] === 'string') obj[k] = obj[k].trim();
      else if (typeof obj[k] === 'object') trimStrings(obj[k]);
    }
  }
  return obj;
}


function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      
      if (source === 'body') trimStrings(req.body);
      if (source === 'query') trimStrings(req.query);
      if (source === 'params') trimStrings(req.params);

      const parsed = schema.parse(req[source]);
      req.validated = req.validated || {};
      req.validated[source] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: err.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        });
      }
      next(err);
    }
  };
}

module.exports = { validate };
