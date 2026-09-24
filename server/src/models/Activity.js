const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    action: {
      type: String,
      enum: [
        'reported',
        'updated',
        'matched',
        'claimed',
        'verified',
        'approved',
        'rejected',
        'returned',
        'closed',
        'status_changed',
      ],
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

activitySchema.index({ item: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
