const mongoose = require('mongoose');
const Ticket = require('../models/Ticket.models');
const Counter = require('../models/Counter.models');

const getNextTicketNumber = async () => {
  const counter = await Counter.findByIdAndUpdate(
    'ticket',
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true }
  );
  return 1000 + counter.seq;
};

const findTicket = async (id, user) => {
  if (!mongoose.isValidObjectId(id)) return null;

  const ticket = await Ticket.findById(id)
    .populate('createdBy', 'name email role')
    .populate('assignedTo', 'name email role');

  if (!ticket) return null;
  if (user.role !== 'admin' && ticket.createdBy.id !== user.id) return null;

  return ticket;
};

module.exports = { getNextTicketNumber, findTicket };
