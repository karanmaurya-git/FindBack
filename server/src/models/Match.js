const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema(
  {
    lostItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    foundItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    similarityScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    matchedFeatures: [
      {
        feature: {
          type: String,
          required: true,
        },
        score: {
          type: Number,
          min: 0,
          max: 100,
        },
        detail: String,
      },
    ],
    aiExplanation: {
      type: String,
      required: true,
    },
    visualAnalysisUsed: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'dismissed', 'claimed', 'confirmed'],
      default: 'pending',
    },
    notifiedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    dismissedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

matchSchema.index({ lostItem: 1, foundItem: 1 }, { unique: true });
matchSchema.index({ status: 1 });
matchSchema.index({ similarityScore: -1 });
matchSchema.index({ notifiedUsers: 1 });

module.exports = mongoose.model('Match', matchSchema);
