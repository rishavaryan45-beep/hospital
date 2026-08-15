const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Admission = require('../models/Admission');
const Room = require('../models/Room');
const Medicine = require('../models/Medicine');
const Bill = require('../models/Bill');
const Prescription = require('../models/Prescription');
const MedicalReport = require('../models/MedicalReport');

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 1);
  return { start, end };
}

exports.admin = async (req, res, next) => {
  try {
    const { start, end } = todayRange();
    const [doctors, patients, todaysAppointments, admitted, availableRooms, revenue, lowStock, pendingBills] = await Promise.all([
      Doctor.countDocuments(),
      Patient.countDocuments(),
      Appointment.countDocuments({ date: { $gte: start, $lt: end } }),
      Patient.countDocuments({ status: 'Admitted' }),
      Room.countDocuments({ status: 'Available' }),
      Bill.aggregate([{ $group: { _id: null, total: { $sum: '$paidAmount' } } }]),
      Medicine.find({ $expr: { $lte: ['$quantity', '$lowStockLimit'] } }).lean(),
      Bill.find({ status: { $ne: 'Paid' } }).populate('patient').limit(5).lean()
    ]);
    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      cards: { doctors, patients, todaysAppointments, admitted, availableRooms, revenue: revenue[0]?.total || 0 },
      lowStock,
      pendingBills
    });
  } catch (error) {
    next(error);
  }
};

exports.doctor = async (req, res, next) => {
  try {
    const { start, end } = todayRange();
    const query = req.session.user.doctor ? { doctor: req.session.user.doctor } : {};
    const [doctor, appointments, prescriptions] = await Promise.all([
      req.session.user.doctor ? Doctor.findById(req.session.user.doctor).populate('department').lean() : null,
      Appointment.find({ ...query, date: { $gte: start, $lt: end } }).populate('patient department').sort('time').lean(),
      Prescription.find(query).populate('patient').sort({ createdAt: -1 }).limit(8).lean()
    ]);
    res.render('doctor/dashboard', { title: 'Doctor Dashboard', doctor, appointments, prescriptions });
  } catch (error) {
    next(error);
  }
};

exports.receptionist = async (req, res, next) => {
  try {
    const { start, end } = todayRange();
    const [patients, appointments, rooms, bills] = await Promise.all([
      Patient.find().sort({ createdAt: -1 }).limit(6).lean(),
      Appointment.find({ date: { $gte: start, $lt: end } }).populate('patient doctor').sort('time').lean(),
      Room.find().lean(),
      Bill.find({ status: { $ne: 'Paid' } }).populate('patient').limit(6).lean()
    ]);
    res.render('receptionist/dashboard', { title: 'Receptionist Dashboard', patients, appointments, rooms, bills });
  } catch (error) {
    next(error);
  }
};

exports.patient = async (req, res, next) => {
  try {
    const patientId = req.session.user.patient;
    const [patient, appointments, prescriptions, reports, bills] = await Promise.all([
      Patient.findById(patientId).populate('department assignedDoctor').lean(),
      Appointment.find({ patient: patientId }).populate('doctor department').sort({ date: -1 }).lean(),
      Prescription.find({ patient: patientId }).populate('doctor').sort({ createdAt: -1 }).lean(),
      MedicalReport.find({ patient: patientId }).populate('doctor').sort({ createdAt: -1 }).lean(),
      Bill.find({ patient: patientId }).sort({ createdAt: -1 }).lean()
    ]);
    res.render('patient/dashboard', { title: 'Patient Dashboard', patient, appointments, prescriptions, reports, bills });
  } catch (error) {
    next(error);
  }
};
