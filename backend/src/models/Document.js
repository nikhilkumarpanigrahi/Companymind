const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    embedding: {
      type: [Number],
      required: true,
      validate: {
        validator: Array.isArray,
        message: 'embedding must be an array of numbers'
      }
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true
    }
  },
  {
    versionKey: false
  }
);

documentSchema.index({ createdAt: -1 });

const Document = mongoose.model('Document', documentSchema);

module.exports = { Document };
