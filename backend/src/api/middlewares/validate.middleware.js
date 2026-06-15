// src/api/middlewares/validate.middleware.js
const { ZodError } = require('zod');
const ApiError = require('../../utils/ApiError');

/**
 * Validates request body/params/query against a Zod schema
 * @param {Object} schemas - { body?, params?, query? }
 */
function validate(schemas) {
  return (req, res, next) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        next(ApiError.badRequest('Validation failed', details));
      } else {
        next(err);
      }
    }
  };
}

module.exports = validate;
