const express = require('express');
const dashboard = require('../controllers/dashboardController');
const patient = require('../controllers/patientController');
const { requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(requireRole('patient'));
router.get('/', dashboard.patient);
router.get('/profile', patient.profile);
router.get('/profile/edit', patient.profileForm);
router.post('/profile', upload.single('photo'), patient.updateProfile);
router.get('/appointments', patient.appointments);
router.get('/appointments/new', patient.appointmentForm);
router.post('/appointments', patient.bookAppointment);
router.get('/prescriptions', patient.prescriptions);
router.get('/reports', patient.reports);
router.get('/bills', patient.bills);

module.exports = router;
