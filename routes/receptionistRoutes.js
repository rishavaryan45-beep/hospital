const express = require('express');
const dashboard = require('../controllers/dashboardController');
const crud = require('../controllers/crudController');
const meta = require('../controllers/meta');
const { requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(requireRole('receptionist'));
router.get('/', dashboard.receptionist);

['patients', 'appointments', 'admissions', 'bills', 'medicines'].forEach((resource) => {
  const field = meta[resource].uploadField || 'attachment';
  router.get(`/${resource}`, crud.list(resource, '/receptionist'));
  router.get(`/${resource}/new`, crud.form(resource, '/receptionist'));
  router.post(`/${resource}`, upload.single(field), crud.create(resource, '/receptionist'));
  router.get(`/${resource}/:id/edit`, crud.form(resource, '/receptionist'));
  router.put(`/${resource}/:id`, upload.single(field), crud.update(resource, '/receptionist'));
  router.delete(`/${resource}/:id`, crud.remove(resource, '/receptionist'));
});

router.get('/search', crud.list('patients', '/receptionist'));

module.exports = router;
