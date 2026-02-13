import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['NEW_EVENT', 'EVENT_REMINDER', 'EVENT_UPDATED', 'SYSTEM'],
    required: true 
  },
  scope: { 
    type: String, 
    enum: ['BROADCAST', 'TARGETED', 'PERSONALIZED'],
    required: true 
  },
  
  // METADATA FOR REDIRECTS
  // This allows the frontend to know where to navigate the user
  data: {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    externalLink: { type: String }, // For system-wide announcements
    action: { type: String } // e.g., 'OPEN_EVENT', 'VIEW_PROFILE'
  },
  
  // DELIVERY FIELDS
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
  allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], 
  
  // INTERACTION TRACKING
  isRead: { type: Boolean, default: false }, 
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], 
  deletedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], 
  
  createdAt: { type: Date, default: Date.now }
});


export default mongoose.model("Notification", notificationSchema);