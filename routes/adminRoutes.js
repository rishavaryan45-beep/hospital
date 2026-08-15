const express = require('express');
const dashboard = require('../controllers/dashboardController');
const crud = require('../controllers/crudController');
const meta = require('../controllers/meta');
const { requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();
const resources = Object.keys(meta);

router.use(requireRole('admin'));
router.get('/', dashboard.admin);

for (const resource of resources) {
  const field = meta[resource].uploadField || 'attachment';
  router.get(`/${resource}`, crud.list(resource, '/admin'));
  router.get(`/${resource}/new`, crud.form(resource, '/admin'));
  router.post(`/${resource}`, upload.single(field), crud.create(resource, '/admin'));
  router.get(`/${resource}/:id/edit`, crud.form(resource, '/admin'));
  router.put(`/${resource}/:id`, upload.single(field), crud.update(resource, '/admin'));
  router.delete(`/${resource}/:id`, crud.remove(resource, '/admin'));
}

router.get('/settings', (req, res) => res.render('admin/settings', { title: 'Settings' }));
router.get('/reports-summary', dashboard.admin);

module.exports = router;
