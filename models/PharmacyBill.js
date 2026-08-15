const mongoose = require('mongoose');

const pharmacyBillSchema = new mongoose.Schema(
  {
    billNo: { type: String, required: true, unique: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    customerName: String,
    customerMobile: String,
    items: [
      {
        medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
        name: String,
        unit: { type: String, enum: ['Tablet', 'Bottle', 'Packet', 'Strip', 'Injection', 'Other'], default: 'Tablet' },
        priceType: { type: String, enum: ['unit', 'piece'], default: 'unit' },
        quantity: { type: Number, default: 1 },
        rate: { type: Number, default: 0 },
        amount: { type: Number, default: 0 }
      }
    ],
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    gst: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['Paid', 'Due', 'Partial'], default: 'Due' }
  },
  { timestamps: true }
);

pharmacyBillSchema.pre('validate', function calculatePharmacyBill(next) {
  this.items = (this.items || []).map((item) => {
    item.quantity = Number(item.quantity || 0);
    item.rate = Number(item.rate || 0);
    item.amount = Number((item.quantity * item.rate).toFixed(2));
    return item;
  });
  this.subtotal = this.items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  this.gst = Number((this.subtotal * 0.18).toFixed(2));
  this.discount = Number(((this.subtotal + this.gst) * 0.10).toFixed(2));
  this.total = Math.max(this.subtotal + this.gst - this.discount, 0);
  this.dueAmount = Math.max(this.total - Number(this.paidAmount || 0), 0);
  this.status = this.dueAmount === 0 ? 'Paid' : this.paidAmount > 0 ? 'Partial' : 'Due';
  next();
});

module.exports = mongoose.model('PharmacyBill', pharmacyBillSchema);
