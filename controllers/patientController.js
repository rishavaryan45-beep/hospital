const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const MedicalReport = require('../models/MedicalReport');
const Bill = require('../models/Bill');
const Doctor = require('../models/Doctor');
const Department = require('../models/Department');

async function nextAppointmentNo() {
  const latest = await Appointment.findOne({ appointmentNo: /^APT\d+$/ }).sort({ appointmentNo: -1 }).select('appointmentNo').lean();
  const latestNumber = latest?.appointmentNo ? Number(latest.appointmentNo.replace('APT', '')) : 0;
  return `APT${String(latestNumber + 1).padStart(5, '0')}`;
}

exports.profile = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.session.user.patient).populate('department assignedDoctor').lean();
    res.render('patient/profile', { title: 'My Profile', patient });
  } catch (error) {
    next(error);
  }
};

exports.appointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({ patient: req.session.user.patient }).populate('doctor department').sort({ date: -1 }).lean();
    res.render('patient/appointments', { title: 'My Appointments', appointments });
  } catch (error) {
    next(error);
  }
};

exports.appointmentForm = async (req, res, next) => {
  try {
    const departments = await Department.find({ status: 'Active' }).sort('name').lean();
    res.render('patient/book-appointment', { title: 'Book Appointment', departments });
  } catch (error) {
    next(error);
  }
};

exports.bookAppointment = async (req, res, next) => {
  try {
    const department = await Department.findById(req.body.department).lean();
    if (!department) {
      req.flash('error', 'Please select a valid department');
      return res.redirect('/patient/appointments/new');
    }

    const appointmentDate = new Date(req.body.date);
    if (Number.isNaN(appointmentDate.getTime())) {
      req.flash('error', 'Please select a valid appointment date');
      return res.redirect('/patient/appointments/new');
    }

    const dayName = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' });
    const doctors = await Doctor.find({ department: department._id, scheduleDays: dayName }).sort('name').lean();
    if (!doctors.length) {
      req.flash('error', `No doctor is scheduled in ${department.name} on ${dayName}`);
      return res.redirect('/patient/appointments/new');
    }

    const start = new Date(appointmentDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);

    let assignedDoctor = null;
    for (const doctor of doctors) {
      const count = await Appointment.countDocuments({ doctor: doctor._id, date: { $gte: start, $lt: end } });
      if (count < 10) {
        assignedDoctor = doctor;
        break;
      }
    }

    if (!assignedDoctor) {
      req.flash('error', `All ${department.name} doctors are fully booked on ${appointmentDate.toLocaleDateString()}`);
      return res.redirect('/patient/appointments/new');
    }

    await Appointment.create({
      appointmentNo: await nextAppointmentNo(),
      patient: req.session.user.patient,
      doctor: assignedDoctor._id,
      department: department._id,
      date: appointmentDate,
      time: req.body.time,
      status: 'Pending',
      notes: req.body.notes
    });

    req.flash('success', 'Appointment booked successfully');
    res.redirect('/patient/appointments');
  } catch (error) {
    next(error);
  }
};

exports.prescriptions = async (req, res, next) => {
  try {
    const prescriptions = await Prescription.find({ patient: req.session.user.patient }).populate('doctor appointment').sort({ createdAt: -1 }).lean();
    res.render('patient/prescriptions', { title: 'My Prescriptions', prescriptions });
  } catch (error) {
    next(error);
  }
};

exports.reports = async (req, res, next) => {
  try {
    const reports = await MedicalReport.find({ patient: req.session.user.patient }).populate('doctor').sort({ createdAt: -1 }).lean();
    res.render('patient/reports', { title: 'My Medical Reports', reports });
  } catch (error) {
    next(error);
  }
};

exports.bills = async (req, res, next) => {
  try {
    const bills = await Bill.find({ patient: req.session.user.patient }).sort({ createdAt: -1 }).lean();
    res.render('patient/bills', { title: 'My Bills', bills });
  } catch (error) {
    next(error);
  }
};

exports.profileForm = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.session.user.patient).lean();
    res.render('patient/profile-form', { title: 'Update Profile', patient });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = ['name', 'fatherName', 'dob', 'age', 'bloodGroup', 'mobile', 'email', 'address', 'aadhaarNumber', 'emergencyContact'];
    const data = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) data[field] = req.body[field];
    });
    if (req.file) data.photo = `/${req.file.path.replace(/\\/g, '/')}`;
    await Patient.findByIdAndUpdate(req.session.user.patient, data, { runValidators: true });
    req.flash('success', 'Profile updated successfully');
    res.redirect('/patient');
  } catch (error) {
    next(error);
  }
};
