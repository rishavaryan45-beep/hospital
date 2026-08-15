const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    appointmentNo: { type: String, required: true, unique: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'], default: 'Pending' },
    notes: String
  },
  { timestamps: true }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
