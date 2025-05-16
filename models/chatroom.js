const mongoose = require('mongoose');
const { Schema } = mongoose;

// Embedded user info schema for participants
const userInfoSchema = new Schema({
  user_id: { type: String, required: true},
  user_email: { type: String, required: true },
  user_image: { type: String },
  user_role: {type: String}
}, { _id: false });

// Message schema for chat history
const messageSchema = new Schema({
  sender: { type: userInfoSchema, required: true },
  content: { type: String, required: true },
  sent_at: { type: Date, default: new Date().toLocaleDateString() }
}, { _id: false });

const chatroomSchema = new Schema({
  name: { type: String, required: true, index: true },
  description: { type: String },
  participants: [userInfoSchema], // Array of users
  messages: [messageSchema],      // Array of messages
  created_at: { type: Date, default: Date.now },
  image: { type: String }         // Optional chatroom image
});

// Optional: text index for searching chatroom names and descriptions
chatroomSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('chatroom', chatroomSchema);
