require('dotenv').config();

const connectDB = require('../config/db');
const User = require('../models/User');
const Department = require('../models/Department');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Admission = require('../models/Admission');
const Room = require('../models/Room');
const Medicine = require('../models/Medicine');
const Bill = require('../models/Bill');
const Prescription = require('../models/Prescription');
const MedicalReport = require('../models/MedicalReport');

async function clearDefaults() {
  await connectDB();
  await Promise.all([
    Department.deleteMany(),
    Doctor.deleteMany(),
    Patient.deleteMany(),
    Appointment.deleteMany(),
    Admission.deleteMany(),
    Room.deleteMany(),
    Medicine.deleteMany(),
    Bill.deleteMany(),
    Prescription.deleteMany(),
    MedicalReport.deleteMany(),
    User.deleteMany({ role: { $ne: 'admin' } })
  ]);

  console.log('Cleared all default section data. Admin account kept.');
  process.exit(0);
}

clearDefaults().catch((error) => {
  console.error(error);
  process.exit(1);
});
