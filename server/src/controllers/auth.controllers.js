const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User.models');
const { validateRegister } = require('../utils/validate.utils');

const createToken = (user) => {
  return jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
};

const userData = (user) => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
};

const register = async (req, res) => {
  try {
    const body = req.body || {};
    const errors = validateRegister(body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', details: errors });
    }

    const email = body.email.trim().toLowerCase();
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    }

    const user = await User.create({ name: body.name, email, password: body.password });

    res.status(201).json({ success: true, data: { user: userData(user), token: createToken(user) } });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    }
    console.log(error);
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    res.json({ success: true, data: { user: userData(user), token: createToken(user) } });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};

const getMe = (req, res) => {
  res.json({ success: true, data: { user: userData(req.user) } });
};

module.exports = { register, login, getMe };
