const express = require('express');
const rateLimit = require('express-rate-limit');
const { register, login, getMe } = require('../controllers/auth.controllers');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: { success: false, message: 'Too many attempts, please try again later' },
});

router.post('/register', limiter, register);
router.post('/login', limiter, login);
router.get('/me', protect, getMe);

module.exports = router;
