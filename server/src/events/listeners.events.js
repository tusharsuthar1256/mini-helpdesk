const eventBus = require('./eventBus.events');
const ActivityLog = require('../models/ActivityLog.models');
const Notification = require('../models/Notification.models');
const User = require('../models/User.models');
const sendEmail = require('../utils/sendEmail.utils');

const saveActivity = async (event, ticket, user, message) => {
  try {
    await ActivityLog.create({
      event,
      ticket: ticket._id,
      actor: user._id,
      message,
      metadata: { reference: ticket.reference },
    });
  } catch (error) {
    console.log('Activity log error:', error.message);
  }
};

const notify = async (event, ticket, user, userIds, title, message) => {
  try {
    for (const userId of userIds) {
      if (String(userId) === String(user._id)) continue;
      await Notification.create({ recipient: userId, event, ticket: ticket._id, title, message });
    }
  } catch (error) {
    console.log('Notification error:', error.message);
  }
};

const notifySupport = async (event, ticket, user, title, message) => {
  try {
    let team = [];
    if (ticket.assignedTo) {
      team = [ticket.assignedTo];
    } else {
      const admins = await User.find({ role: 'admin' });
      team = admins.map((admin) => admin._id);
    }
    await notify(event, ticket, user, team, title, message);
  } catch (error) {
    console.log('Notification error:', error.message);
  }
};

const emailOwner = async (ticket, user, subject, text) => {
  try {
    if (String(ticket.createdBy) === String(user._id)) return;
    const owner = await User.findById(ticket.createdBy);
    if (owner) {
      await sendEmail(owner.email, `[${ticket.reference}] ${subject}`, text);
    }
  } catch (error) {
    console.log('Email error:', error.message);
  }
};

const label = (value) => {
  const text = value.replace('_', ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
};

eventBus.on('ticket.created', async ({ ticket, user }) => {
  const title = `New ticket ${ticket.reference}`;
  const message = `${user.name} opened "${ticket.title}"`;

  await saveActivity('ticket.created', ticket, user, `${user.name} created ticket ${ticket.reference}`);
  await notifySupport('ticket.created', ticket, user, title, message);
});

eventBus.on('ticket.updated', async ({ ticket, user, fields }) => {
  const title = `${ticket.reference} was updated`;
  const message = `${user.name} edited "${ticket.title}"`;
  const names = fields.map((field) => label(field)).join(', ');

  await saveActivity('ticket.updated', ticket, user, `${user.name} updated ${names}`);
  if (user.role === 'admin') {
    await notify('ticket.updated', ticket, user, [ticket.createdBy], title, message);
  } else {
    await notifySupport('ticket.updated', ticket, user, title, message);
  }
});

eventBus.on('ticket.status_changed', async ({ ticket, user, from, to }) => {
  const change = `from ${label(from)} to ${label(to)}`;
  const title = `${ticket.reference} is now ${label(to)}`;
  const message = `Status of "${ticket.title}" changed ${change}`;

  await saveActivity('ticket.status_changed', ticket, user, `${user.name} changed status ${change}`);
  await notify('ticket.status_changed', ticket, user, [ticket.createdBy], title, message);
  await emailOwner(ticket, user, `Status changed to ${label(to)}`, message);
});

eventBus.on('ticket.priority_changed', async ({ ticket, user, from, to }) => {
  const change = `from ${label(from)} to ${label(to)}`;
  const title = `${ticket.reference} priority changed`;
  const message = `Priority of "${ticket.title}" is now ${label(to)}`;

  await saveActivity('ticket.priority_changed', ticket, user, `${user.name} changed priority ${change}`);
  await notify('ticket.priority_changed', ticket, user, [ticket.createdBy], title, message);
});

eventBus.on('ticket.assigned', async ({ ticket, user, assignee }) => {
  if (!assignee) {
    await saveActivity('ticket.assigned', ticket, user, `${user.name} unassigned the ticket`);
    return;
  }

  const title = `${ticket.reference} assigned to you`;
  const message = `You are now handling "${ticket.title}"`;

  await saveActivity('ticket.assigned', ticket, user, `${user.name} assigned the ticket to ${assignee.name}`);
  await notify('ticket.assigned', ticket, user, [assignee._id], title, message);
});

eventBus.on('ticket.resolved', async ({ ticket, user }) => {
  const title = `${ticket.reference} resolved`;
  const message = `"${ticket.title}" has been marked as resolved`;

  await saveActivity('ticket.resolved', ticket, user, `${user.name} marked the ticket as resolved`);
  await notify('ticket.resolved', ticket, user, [ticket.createdBy], title, message);
  await emailOwner(ticket, user, 'Your ticket has been resolved', message);
});

eventBus.on('ticket.deleted', async ({ ticket, user }) => {
  await saveActivity('ticket.deleted', ticket, user, `${user.name} deleted ticket ${ticket.reference}`);
});

eventBus.on('comment.added', async ({ ticket, user, comment }) => {
  const title = `New reply on ${ticket.reference}`;
  const message = `${user.name}: ${comment.body.slice(0, 140)}`;

  await saveActivity('comment.added', ticket, user, `${user.name} added a comment`);
  if (user.role === 'admin') {
    await notify('comment.added', ticket, user, [ticket.createdBy], title, message);
    await emailOwner(ticket, user, 'New reply from support', `${user.name} wrote: ${comment.body}`);
  } else {
    await notifySupport('comment.added', ticket, user, title, message);
  }
});
