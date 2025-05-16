const mongoose = require('mongoose');
const { Schema } = mongoose;

// Embedded user info schema for uploaded_by
const userInfoSchema = new Schema({
  user_id: { type: String },
  user_email: { type: String, required: true },
  user_image: { type: String }
}, { _id: false });

const blogSchema = new Schema({
  title: { type: String, required: true, index: true }, // indexed for search
  content: { type: String, required: true },
  excerpt: { type: String },
  reading_time: { type: Number }, // in minutes
  patreon: { type: String }, // link or ID
  sources: { type: String }, // array of URLs or citations
  tags: { type: String, index: true }, // indexed for tag search
  uploaded_by: { type: userInfoSchema, required: true },
  uploaded_at: { type: String, index: true, default: new Date().toLocaleDateString() },
  preview_image: { type: String }
});

// Compound text index for title, excerpt, and tags (for search)
blogSchema.index({ title: 'text', excerpt: 'text', tags: 'text' });

module.exports = mongoose.model('blogs', blogSchema);
