const mongoose = require('mongoose');

const CATEGORIES = ['Bug', 'Feature', 'Billing', 'Other'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed', 'Queued'];

const commentSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, minlength: 3 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const historySchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const ticketSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 5, maxlength: 100 },
    description: { type: String, required: true, trim: true, minlength: 20 },
    category: { type: String, required: true, enum: CATEGORIES },
    priority: { type: String, required: true, enum: PRIORITIES, default: 'Medium' },
    status: { type: String, required: true, enum: STATUSES, default: 'Open' },
    version: { type: Number, default: 1 },
    assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', default: null },
    priorityEscalated: { type: Boolean, default: false },
    comments: { type: [commentSchema], default: [] },
    history: { type: [historySchema], default: [] },
  },
  { timestamps: true }
);

ticketSchema.statics.CATEGORIES = CATEGORIES;
ticketSchema.statics.PRIORITIES = PRIORITIES;
ticketSchema.statics.STATUSES = STATUSES;

module.exports = mongoose.model('Ticket', ticketSchema);
