const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: true, unique: true },
    type: { type: String, enum: ['ICU', 'General Ward', 'Private Room', 'Deluxe Room'], required: true },
    ward: String,
    bedCount: { type: Number, default: 1 },
    chargePerDay: { type: Number, default: 0 },
    status: { type: String, enum: ['Available', 'Occupied', 'Maintenance'], default: 'Available' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Room', roomSchema);
