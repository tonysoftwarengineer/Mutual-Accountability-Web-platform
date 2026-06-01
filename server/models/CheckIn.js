const mongoose = require('mongoose');
const { Schema } = mongoose;

const CheckinSchema = new Schema({
  goal: { type: Schema.Types.ObjectId, ref: 'Goal', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  note: { type: String, required: true, maxLength: 500 }, // Primary proof
  stake: { type: String }, // Custom stake/bet for this check-in
  progress: { type: Number, min: 0, max: 100 }, // Progress % at time of check-in
  status: { type: String, enum: ['pending', 'approved'], default: 'pending' },
  verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' }, // Backward compat alias for partnerApproval.approvedBy
  verifiedAt: { type: Date },
  partnerApproval: {
    approved: { type: Boolean, default: false },
    approvedAt: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  streakAtTime: { type: Number }, // Streak count at time of check-in
  comments: [{
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  reactions: {
    fire: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    clap: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    muscle: [{ type: Schema.Types.ObjectId, ref: 'User' }]
  }
}, { timestamps: true });

CheckinSchema.index({ goal: 1, createdAt: -1 });
CheckinSchema.index({ user: 1, status: 1 });
CheckinSchema.index({ status: 1, createdAt: -1 });
CheckinSchema.index({ user: 1, createdAt: -1 });
CheckinSchema.index({ user: 1, goal: 1, createdAt: -1 }); // Compound index for isolated feed queries

module.exports = mongoose.model('CheckIn', CheckinSchema);

