const mongoose = require('mongoose');
const User = require('../models/User.models');
const ActivityLog = require('../models/ActivityLog.models');
const { getPagination, pageInfo } = require('../utils/pagination.utils');
const { ROLES } = require('../utils/constants.utils');

const getUsers = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query, 10);

    const filter = {};
    if (ROLES.includes(req.query.role)) filter.role = req.query.role;

    const users = await User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const total = await User.countDocuments(filter);

    res.json({ success: true, data: users, pagination: pageInfo(page, limit, total) });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};

const getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).sort({ name: 1 });
    res.json({ success: true, data: admins });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};

const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body || {};

    if (!ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot change your own role' });
    }

    user.role = role;
    await user.save();

    res.json({ success: true, data: user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};

const getActivity = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query, 20);

    const activity = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('actor', 'name role');
    const total = await ActivityLog.countDocuments();

    res.json({ success: true, data: activity, pagination: pageInfo(page, limit, total) });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};

module.exports = { getUsers, getAdmins, updateRole, getActivity };
