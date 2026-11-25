const mongoose = require('mongoose');
const Notification = require('../models/Notification.models');
const { getPagination, pageInfo } = require('../utils/pagination.utils');

const getNotifications = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query, 20);

    const filter = { recipient: req.user._id };
    if (req.query.unread === 'true') filter.read = false;

    const notifications = await Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, read: false });

    res.json({ success: true, data: notifications, pagination: pageInfo(page, limit, total), unreadCount });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};

const markRead = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    const notification = await Notification.findOne({ _id: req.params.id, recipient: req.user._id });
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    notification.read = true;
    await notification.save();

    res.json({ success: true, data: notification });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};

const markAllRead = async (req, res) => {
  try {
    const result = await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
    res.json({ success: true, data: { updated: result.modifiedCount } });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};

module.exports = { getNotifications, markRead, markAllRead };
