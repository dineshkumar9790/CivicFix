import mongoose from 'mongoose';
const issueSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, maxlength: 2000 },
  category: { type: String, enum: ['Roads', 'Waste', 'Streetlights', 'Water', 'Public spaces', 'Other'], default: 'Other' },
  address: { type: String, default: '' },
  location: { lat: Number, lng: Number },
  photo: { type: String, default: '' },
  status: { type: String, enum: ['Reported', 'In Progress', 'Resolved'], default: 'Reported' },
  priority: { type: String, enum: ['Normal', 'High'], default: 'Normal' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  verifiedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });
issueSchema.index({ 'location.lat': 1, 'location.lng': 1, category: 1 });
export default mongoose.model('Issue', issueSchema);
