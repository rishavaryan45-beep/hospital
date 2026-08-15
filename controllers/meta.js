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
const User = require('../models/User');

const ref = (model, label, value = '_id', detail = null) => ({ model, label, value, detail });

module.exports = {
  departments: {
    title: 'Departments',
    singular: 'Department',
    model: Department,
    populate: [],
    listFields: ['name', 'description', 'status'],
    fields: [
      { name: 'name', label: 'Department Name', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
    ]
  },
  receptionists: {
    title: 'Receptionists',
    singular: 'Receptionist',
    model: User,
    populate: [],
    fixed: { role: 'receptionist' },
    listFields: ['name', 'email', 'active'],
    fields: [
      { name: 'name', label: 'Name', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'password', label: 'Password', type: 'password', required: true },
      { name: 'active', label: 'Active', type: 'select', options: ['true', 'false'] }
    ]
  },
  pharmacists: {
    title: 'Medicine Shop Staff',
    singular: 'Pharmacist',
    model: User,
    populate: [],
    fixed: { role: 'pharmacist' },
    listFields: ['name', 'email', 'active'],
    fields: [
      { name: 'name', label: 'Name', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'password', label: 'Password', type: 'password', required: true },
      { name: 'active', label: 'Active', type: 'select', options: ['true', 'false'] }
    ]
  },
  doctors: {
    title: 'Doctors',
    singular: 'Doctor',
    model: Doctor,
    populate: ['department'],
    listFields: ['profilePhoto', 'doctorId', 'name', 'specialization', 'mobile', 'email', 'department.name', 'consultationFee'],
    uploadField: 'profilePhoto',
    fields: [
      { name: 'doctorId', label: 'Doctor ID', required: true, auto: 'DOC' },
      { name: 'name', label: 'Name', required: true },
      { name: 'specialization', label: 'Specialization', required: true },
      { name: 'qualification', label: 'Qualification' },
      { name: 'experience', label: 'Experience', type: 'number' },
      { name: 'mobile', label: 'Mobile', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'password', label: 'Login Password', type: 'password', required: true },
      { name: 'department', label: 'Department', type: 'ref', required: true, ref: ref(Department, 'name') },
      { name: 'consultationFee', label: 'Consultation Fee', type: 'number' },
      { name: 'availability', label: 'Availability' },
      { name: 'scheduleDays', label: 'Schedule Days', type: 'checkbox-group', max: 3, options: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] },
      { name: 'profilePhoto', label: 'Profile Photo', type: 'file' }
    ]
  },
  patients: {
    title: 'Patients',
    singular: 'Patient',
    model: Patient,
    populate: ['department', 'assignedDoctor'],
    listFields: ['patientId', 'name', 'gender', 'age', 'mobile', 'department.name', 'assignedDoctor.name', 'status'],
    uploadField: 'photo',
    fields: [
      { name: 'patientId', label: 'Patient ID', required: true, auto: 'PAT' },
      { name: 'name', label: 'Name', required: true },
      { name: 'fatherName', label: 'Father Name' },
      { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'], required: true },
      { name: 'dob', label: 'DOB', type: 'date' },
      { name: 'age', label: 'Age', type: 'number' },
      { name: 'bloodGroup', label: 'Blood Group' },
      { name: 'mobile', label: 'Mobile', required: true },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'address', label: 'Address', type: 'textarea' },
      { name: 'aadhaarNumber', label: 'Aadhaar Number' },
      { name: 'emergencyContact', label: 'Emergency Contact' },
      { name: 'disease', label: 'Disease' },
      { name: 'department', label: 'Department', type: 'ref', ref: ref(Department, 'name') },
      { name: 'assignedDoctor', label: 'Assigned Doctor ID', type: 'ref', ref: ref(Doctor, 'doctorId', '_id', 'name') },
      { name: 'admissionDate', label: 'Admission Date', type: 'date' },
      { name: 'dischargeDate', label: 'Discharge Date', type: 'date' },
      { name: 'status', label: 'Status', type: 'select', options: ['OPD', 'Admitted', 'Discharged'] },
      { name: 'photo', label: 'Photo', type: 'file' }
    ]
  },
  appointments: {
    title: 'Appointments',
    singular: 'Appointment',
    model: Appointment,
    populate: ['patient', 'doctor', 'department'],
    listFields: ['appointmentNo', 'patient.name', 'doctor.name', 'department.name', 'date', 'time', 'status'],
    fields: [
      { name: 'appointmentNo', label: 'Appointment Number', required: true, auto: 'APT' },
      { name: 'patient', label: 'Patient ID', type: 'ref', required: true, ref: ref(Patient, 'patientId', '_id', 'name') },
      { name: 'doctor', label: 'Doctor ID', type: 'ref', required: true, ref: ref(Doctor, 'doctorId', '_id', 'name') },
      { name: 'department', label: 'Department', type: 'ref', required: true, ref: ref(Department, 'name') },
      { name: 'date', label: 'Date', type: 'date', required: true },
      { name: 'time', label: 'Time', type: 'time', required: true },
      { name: 'status', label: 'Status', type: 'select', options: ['Pending', 'Confirmed', 'Completed', 'Cancelled'] },
      { name: 'notes', label: 'Notes', type: 'textarea' }
    ]
  },
  admissions: {
    title: 'Admissions',
    singular: 'Admission',
    model: Admission,
    populate: ['patient', 'room', 'doctor'],
    listFields: ['patient.name', 'room.roomNumber', 'ward', 'bedNumber', 'admissionDate', 'expectedDischarge', 'status'],
    fields: [
      { name: 'patient', label: 'Patient ID', type: 'ref', required: true, ref: ref(Patient, 'patientId', '_id', 'name') },
      { name: 'room', label: 'Room', type: 'ref', required: true, ref: ref(Room, 'roomNumber') },
      { name: 'ward', label: 'Ward' },
      { name: 'bedNumber', label: 'Bed Number', required: true },
      { name: 'admissionDate', label: 'Admission Date', type: 'date' },
      { name: 'expectedDischarge', label: 'Expected Discharge', type: 'date' },
      { name: 'dischargeDate', label: 'Discharge Date', type: 'date' },
      { name: 'doctor', label: 'Doctor ID', type: 'ref', required: true, ref: ref(Doctor, 'doctorId', '_id', 'name') },
      { name: 'status', label: 'Status', type: 'select', options: ['Admitted', 'Discharged'] }
    ]
  },
  rooms: {
    title: 'Rooms',
    singular: 'Room',
    model: Room,
    populate: [],
    listFields: ['roomNumber', 'type', 'ward', 'bedCount', 'chargePerDay', 'status'],
    fields: [
      { name: 'roomNumber', label: 'Room Number', required: true },
      { name: 'type', label: 'Type', type: 'select', options: ['ICU', 'General Ward', 'Private Room', 'Deluxe Room'], required: true },
      { name: 'ward', label: 'Ward' },
      { name: 'bedCount', label: 'Bed Count', type: 'number' },
      { name: 'chargePerDay', label: 'Charge Per Day', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: ['Available', 'Occupied', 'Maintenance'] }
    ]
  },
  medicines: {
    title: 'Medicines',
    singular: 'Medicine',
    model: Medicine,
    populate: [],
    listFields: ['name', 'company', 'batchNumber', 'expiryDate', 'quantity', 'unitName', 'perUnitPrice', 'perPiecePrice'],
    fields: [
      { name: 'name', label: 'Medicine Name', required: true },
      { name: 'company', label: 'Company' },
      { name: 'batchNumber', label: 'Batch Number', required: true },
      { name: 'manufacturingDate', label: 'Manufacturing Date', type: 'date' },
      { name: 'expiryDate', label: 'Expiry Date', type: 'date' },
      { name: 'quantity', label: 'Quantity', type: 'number' },
      { name: 'lowStockLimit', label: 'Low Stock Limit', type: 'number' },
      { name: 'purchasePrice', label: 'Purchase Price', type: 'number' },
      { name: 'sellingPrice', label: 'Selling Price', type: 'number' },
      { name: 'unitName', label: 'Unit Name', type: 'select', options: ['Tablet', 'Bottle', 'Packet', 'Strip', 'Injection', 'Other'] },
      { name: 'perUnitPrice', label: 'Per Unit Price', type: 'number' },
      { name: 'perPiecePrice', label: 'Per Piece Price', type: 'number' }
    ]
  },
  bills: {
    title: 'Bills',
    singular: 'Bill',
    model: Bill,
    populate: ['patient', 'appointment'],
    listFields: ['billNo', 'patient.name', 'consultationFee', 'roomCharges', 'medicineCharges', 'testCharges', 'surgeryCharges', 'total', 'dueAmount', 'status'],
    fields: [
      { name: 'billNo', label: 'Bill Number', required: true, auto: 'BIL' },
      { name: 'patient', label: 'Patient ID', type: 'ref', required: true, ref: ref(Patient, 'patientId', '_id', 'name') },
      { name: 'appointment', label: 'Appointment', type: 'ref', ref: ref(Appointment, 'appointmentNo') },
      { name: 'registrationFee', label: 'Registration Fee', type: 'number' },
      { name: 'consultationFee', label: 'Consultation Fee', type: 'number' },
      { name: 'roomCharges', label: 'Room Charges', type: 'number' },
      { name: 'medicineCharges', label: 'Medicine Charges', type: 'number' },
      { name: 'testCharges', label: 'Test Charges', type: 'number' },
      { name: 'surgeryCharges', label: 'Surgery Charges', type: 'number' },
      { name: 'otherCharges', label: 'Other Charges', type: 'number' },
      { name: 'discount', label: 'Discount', type: 'number' },
      { name: 'gst', label: 'GST', type: 'number' },
      { name: 'paidAmount', label: 'Paid Amount', type: 'number' }
    ]
  },
  prescriptions: {
    title: 'Prescriptions',
    singular: 'Prescription',
    model: Prescription,
    populate: ['patient', 'doctor', 'appointment'],
    listFields: ['appointment.appointmentNo', 'patient.name', 'doctor.name', 'diagnosis', 'createdAt'],
    fields: [
      { name: 'appointment', label: 'Appointment ID', type: 'ref', required: true, ref: ref(Appointment, 'appointmentNo') },
      { name: 'diagnosis', label: 'Diagnosis', type: 'textarea' },
      { name: 'notes', label: 'Medical Notes', type: 'textarea' },
      { name: 'medicines', label: 'Medicines', virtual: true }
    ]
  },
  reports: {
    title: 'Medical Reports',
    singular: 'Medical Report',
    model: MedicalReport,
    populate: ['patient', 'doctor'],
    listFields: ['title', 'reportType', 'patient.name', 'doctor.name', 'createdAt'],
    uploadField: 'filePath',
    fields: [
      { name: 'patient', label: 'Patient ID', type: 'ref', required: true, ref: ref(Patient, 'patientId', '_id', 'name') },
      { name: 'doctor', label: 'Doctor ID', type: 'ref', ref: ref(Doctor, 'doctorId', '_id', 'name') },
      { name: 'reportType', label: 'Report Type', type: 'select', options: ['X-Ray', 'MRI', 'CT Scan', 'Blood Test', 'ECG', 'Other Reports'], required: true },
      { name: 'title', label: 'Title', required: true },
      { name: 'filePath', label: 'Report File', type: 'file', required: true },
      { name: 'notes', label: 'Notes', type: 'textarea' }
    ]
  }
};
