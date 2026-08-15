const express = require('express');
const dashboard = require('../controllers/dashboardController');
const doctor = require('../controllers/doctorController');
const crud = require('../controllers/crudController');
const meta = require('../controllers/meta');
const { requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(requireRole('doctor'));
router.get('/', dashboard.doctor);

['patients', 'appointments', 'prescriptions', 'reports'].forEach((resource) => {
  const field = meta[resource].uploadField || 'attachment';
  router.get(`/${resource}`, crud.list(resource, '/doctor'));
  router.get(`/${resource}/new`, crud.form(resource, '/doctor'));
  router.post(`/${resource}`, upload.single(field), crud.create(resource, '/doctor'));
  router.get(`/${resource}/:id/edit`, crud.form(resource, '/doctor'));
  router.put(`/${resource}/:id`, upload.single(field), crud.update(resource, '/doctor'));
});

router.get('/schedule', doctor.scheduleForm);
router.post('/schedule', doctor.updateSchedule);

module.exports = router;
