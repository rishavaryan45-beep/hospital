const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    patientId: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    fatherName: String,
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    dob: Date,
    age: Number,
    bloodGroup: String,
    mobile: { type: String, required: true },
    email: { type: String, lowercase: true, trim: true },
    address: String,
    aadhaarNumber: String,
    emergencyContact: String,
    disease: String,
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    assignedDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    admissionDate: Date,
    dischargeDate: Date,
    status: { type: String, enum: ['OPD', 'Admitted', 'Discharged'], default: 'OPD' },
    photo: String
  },
  { timestamps: true }
);

module.exports = mongoose.model('Patient', patientSchema);
