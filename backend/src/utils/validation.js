const Joi = require('joi');

// Auth validation schemas
const signupSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().min(2).max(50).required(),
  bio: Joi.string().max(500).optional(),
  headline: Joi.string().max(100).optional(),
  interests: Joi.array().items(Joi.string().max(30)).max(10).optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Profile validation schemas
const profileUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  bio: Joi.string().max(500).allow('').optional(),
  headline: Joi.string().max(100).allow('').optional(),
  interests: Joi.array().items(Joi.string().max(30)).max(10).optional()
});

// Feed validation schemas
const feedQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  search: Joi.string().max(100).allow('').optional(),
  interests: Joi.string().allow('').optional() // comma-separated interests
});

// Middleware function to validate requests
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message,
        details: error.details
      });
    }
    
    req.validatedData = value;
    next();
  };
};

// Middleware function to validate query parameters
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message,
        details: error.details
      });
    }
    
    req.validatedQuery = value;
    next();
  };
};

module.exports = {
  signupSchema,
  loginSchema,
  profileUpdateSchema,
  feedQuerySchema,
  validate,
  validateQuery
};