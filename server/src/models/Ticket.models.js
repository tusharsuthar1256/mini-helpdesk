const mongoose = require('mongoose');
const { STATUSES, PRIORITIES, CATEGORIES } = require('../utils/constants.utils');

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: { type: Number, unique: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, enum: CATEGORIES, default: 'general' },
    priority: { type: String, enum: PRIORITIES, default: 'medium' },
    status: { type: String, enum: STATUSES, default: 'open' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    commentCount: { type: Number, default: 0 },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

ticketSchema.virtual('reference').get(function () {
  return 'TCK-' + this.ticketNumber;
});

ticketSchema.index({ createdBy: 1, createdAt: -1 });
ticketSchema.index({ status: 1, priority: 1, createdAt: -1 });

module.exports = mongoose.model('Ticket', ticketSchema);
