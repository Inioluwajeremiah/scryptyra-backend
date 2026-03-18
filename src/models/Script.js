const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['scene', 'action', 'character', 'dialogue', 'parenthetical', 'transition', 'note'],
    },
    content: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const scriptSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Script title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
      default: 'Untitled Screenplay',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    blocks: {
      type: [blockSchema],
      default: [],
    },
    wordCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    pageCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    sceneCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ──────────────────────────────────────────────
scriptSchema.index({ userId: 1, updatedAt: -1 });
scriptSchema.index({ userId: 1, title: 'text' });

// ── Pre-save: recalculate stats ──────────────────────────
scriptSchema.pre('save', function (next) {
  const allText = this.blocks.map((b) => b.content).join(' ');
  const words = allText.trim() ? allText.trim().split(/\s+/).length : 0;
  this.wordCount = words;
  this.pageCount = Math.max(1, Math.ceil(words / 200));
  this.sceneCount = this.blocks.filter((b) => b.type === 'scene').length;
  next();
});

// ── Virtuals ─────────────────────────────────────────────
scriptSchema.virtual('updatedAtFormatted').get(function () {
  return this.updatedAt?.toISOString();
});

const Script = mongoose.model('Script', scriptSchema);
module.exports = Script;
