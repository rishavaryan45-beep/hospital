const User = require('../models/User');
const Patient = require('../models/Patient');

const portalPath = (role) => (role === 'pharmacist' ? '/pharmacy' : `/${role}`);

async function nextPatientId() {
  const latest = await Patient.findOne({ patientId: /^PAT\d+$/ }).sort({ patientId: -1 }).select('patientId').lean();
  const latestNumber = latest?.patientId ? Number(latest.patientId.replace('PAT', '')) : 0;
  return `PAT${String(latestNumber + 1).padStart(5, '0')}`;
}

exports.loginPage = (req, res) => {
  if (req.session.user) return res.redirect(portalPath(req.session.user.role));
  res.render('auth/login', { title: 'Login' });
};

exports.registerPage = (req, res) => {
  if (req.session.user) return res.redirect(portalPath(req.session.user.role));
  res.render('auth/register', { title: 'Patient Registration' });
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, active: true }).populate('doctor patient');
    if (!user || !(await user.comparePassword(password))) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/login');
    }
    req.session.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      doctor: user.doctor?._id?.toString(),
      patient: user.patient?._id?.toString()
    };
    req.flash('success', `Welcome back, ${user.name}`);
    res.redirect(portalPath(user.role));
  } catch (error) {
    next(error);
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
};

exports.register = async (req, res, next) => {
  try {
    const exists = await User.findOne({ email: req.body.email });
    if (exists) {
      req.flash('error', 'An account with this email already exists');
      return res.redirect('/register');
    }

    const patient = await Patient.create({
      patientId: await nextPatientId(),
      name: req.body.name,
      fatherName: req.body.fatherName,
      gender: req.body.gender,
      dob: req.body.dob || undefined,
      age: Number(req.body.age || 0),
      bloodGroup: req.body.bloodGroup,
      mobile: req.body.mobile,
      email: req.body.email,
      address: req.body.address,
      emergencyContact: req.body.emergencyContact,
      status: 'OPD'
    });

    await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      role: 'patient',
      patient: patient._id
    });

    req.flash('success', 'Patient account created. Please login.');
    res.redirect('/login');
  } catch (error) {
    next(error);
  }
};
