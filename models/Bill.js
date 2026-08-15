const mongoose = require('mongoose');

const billSchema = new mongoose.Schema(
  {
    billNo: { type: String, required: true, unique: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    serviceItems: [
      {
        category: {
          type: String,
          enum: ['Registration', 'Consultation', 'Room', 'Checkup', 'Test', 'Surgery', 'Other'],
          default: 'Other'
        },
        description: String,
        quantity: { type: Number, default: 1 },
        rate: { type: Number, default: 0 },
        amount: { type: Number, default: 0 }
      }
    ],
    medicineItems: [
      {
        medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
        name: String,
        unit: { type: String, enum: ['Tablet', 'Bottle', 'Packet', 'Strip', 'Injection', 'Other'], default: 'Tablet' },
        quantity: { type: Number, default: 1 },
        rate: { type: Number, default: 0 },
        amount: { type: Number, default: 0 }
      }
    ],
    registrationFee: { type: Number, default: 0 },
    consultationFee: { type: Number, default: 0 },
    roomCharges: { type: Number, default: 0 },
    medicineCharges: { type: Number, default: 0 },
    testCharges: { type: Number, default: 0 },
    surgeryCharges: { type: Number, default: 0 },
    otherCharges: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    gst: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['Paid', 'Due', 'Partial'], default: 'Due' }
  },
  { timestamps: true }
);

billSchema.pre('validate', function calculateBill(next) {
  this.serviceItems = (this.serviceItems || []).map((item) => {
    item.quantity = Number(item.quantity || 0);
    item.rate = Number(item.rate || 0);
    item.amount = Number(item.amount || item.quantity * item.rate || 0);
    return item;
  });
  this.medicineItems = (this.medicineItems || []).map((item) => {
    item.quantity = Number(item.quantity || 0);
    item.rate = Number(item.rate || 0);
    item.amount = Number(item.amount || item.quantity * item.rate || 0);
    return item;
  });
  if (this.serviceItems.length) {
    const sumByCategory = (category) => this.serviceItems
      .filter((item) => item.category === category)
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    this.registrationFee = sumByCategory('Registration');
    this.consultationFee = sumByCategory('Consultation');
    this.roomCharges = sumByCategory('Room');
    this.testCharges = sumByCategory('Test') + sumByCategory('Checkup');
    this.surgeryCharges = sumByCategory('Surgery');
    this.otherCharges = sumByCategory('Other');
  }
  if (this.medicineItems.length) {
    this.medicineCharges = this.medicineItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }
  const gross = this.registrationFee + this.consultationFee + this.roomCharges + this.medicineCharges + this.testCharges + this.surgeryCharges + this.otherCharges;
  const taxable = Math.max(gross - this.discount, 0);
  this.total = taxable + this.gst;
  this.dueAmount = Math.max(this.total - this.paidAmount, 0);
  this.status = this.dueAmount === 0 ? 'Paid' : this.paidAmount > 0 ? 'Partial' : 'Due';
  next();
});

module.exports = mongoose.model('Bill', billSchema);
