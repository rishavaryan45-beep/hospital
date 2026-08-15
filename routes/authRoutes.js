const express = require('express');
const auth = require('../controllers/authController');

const router = express.Router();

const portalPath = (role) => (role === 'pharmacist' ? '/pharmacy' : `/${role}`);

router.get('/', (req, res) => res.redirect(req.session.user ? portalPath(req.session.user.role) : '/login'));
router.get('/login', auth.loginPage);
router.post('/login', auth.login);
router.get('/register', auth.registerPage);
router.post('/register', auth.register);
router.post('/logout', auth.logout);

module.exports = router;
