const PDFDocument = require('pdfkit');
const Medicine = require('../models/Medicine');
const Patient = require('../models/Patient');
const PharmacyBill = require('../models/PharmacyBill');
const Prescription = require('../models/Prescription');

async function nextBillNo() {
  const latest = await PharmacyBill.findOne({ billNo: /^PHR\d+$/ }).sort({ billNo: -1 }).select('billNo').lean();
  const latestNumber = latest?.billNo ? Number(latest.billNo.replace('PHR', '')) : 0;
  return `PHR${String(latestNumber + 1).padStart(5, '0')}`;
}

function normalizeItems(items) {
  const rows = Array.isArray(items) ? items : Object.values(items || {});
  return rows
    .map((item) => {
      const quantity = Number(item.quantity || 0);
      const rate = Number(item.rate || 0);
      return {
        medicine: item.medicine || undefined,
        name: item.name,
        unit: item.unit || 'Packet',
        priceType: item.priceType || 'unit',
        quantity,
        rate,
        amount: Number((quantity * rate).toFixed(2))
      };
    })
    .filter((item) => (item.medicine || item.name) && item.quantity > 0);
}

async function reduceStock(items) {
  for (const item of items) {
    if (!item.medicine) continue;
    const medicine = await Medicine.findById(item.medicine);
    if (!medicine) throw new Error(`${item.name || 'Medicine'} not found`);
    if (medicine.quantity < item.quantity) throw new Error(`${medicine.name} has only ${medicine.quantity} in stock`);
    medicine.quantity -= item.quantity;
    await medicine.save();
  }
}

exports.counter = async (req, res, next) => {
  try {
    const [medicines, patients, recentBills, prescriptions] = await Promise.all([
      Medicine.find().sort('name').lean(),
      Patient.find().sort('name').lean(),
      PharmacyBill.find().populate('patient').sort({ createdAt: -1 }).limit(8).lean(),
      Prescription.find().sort({ createdAt: -1 }).lean()
    ]);
    res.render('pharmacy/counter', { title: 'Medicine Shop', medicines, patients, recentBills, prescriptions });
  } catch (error) {
    next(error);
  }
};

exports.createBill = async (req, res, next) => {
  try {
    const items = normalizeItems(req.body.items);
    if (!items.length) {
      req.flash('error', 'Add at least one medicine to the bill');
      return res.redirect('/pharmacy');
    }
    await reduceStock(items);
    const bill = await PharmacyBill.create({
      billNo: await nextBillNo(),
      patient: req.body.patient || undefined,
      customerName: req.body.customerName,
      customerMobile: req.body.customerMobile,
      items,
      paidAmount: Number(req.body.paidAmount || 0)
    });
    req.flash('success', `Medicine bill ${bill.billNo} generated`);
    res.redirect(`/pharmacy/${bill._id}/invoice`);
  } catch (error) {
    req.flash('error', error.message || 'Error generating bill');
    res.redirect('/pharmacy');
  }
};

exports.invoice = async (req, res, next) => {
  try {
    const bill = await PharmacyBill.findById(req.params.id).populate('patient').lean();
    if (!bill) {
      req.flash('error', 'Medicine bill not found');
      return res.redirect('/pharmacy');
    }
    res.render('print/pharmacy-bill', { title: `Pharmacy Bill ${bill.billNo}`, bill });
  } catch (error) {
    next(error);
  }
};
