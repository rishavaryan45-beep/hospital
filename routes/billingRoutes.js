const express = require('express');
const billing = require('../controllers/billingController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);
router.get('/auto-charges', billing.autoCharges);
router.get('/appointments/:id/print', billing.printAppointment);
router.get('/reports/:id/print', billing.printReport);
router.get('/prescriptions/:id/print', billing.printPrescription);
router.get('/admissions/:id/print', billing.printAdmission);
router.get('/:id/invoice', billing.invoice);

module.exports = router;
