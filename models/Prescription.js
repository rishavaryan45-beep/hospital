const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    diagnosis: String,
    notes: String,
    medicines: [
      {
        medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
        name: String,
        dosage: String,
        quantity: { type: Number, default: 1 },
        unit: { type: String, enum: ['Tablet', 'Bottle', 'Packet', 'Strip', 'Injection', 'Other'], default: 'Tablet' },
        morning: Boolean,
        afternoon: Boolean,
        night: Boolean,
        days: Number,
        instructions: String
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Prescription', prescriptionSchema);
