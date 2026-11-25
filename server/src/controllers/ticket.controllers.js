const mongoose = require('mongoose');
const Ticket = require('../models/Ticket.models');
const Comment = require('../models/Comment.models');
const Notification = require('../models/Notification.models');
const ActivityLog = require('../models/ActivityLog.models');
const User = require('../models/User.models');
const eventBus = require('../events/eventBus.events');
const { validateTicket } = require('../utils/validate.utils');
const { getNextTicketNumber, findTicket } = require('../utils/ticketHelper.utils');
const { getPagination, pageInfo } = require('../utils/pagination.utils');
const { STATUSES, PRIORITIES, CATEGORIES } = require('../utils/constants.utils');

const createTicket = async (req, res) => {
  try {
    const body = req.body || {};
    const errors = validateTicket(body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', details: errors });
    }

    const ticket = await Ticket.create({
      ticketNumber: await getNextTicketNumber(),
      title: body.title,
      description: body.description,
      category: body.category,
      priority: body.priority,
      createdBy: req.user._id,
    });

    eventBus.emit('ticket.created', { ticket, user: req.user });

    const newTicket = await findTicket(ticket.id, req.user);
    res.status(201).json({ success: true, data: newTicket });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};

const getTickets = async (req, res) => {
  try {
    const { status, priority, category, search, sortBy } = req.query;
    const { page, limit, skip } = getPagination(req.query, 10);
    const order = req.query.order === 'asc' ? 1 : -1;

    const filter = {};
    if (req.user.role !== 'admin') filter.createdBy = req.user._id;
    if (STATUSES.includes(status)) filter.status = status;
    if (PRIORITIES.includes(priority)) filter.priority = priority;
    if (CATEGORIES.includes(category)) filter.category = category;

    if (typeof search === 'string' && search.trim()) {
      const text = search.trim().slice(0, 100);
      if (/^tck-\d+$/i.test(text)) {
        filter.ticketNumber = Number(text.split('-')[1]);
      } else {
        const safeText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        filter.$or = [
          { title: { $regex: safeText, $options: 'i' } },
          { description: { $regex: safeText, $options: 'i' } },
        ];
      }
    }

    const total = await Ticket.countDocuments(filter);
    let tickets = [];

    if (sortBy === 'priority' || sortBy === 'status') {
      const list = sortBy === 'priority' ? PRIORITIES : STATUSES;
      const allTickets = await Ticket.find(filter)
        .sort({ createdAt: -1 })
        .populate('createdBy', 'name email role')
        .populate('assignedTo', 'name email role');

      allTickets.sort((a, b) => (list.indexOf(a[sortBy]) - list.indexOf(b[sortBy])) * order);
      tickets = allTickets.slice(skip, skip + limit);
    } else {
      const sortField = sortBy === 'updatedAt' || sortBy === 'title' ? sortBy : 'createdAt';
      tickets = await Ticket.find(filter)
        .sort({ [sortField]: order, _id: order })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email role')
        .populate('assignedTo', 'name email role');
    }

    res.json({ success: true, data: tickets, pagination: pageInfo(page, limit, total) });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};

const getTicket = async (req, res) => {
  try {
    const ticket = await findTicket(req.params.id, req.user);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    res.json({ success: true, data: ticket });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};

const updateTicket = async (req, res) => {
  try {
    const ticket = await findTicket(req.params.id, req.user);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    if (req.user.role !== 'admin' && ticket.status !== 'open') {
      return res.status(403).json({ success: false, message: 'You can edit only open tickets' });
    }

    const body = req.body || {};
    const newData = {
      title: body.title ?? ticket.title,
      description: body.description ?? ticket.description,
      category: body.category ?? ticket.category,
      priority: body.priority ?? ticket.priority,
    };

    const fields = ['title', 'description', 'category', 'priority'];
    if (!fields.some((field) => body[field] !== undefined)) {
      return res.status(400).json({ success: false, message: 'Nothing to update' });
    }

    const errors = validateTicket(newData);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', details: errors });
    }

    const changedFields = [];
    for (const field of fields) {
      const value = newData[field].trim();
      if (ticket[field] !== value) {
        ticket[field] = value;
        changedFields.push(field);
      }
    }

    if (changedFields.length > 0) {
      await ticket.save();
      const savedTicket = await Ticket.findById(ticket._id);
      eventBus.emit('ticket.updated', { ticket: savedTicket, user: req.user, fields: changedFields });
    }

    res.json({ success: true, data: ticket });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};

const manageTicket = async (req, res) => {
  try {
    const { status, priority, assignedTo } = req.body || {};

    if (status === undefined && priority === undefined && assignedTo === undefined) {
      return res.status(400).json({ success: false, message: 'Nothing to update' });
    }
    if (status !== undefined && !STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    if (priority !== undefined && !PRIORITIES.includes(priority)) {
      return res.status(400).json({ success: false, message: 'Invalid priority' });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    let assignee = null;
    if (assignedTo) {
      if (typeof assignedTo !== 'string' || !mongoose.isValidObjectId(assignedTo)) {
        return res.status(400).json({ success: false, message: 'Invalid assignee' });
      }
      assignee = await User.findOne({ _id: assignedTo, role: 'admin' });
      if (!assignee) {
        return res.status(400).json({ success: false, message: 'Ticket can be assigned only to an admin' });
      }
    }

    const oldStatus = ticket.status;
    const oldPriority = ticket.priority;
    const oldAssignee = ticket.assignedTo ? String(ticket.assignedTo) : null;
    const newAssignee = assignee ? assignee.id : null;

    const statusChanged = status !== undefined && status !== oldStatus;
    const priorityChanged = priority !== undefined && priority !== oldPriority;
    const assigneeChanged = assignedTo !== undefined && newAssignee !== oldAssignee;

    if (statusChanged) {
      ticket.status = status;
      if (status === 'resolved') {
        ticket.resolvedAt = new Date();
      } else if (status === 'closed') {
        ticket.resolvedAt = ticket.resolvedAt || new Date();
      } else {
        ticket.resolvedAt = null;
      }
    }
    if (priorityChanged) ticket.priority = priority;
    if (assigneeChanged) ticket.assignedTo = newAssignee;

    await ticket.save();

    if (statusChanged) {
      eventBus.emit('ticket.status_changed', { ticket, user: req.user, from: oldStatus, to: status });
      if (status === 'resolved') {
        eventBus.emit('ticket.resolved', { ticket, user: req.user });
      }
    }
    if (priorityChanged) {
      eventBus.emit('ticket.priority_changed', { ticket, user: req.user, from: oldPriority, to: priority });
    }
    if (assigneeChanged) {
      eventBus.emit('ticket.assigned', { ticket, user: req.user, assignee });
    }

    const updatedTicket = await findTicket(ticket.id, req.user);
    res.json({ success: true, data: updatedTicket });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};

const deleteTicket = async (req, res) => {
  try {
    const ticket = await findTicket(req.params.id, req.user);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    if (req.user.role !== 'admin' && ticket.status !== 'open') {
      return res.status(403).json({ success: false, message: 'You can delete only open tickets' });
    }

    await Comment.deleteMany({ ticket: ticket._id });
    await Notification.deleteMany({ ticket: ticket._id });
    await Ticket.findByIdAndDelete(ticket._id);

    eventBus.emit('ticket.deleted', { ticket, user: req.user });

    res.status(204).end();
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};

const getStats = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { createdBy: req.user._id };
    const tickets = await Ticket.find(filter);

    const stats = {
      total: tickets.length,
      createdLastWeek: 0,
      unassigned: 0,
      byStatus: { open: 0, in_progress: 0, resolved: 0, closed: 0 },
      byPriority: { low: 0, medium: 0, high: 0, urgent: 0 },
      byCategory: {},
    };

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    for (const ticket of tickets) {
      stats.byStatus[ticket.status]++;
      stats.byPriority[ticket.priority]++;
      stats.byCategory[ticket.category] = (stats.byCategory[ticket.category] || 0) + 1;

      if (ticket.createdAt >= weekAgo) stats.createdLastWeek++;

      const isActive = ticket.status === 'open' || ticket.status === 'in_progress';
      if (isActive && !ticket.assignedTo) stats.unassigned++;
    }

    res.json({ success: true, data: stats });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};

const getTicketActivity = async (req, res) => {
  try {
    const ticket = await findTicket(req.params.id, req.user);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const activity = await ActivityLog.find({ ticket: ticket._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('actor', 'name email role');

    res.json({ success: true, data: activity });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};

module.exports = {
  createTicket,
  getTickets,
  getTicket,
  updateTicket,
  manageTicket,
  deleteTicket,
  getStats,
  getTicketActivity,
};
