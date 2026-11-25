const Comment = require('../models/Comment.models');
const Ticket = require('../models/Ticket.models');
const eventBus = require('../events/eventBus.events');
const { isText } = require('../utils/validate.utils');
const { findTicket } = require('../utils/ticketHelper.utils');

const getComments = async (req, res) => {
  try {
    const ticket = await findTicket(req.params.id, req.user);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const comments = await Comment.find({ ticket: ticket._id })
      .sort({ createdAt: 1 })
      .populate('author', 'name email role');

    res.json({ success: true, data: comments });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};

const addComment = async (req, res) => {
  try {
    const { body } = req.body || {};
    if (!isText(body, 1, 2000)) {
      return res.status(400).json({ success: false, message: 'Comment must be between 1 and 2000 characters' });
    }

    const ticket = await findTicket(req.params.id, req.user);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    if (ticket.status === 'closed') {
      return res.status(400).json({ success: false, message: 'This ticket is closed' });
    }

    const comment = await Comment.create({ ticket: ticket._id, author: req.user._id, body });
    const updatedTicket = await Ticket.findByIdAndUpdate(
      ticket._id,
      { $inc: { commentCount: 1 } },
      { returnDocument: 'after' }
    );

    eventBus.emit('comment.added', { ticket: updatedTicket, user: req.user, comment });

    await comment.populate('author', 'name email role');
    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};

module.exports = { getComments, addComment };
