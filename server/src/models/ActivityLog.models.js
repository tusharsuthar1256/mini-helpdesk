const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    event: { type: String, required: true },
    ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: { type: String, required: true },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

activityLogSchema.index({ ticket: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
