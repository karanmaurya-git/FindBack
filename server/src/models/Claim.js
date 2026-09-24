const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema(
  {
    claimant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    match: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
    },
    // Verification questions asked to the claimant
    verificationQuestions: [
      {
        question: String,
        category: String,
      },
    ],
    // Answers — stored securely, never exposed publicly
    verificationAnswers: [
      {
        question: String,
        answer: {
          type: String,
          select: false,
        },
      },
    ],
    // Evidence (optional images)
    evidence: [
      {
        public_id: String,
        url: String,
        description: String,
      },
    ],
    // Status
    claimStatus: {
      type: String,
      enum: ['pending', 'under_verification', 'approved', 'rejected', 'cancelled', 'completed'],
      default: 'pending',
    },
    // Review
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewNotes: {
      type: String,
      trim: true,
      select: false,
    },
    // Handover
    handoverMethod: {
      type: String,
      enum: ['organization_office', 'security_office', 'public_meeting', 'moderator_assisted', 'other'],
    },
    handoverLocation: {
      type: String,
      trim: true,
    },
    handoverDate: Date,
    // Return confirmation
    returnedAt: Date,
    confirmedByReporter: {
      type: Boolean,
      default: false,
    },
    confirmedByClaimant: {
      type: Boolean,
      default: false,
    },
    // QR-based handover verification (set when the claim is approved).
    // Scanning it proves both people were physically present, rather than
    // a self-attested button click.
    handoverQrToken: {
      type: String,
      select: false,
    },
    // Description of claim
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

claimSchema.index({ claimant: 1 });
claimSchema.index({ item: 1 });
claimSchema.index({ claimStatus: 1 });
claimSchema.index({ match: 1 });

module.exports = mongoose.model('Claim', claimSchema);
