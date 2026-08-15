const mongoose = require('mongoose');

const admissionSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    ward: String,
    bedNumber: { type: String, required: true },
    admissionDate: { type: Date, default: Date.now },
    expectedDischarge: Date,
    dischargeDate: Date,
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    status: { type: String, enum: ['Admitted', 'Discharged'], default: 'Admitted' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Admission', admissionSchema);
