const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'created', 'updated', 'deleted', 'completed', 'reopened',
      'assigned', 'unassigned', 'commented', 'moved', 'archived',
      'invited', 'joined', 'left', 'status_changed', 'priority_changed',
      'due_date_changed', 'checklist_updated', 'attachment_added'
    ]
  },
  entityType: {
    type: String,
    required: true,
    enum: ['task', 'project', 'team', 'user', 'comment']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  entityTitle: {
    type: String,
    default: ''
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

activityLogSchema.index({ actor: 1, createdAt: -1 });
activityLogSchema.index({ project: 1, createdAt: -1 });
activityLogSchema.index({ entityType: 1, entityId: 1 });
activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
