const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['lost', 'found'],
      required: [true, 'Item type (lost/found) is required'],
    },
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    subcategory: {
      type: String,
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
      maxlength: [50, 'Brand cannot exceed 50 characters'],
    },
    model: {
      type: String,
      trim: true,
      maxlength: [50, 'Model cannot exceed 50 characters'],
    },
    color: {
      type: String,
      trim: true,
      maxlength: [30, 'Color cannot exceed 30 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    identifyingFeatures: {
      type: String,
      trim: true,
      maxlength: [1000, 'Identifying features cannot exceed 1000 characters'],
    },
    // Private — never exposed publicly
    serialNumber: {
      type: String,
      trim: true,
      select: false,
    },
    images: [
      {
        public_id: String,
        url: String,
      },
    ],
    // Location as GeoJSON
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
      address: String,
      landmark: String,
      area: String, // General area for privacy
    },
    // Date details
    lostDate: {
      type: Date,
    },
    foundDate: {
      type: Date,
    },
    approximateTime: {
      type: String,
      trim: true,
    },
    // Reward
    reward: {
      offered: {
        type: Boolean,
        default: false,
      },
      amount: {
        type: Number,
        min: 0,
      },
      description: {
        type: String,
        trim: true,
        maxlength: [500, 'Reward description cannot exceed 500 characters'],
      },
    },
    // Status
    status: {
      type: String,
      enum: [
        'active',
        'under_review',
        'potential_match',
        'claimed',
        'verification_pending',
        'approved',
        'returned',
        'closed',
        'rejected',
      ],
      default: 'active',
    },
    // Organization
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
    },
    // Additional details
    additionalDetails: {
      type: String,
      trim: true,
      maxlength: [1000, 'Additional details cannot exceed 1000 characters'],
    },
    // Current possession (for found items)
    currentPossession: {
      type: String,
      trim: true,
    },
    // Visibility
    visibility: {
      type: String,
      enum: ['public', 'organization', 'private'],
      default: 'public',
    },
    // View count
    viewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
itemSchema.index({ location: '2dsphere' });
itemSchema.index({ name: 'text', description: 'text', brand: 'text' });
itemSchema.index({ type: 1, status: 1 });
itemSchema.index({ category: 1 });
itemSchema.index({ user: 1 });
itemSchema.index({ organization: 1 });
itemSchema.index({ createdAt: -1 });
itemSchema.index({ lostDate: -1 });
itemSchema.index({ foundDate: -1 });

// Virtuals
itemSchema.virtual('isLost').get(function () {
  return this.type === 'lost';
});

itemSchema.virtual('isFound').get(function () {
  return this.type === 'found';
});

itemSchema.virtual('itemDate').get(function () {
  return this.type === 'lost' ? this.lostDate : this.foundDate;
});

module.exports = mongoose.model('Item', itemSchema);
