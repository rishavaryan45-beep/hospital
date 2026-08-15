function requireFields(fields) {
  return (req, res, next) => {
    const missing = fields.filter((field) => !String(req.body[field] || '').trim());
    if (missing.length) {
      req.flash('error', `Missing required fields: ${missing.join(', ')}`);
      return res.redirect('back');
    }
    next();
  };
}

module.exports = { requireFields };
