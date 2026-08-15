const mongoose = require('mongoose');

const medicalReportSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    reportType: { type: String, enum: ['X-Ray', 'MRI', 'CT Scan', 'Blood Test', 'ECG', 'Other Reports'], required: true },
    title: { type: String, required: true },
    filePath: { type: String, required: true },
    notes: String
  },
  { timestamps: true }
);

module.exports = mongoose.model('MedicalReport', medicalReportSchema);
