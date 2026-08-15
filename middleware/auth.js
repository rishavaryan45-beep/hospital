function exposeLocals(req, res, next) {
  res.locals.currentUser = req.session.user || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.hospitalName = process.env.HOSPITAL_NAME || 'CarePoint Hospital';
  next();
}

function requireAuth(req, res, next) {
  if (req.session.user) return next();
  req.flash('error', 'Please login to continue');
  return res.redirect('/login');
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session.user) return res.redirect('/login');
    if (roles.includes(req.session.user.role)) return next();
    req.flash('error', 'You do not have permission to access that page');
    return res.redirect(`/${req.session.user.role}`);
  };
}

module.exports = { exposeLocals, requireAuth, requireRole };
