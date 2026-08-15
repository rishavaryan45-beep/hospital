const express = require('express');
const pharmacy = require('../controllers/pharmacyController');
const crud = require('../controllers/crudController');
const meta = require('../controllers/meta');
const { requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(requireRole('admin', 'receptionist', 'pharmacist'));
router.get('/', pharmacy.counter);
router.post('/bills', pharmacy.createBill);
router.get('/:id/invoice', pharmacy.invoice);

const field = meta.medicines.uploadField || 'attachment';
router.get('/medicines', crud.list('medicines', '/pharmacy'));
router.get('/medicines/list', crud.list('medicines', '/pharmacy'));
router.get('/medicines/new', crud.form('medicines', '/pharmacy'));
router.post('/medicines', upload.single(field), crud.create('medicines', '/pharmacy'));
router.get('/medicines/:id/edit', crud.form('medicines', '/pharmacy'));
router.put('/medicines/:id', upload.single(field), crud.update('medicines', '/pharmacy'));
router.delete('/medicines/:id', crud.remove('medicines', '/pharmacy'));

module.exports = router;
