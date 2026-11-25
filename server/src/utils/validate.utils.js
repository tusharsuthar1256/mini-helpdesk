const { PRIORITIES, CATEGORIES } = require('./constants.utils');

const isText = (value, min, max) => {
  if (typeof value !== 'string') return false;
  const length = value.trim().length;
  return length >= min && length <= max;
};

const validateRegister = (body) => {
  const errors = [];
  const { name, email, password } = body;

  if (!isText(name, 2, 80)) {
    errors.push({ field: 'name', message: 'Name must be between 2 and 80 characters' });
  }
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.push({ field: 'email', message: 'Enter a valid email' });
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
    errors.push({ field: 'password', message: 'Password must be between 8 and 72 characters' });
  } else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    errors.push({ field: 'password', message: 'Password must contain a letter and a number' });
  }

  return errors;
};

const validateTicket = (body) => {
  const errors = [];
  const { title, description, category, priority } = body;

  if (!isText(title, 5, 120)) {
    errors.push({ field: 'title', message: 'Title must be between 5 and 120 characters' });
  }
  if (!isText(description, 10, 5000)) {
    errors.push({ field: 'description', message: 'Description must be between 10 and 5000 characters' });
  }
  if (category !== undefined && !CATEGORIES.includes(category)) {
    errors.push({ field: 'category', message: 'Invalid category' });
  }
  if (priority !== undefined && !PRIORITIES.includes(priority)) {
    errors.push({ field: 'priority', message: 'Invalid priority' });
  }

  return errors;
};

module.exports = { isText, validateRegister, validateTicket };
