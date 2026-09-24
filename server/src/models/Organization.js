const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    type: {
      type: String,
      enum: ['college', 'university', 'office', 'hostel', 'event', 'community', 'other'],
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    logo: {
      public_id: String,
      url: String,
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    moderators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    settings: {
      requireApproval: { type: Boolean, default: false },
      allowPublicReports: { type: Boolean, default: true },
      autoMatchEnabled: { type: Boolean, default: true },
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
      address: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    stats: {
      totalItems: { type: Number, default: 0 },
      returnedItems: { type: Number, default: 0 },
      activeMembers: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

organizationSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

// Same fix as Category: insertMany() skips 'save' hooks, so bulk-seeded
// organizations need their slug generated here too, or the unique index
// on `slug` rejects the second document as a duplicate null.
organizationSchema.pre('insertMany', function (next, docs) {
  if (Array.isArray(docs)) {
    docs.forEach((doc) => {
      if (doc.name) {
        doc.slug = doc.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
    });
  }
  next();
});

organizationSchema.index({ slug: 1 });
organizationSchema.index({ admin: 1 });
organizationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Organization', organizationSchema);
