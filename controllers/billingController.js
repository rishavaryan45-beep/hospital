const PDFDocument = require('pdfkit');
const mongoose = require('mongoose');
const Bill = require('../models/Bill');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Admission = require('../models/Admission');
const MedicalReport = require('../models/MedicalReport');
const Prescription = require('../models/Prescription');

exports.invoice = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id).populate('patient appointment medicineItems.medicine').lean();
    if (!bill) {
      req.flash('error', 'Bill not found');
      return res.redirect('back');
    }
    res.render('print/hospital-bill', { title: `Invoice ${bill.billNo}`, bill });
  } catch (error) {
    next(error);
  }
};

exports.printAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate('patient doctor department').lean();
    if (!appointment) {
      req.flash('error', 'Appointment not found');
      return res.redirect('back');
    }
    res.render('print/appointment-slip', { title: `Appointment Slip ${appointment.appointmentNo}`, appointment });
  } catch (error) {
    next(error);
  }
};

exports.printReport = async (req, res, next) => {
  try {
    const report = await MedicalReport.findById(req.params.id).populate('patient doctor').lean();
    if (!report) {
      req.flash('error', 'Medical report not found');
      return res.redirect('back');
    }
    res.render('print/lab-report', { title: `Diagnostic Report ${report.title}`, report });
  } catch (error) {
    next(error);
  }
};

exports.printPrescription = async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.id).populate('patient doctor appointment').lean();
    if (!prescription) {
      req.flash('error', 'Prescription not found');
      return res.redirect('back');
    }
    res.render('print/prescription', { title: `Prescription RX${String(prescription._id).slice(-6)}`, prescription });
  } catch (error) {
    next(error);
  }
};

exports.printAdmission = async (req, res, next) => {
  try {
    const admission = await Admission.findById(req.params.id).populate('patient doctor room').lean();
    if (!admission) {
      req.flash('error', 'Admission record not found');
      return res.redirect('back');
    }
    res.render('print/discharge-summary', { title: `Discharge Summary IPD${String(admission._id).slice(-6)}`, admission });
  } catch (error) {
    next(error);
  }
};

exports.autoCharges = async (req, res, next) => {
  try {
    const { patientVal, appointmentVal } = req.query;
    const serviceItems = [];

    let patientId = null;
    let patientDoc = null;

    if (patientVal) {
      const query = mongoose.Types.ObjectId.isValid(patientVal)
        ? { _id: patientVal }
        : { patientId: patientVal };
      patientDoc = await Patient.findOne(query).lean();
      if (patientDoc) patientId = patientDoc._id;
    }

    let appointmentDoc = null;
    if (appointmentVal) {
      const query = mongoose.Types.ObjectId.isValid(appointmentVal)
        ? { _id: appointmentVal }
        : { appointmentNo: appointmentVal };
      appointmentDoc = await Appointment.findOne(query).populate('doctor').lean();
    }

    // 1. Appointment Booking Charge (Fixed 500)
    if (appointmentDoc) {
      serviceItems.push({
        category: 'Registration',
        description: `Appointment Booking Fee (${appointmentDoc.appointmentNo})`,
        quantity: 1,
        rate: 500,
        amount: 500
      });

      // 2. Doctor Consultation Charge
      if (appointmentDoc.doctor) {
        const rate = appointmentDoc.doctor.consultationFee || 0;
        serviceItems.push({
          category: 'Consultation',
          description: `Consultation Fee - ${appointmentDoc.doctor.name}`,
          quantity: 1,
          rate,
          amount: rate
        });
      }
    }

    // 3. Medical Report Charges (for this patient)
    if (patientId) {
      const reports = await MedicalReport.find({ patient: patientId }).lean();
      const REPORT_PRICES = {
        'X-Ray': 800,
        'MRI': 3500,
        'CT Scan': 2500,
        'Blood Test': 300,
        'ECG': 500,
        'Other Reports': 400
      };

      reports.forEach((report) => {
        const rate = REPORT_PRICES[report.reportType] || 400;
        serviceItems.push({
          category: 'Test',
          description: `Medical Report: ${report.reportType} - ${report.title}`,
          quantity: 1,
          rate,
          amount: rate
        });
      });

      // 4. Room Charges (Latest Admission)
      const admission = await Admission.findOne({ patient: patientId }).sort({ createdAt: -1 }).populate('room').lean();
      if (admission && admission.room) {
        const adDate = new Date(admission.admissionDate);
        const disDate = admission.dischargeDate ? new Date(admission.dischargeDate) : new Date();
        const diffTime = Math.abs(disDate - adDate);
        const days = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 1);
        const rate = admission.room.chargePerDay || 0;
        serviceItems.push({
          category: 'Room',
          description: `Room Charges - ${admission.room.roomNumber} (${days} days)`,
          quantity: days,
          rate,
          amount: days * rate
        });
      }
    }

    res.json({ serviceItems });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
