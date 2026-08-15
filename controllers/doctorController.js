const Doctor = require('../models/Doctor');

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

exports.scheduleForm = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.session.user.doctor).lean();
    res.render('doctor/schedule', { title: 'My Schedule', doctor, days: DAYS });
  } catch (error) {
    next(error);
  }
};

exports.updateSchedule = async (req, res, next) => {
  try {
    const scheduleDays = req.body.scheduleDays ? [].concat(req.body.scheduleDays) : [];
    if (scheduleDays.length !== 3) {
      req.flash('error', 'Please choose exactly three schedule days');
      return res.redirect('/doctor/schedule');
    }

    await Doctor.findByIdAndUpdate(
      req.session.user.doctor,
      { scheduleDays, availability: req.body.availability },
      { runValidators: true }
    );
    req.flash('success', 'Schedule updated successfully');
    res.redirect('/doctor/schedule');
  } catch (error) {
    next(error);
  }
};
