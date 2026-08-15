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
const PharmacyBill = require('../models/PharmacyBill');
const Prescription = require('../models/Prescription');
const MedicalReport = require('../models/MedicalReport');

async function seed() {
  await connectDB();
  await Promise.all([
    User.deleteMany(),
    Department.deleteMany(),
    Doctor.deleteMany(),
    Patient.deleteMany(),
    Appointment.deleteMany(),
    Admission.deleteMany(),
    Room.deleteMany(),
    Medicine.deleteMany(),
    Bill.deleteMany(),
    PharmacyBill.deleteMany(),
    Prescription.deleteMany(),
    MedicalReport.deleteMany()
  ]);

  const departments = await Department.insertMany([
    { name: 'Cardiology', description: 'Heart care and cardiac procedures' },
    { name: 'Neurology', description: 'Brain and nervous system care' },
    { name: 'Orthopedics', description: 'Bone and joint treatments' },
    { name: 'Pediatrics', description: 'Child health services' },
    { name: 'ENT', description: 'Ear, nose, and throat' },
    { name: 'Eye', description: 'Ophthalmology services' },
    { name: 'Dental', description: 'Dental care' },
    { name: 'General Medicine', description: 'Primary medical care' },
    { name: 'Surgery', description: 'General and advanced surgery' }
  ]);

  const rooms = await Room.insertMany([
    { roomNumber: 'ICU-101', type: 'ICU', ward: 'Critical Care', bedCount: 1, chargePerDay: 5000, status: 'Occupied' },
    { roomNumber: 'GW-201', type: 'General Ward', ward: 'A', bedCount: 6, chargePerDay: 900, status: 'Available' },
    { roomNumber: 'PR-301', type: 'Private Room', ward: 'B', bedCount: 1, chargePerDay: 2500, status: 'Available' },
    { roomNumber: 'DX-401', type: 'Deluxe Room', ward: 'C', bedCount: 1, chargePerDay: 4200, status: 'Available' }
  ]);

  const doctors = await Doctor.insertMany([
    {
      doctorId: 'DOC00001',
      name: 'Dr. Asha Mehta',
      specialization: 'Cardiologist',
      qualification: 'MD, DM Cardiology',
      experience: 12,
      mobile: '9876500001',
      email: 'asha@carepoint.local',
      department: departments[0]._id,
      consultationFee: 800,
      availability: 'Mon-Fri, 10:00 AM - 2:00 PM'
    },
    {
      doctorId: 'DOC00002',
      name: 'Dr. Rahul Sen',
      specialization: 'General Physician',
      qualification: 'MBBS, MD',
      experience: 9,
      mobile: '9876500002',
      email: 'rahul@carepoint.local',
      department: departments[7]._id,
      consultationFee: 500,
      availability: 'Mon-Sat, 9:00 AM - 4:00 PM'
    }
  ]);

  const patients = await Patient.insertMany([
    {
      patientId: 'PAT00001',
      name: 'Anita Sharma',
      fatherName: 'Ramesh Sharma',
      gender: 'Female',
      dob: new Date('1992-04-12'),
      age: 34,
      bloodGroup: 'B+',
      mobile: '9876511111',
      email: 'anita@example.com',
      address: 'Jaipur, Rajasthan',
      aadhaarNumber: '123412341234',
      emergencyContact: '9876511112',
      disease: 'Chest pain',
      department: departments[0]._id,
      assignedDoctor: doctors[0]._id,
      admissionDate: new Date(),
      status: 'Admitted'
    },
    {
      patientId: 'PAT00002',
      name: 'Vikram Patel',
      fatherName: 'Dinesh Patel',
      gender: 'Male',
      age: 41,
      bloodGroup: 'O+',
      mobile: '9876522222',
      email: 'vikram@example.com',
      address: 'Ahmedabad, Gujarat',
      disease: 'Fever',
      department: departments[7]._id,
      assignedDoctor: doctors[1]._id,
      status: 'OPD'
    }
  ]);

  const today = new Date();
  today.setHours(11, 0, 0, 0);
  const appointment = await Appointment.create({
    appointmentNo: 'APT00001',
    patient: patients[0]._id,
    doctor: doctors[0]._id,
    department: departments[0]._id,
    date: today,
    time: '11:00',
    status: 'Confirmed',
    notes: 'Follow-up with ECG'
  });

  await Admission.create({
    patient: patients[0]._id,
    room: rooms[0]._id,
    ward: 'Critical Care',
    bedNumber: '1',
    admissionDate: new Date(),
    expectedDischarge: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    doctor: doctors[0]._id
  });

  await Medicine.insertMany([
    { name: 'Paracetamol', company: 'HealthLabs', batchNumber: 'PCM-2401', quantity: 8, lowStockLimit: 10, purchasePrice: 1.5, sellingPrice: 30, unitName: 'Strip', perUnitPrice: 30, perPiecePrice: 3 },
    { name: 'Amoxicillin', company: 'MediCore', batchNumber: 'AMX-2404', quantity: 60, lowStockLimit: 15, purchasePrice: 5, sellingPrice: 90, unitName: 'Strip', perUnitPrice: 90, perPiecePrice: 9 }
  ]);

  const bill = await Bill.create({
    billNo: 'BIL00001',
    patient: patients[0]._id,
    appointment: appointment._id,
    registrationFee: 200,
    consultationFee: 800,
    roomCharges: 5000,
    medicineCharges: 350,
    testCharges: 1200,
    discount: 250,
    gst: 450,
    paidAmount: 3000
  });

  await Prescription.create({
    patient: patients[0]._id,
    doctor: doctors[0]._id,
    appointment: appointment._id,
    diagnosis: 'Mild angina under observation',
    notes: 'Monitor vitals twice daily',
    medicines: [{ name: 'Aspirin', dosage: '75mg', morning: true, days: 7, instructions: 'After breakfast' }]
  });

  await User.create([
    { name: 'Admin User', email: 'admin@carepoint.local', password: 'Admin@123', role: 'admin' },
    { name: doctors[0].name, email: 'doctor@carepoint.local', password: 'Doctor@123', role: 'doctor', doctor: doctors[0]._id },
    { name: 'Reception Desk', email: 'reception@carepoint.local', password: 'Reception@123', role: 'receptionist' },
    { name: 'Medicine Shop', email: 'pharmacy@carepoint.local', password: 'Pharmacy@123', role: 'pharmacist' },
    { name: patients[0].name, email: 'patient@carepoint.local', password: 'Patient@123', role: 'patient', patient: patients[0]._id }
  ]);

  console.log('Sample data created');
  console.table([
    { role: 'Admin', email: 'admin@carepoint.local', password: 'Admin@123' },
    { role: 'Doctor', email: 'doctor@carepoint.local', password: 'Doctor@123' },
    { role: 'Receptionist', email: 'reception@carepoint.local', password: 'Reception@123' },
    { role: 'Medicine Shop', email: 'pharmacy@carepoint.local', password: 'Pharmacy@123' },
    { role: 'Patient', email: 'patient@carepoint.local', password: 'Patient@123' }
  ]);
  console.log(`Invoice sample bill: ${bill.billNo}`);
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
