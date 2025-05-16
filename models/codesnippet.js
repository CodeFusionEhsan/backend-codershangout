const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  user_id: {
    type: String,  // Or String, depending on your user model
    required: true
  },
  user_email: {
    type: String,
    required: true
  },
  user_image: {
    type: String, // URL or path to the image
    required: false
  }
}, { _id: false }); // Prevents creation of a separate _id for the embedded doc

const codeSnippetSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
  },
  uploaded_by: {
    type: userSchema,
    required: true
  },
  language: {
    type: String,
    required: true
  },
  uploaded_at: {
    type: String,
    default: new Date().toLocaleDateString()
  }
});

module.exports = mongoose.model('snippets', codeSnippetSchema);
