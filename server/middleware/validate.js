// server/middleware/validate.js
const { ZodError } = require('zod');

function validate(schema, where = 'body') {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[where] ?? {});
      req.validated = req.validated || {};
      req.validated[where] = parsed;
      next();
    } catch (e) {
      if (e instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          issues: e.issues.map(i => ({
            path: i.path.join('.'),
            message: i.message
          }))
        });
      }
      next(e);
    }
  };
}

module.exports = { validate };
