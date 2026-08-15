const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    doctorId: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    specialization: { type: String, required: true },
    qualification: String,
    experience: { type: Number, default: 0 },
    mobile: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    consultationFee: { type: Number, default: 0 },
    availability: { type: String, default: 'Mon-Sat, 10:00 AM - 4:00 PM' },
    scheduleDays: {
      type: [String],
      enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      validate: {
        validator(days) {
          return days.length <= 3;
        },
        message: 'Doctor can select only three schedule days'
      },
      default: []
    },
    profilePhoto: String
  },
  { timestamps: true }
);

module.exports = mongoose.model('Doctor', doctorSchema);
