const meta = require('./meta');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Medicine = require('../models/Medicine');
const Patient = require('../models/Patient');

function getNested(obj, path) {
  return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

function formatValue(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return value == null ? '' : value;
}

async function nextCode(Model, prefix, field) {
  const latest = await Model.findOne({ [field]: new RegExp(`^${prefix}\\d+$`) }).sort({ [field]: -1 }).select(field).lean();
  const latestNumber = latest?.[field] ? Number(String(latest[field]).replace(prefix, '')) : 0;
  return `${prefix}${String(latestNumber + 1).padStart(5, '0')}`;
}

async function loadOptions(resource) {
  const config = meta[resource];
  const options = {};
  for (const field of config.fields.filter((item) => item.type === 'ref')) {
    options[field.name] = await field.ref.model.find().sort(field.ref.label).lean();
  }
  if (resource === 'prescriptions' || resource === 'bills') {
    options.stockMedicines = await Medicine.find({ quantity: { $gt: 0 } }).sort('name').lean();
  }
  return options;
}

function arrayFromBody(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : Object.values(value);
}

function normalizeMedicineItems(items) {
  return arrayFromBody(items)
    .map((item) => {
      const quantity = Number(item.quantity || 0);
      const rate = Number(item.rate || item.sellingPrice || 0);
      return {
        medicine: item.medicine || undefined,
        name: item.name,
        unit: item.unit || 'Tablet',
        quantity,
        rate,
        amount: Number(item.amount || quantity * rate || 0)
      };
    })
    .filter((item) => item.name && item.quantity > 0);
}

function normalizeServiceItems(items) {
  return arrayFromBody(items)
    .map((item) => {
      const quantity = Number(item.quantity || 0);
      const rate = Number(item.rate || 0);
      return {
        category: item.category || 'Other',
        description: item.description,
        quantity,
        rate,
        amount: Number(item.amount || quantity * rate || 0)
      };
    })
    .filter((item) => item.description && item.quantity > 0);
}

async function applyMedicineStockChange(previousItems = [], nextItems = []) {
  const stockChanges = medicineStockChanges(previousItems, nextItems);
  await assertMedicineStock(stockChanges);
  for (const [medicineId, delta] of stockChanges.entries()) {
    if (delta) await Medicine.findByIdAndUpdate(medicineId, { $inc: { quantity: delta } });
  }
}

function medicineStockChanges(previousItems = [], nextItems = []) {
  const stockChanges = new Map();
  previousItems.forEach((item) => {
    if (!item.medicine) return;
    const key = String(item.medicine);
    stockChanges.set(key, (stockChanges.get(key) || 0) + Number(item.quantity || 0));
  });
  nextItems.forEach((item) => {
    if (!item.medicine) return;
    const key = String(item.medicine);
    stockChanges.set(key, (stockChanges.get(key) || 0) - Number(item.quantity || 0));
  });
  return stockChanges;
}

async function assertMedicineStock(stockChanges) {
  for (const [medicineId, delta] of stockChanges.entries()) {
    if (!delta) continue;
    if (delta < 0) {
      const medicine = await Medicine.findById(medicineId).select('name quantity').lean();
      if (!medicine) throw new Error('Medicine not found in stock');
      if (medicine.quantity < Math.abs(delta)) throw new Error(`${medicine.name} has only ${medicine.quantity} in stock`);
    }
  }
}

function normalizeBody(resource, body, file) {
  const config = meta[resource];
  const data = { ...(config.fixed || {}) };
  for (const field of config.fields) {
    if (field.virtual || field.type === 'file') continue;
    if (field.auto) continue;
    if (['receptionists', 'pharmacists'].includes(resource) && field.name === 'password' && !body.password) continue;
    if (resource === 'doctors' && field.name === 'password') continue;
    if (field.type === 'checkbox-group') {
      const values = body[field.name] ? [].concat(body[field.name]) : [];
      data[field.name] = field.max ? values.slice(0, field.max) : values;
    } else
    if (field.name === 'active') data[field.name] = body[field.name] === 'true';
    else
    if (field.type === 'number') data[field.name] = Number(body[field.name] || 0);
    else if (field.type === 'date') data[field.name] = body[field.name] || undefined;
    else data[field.name] = body[field.name] || undefined;
  }

  if (file && config.uploadField) data[config.uploadField] = `/${file.path.replace(/\\/g, '/')}`;

  if (resource === 'prescriptions') {
    data.medicines = arrayFromBody(body.medicines)
      .map((medicine) => ({
        medicine: medicine.medicine || undefined,
        name: medicine.name,
        dosage: medicine.dosage,
        quantity: Number(medicine.quantity || 1),
        unit: medicine.unit || 'Tablet',
        morning: Boolean(medicine.morning),
        afternoon: Boolean(medicine.afternoon),
        night: Boolean(medicine.night),
        days: Number(medicine.days || 0),
        instructions: medicine.instructions
      }))
      .filter((medicine) => medicine.name);
  }
  if (resource === 'bills') {
    data.serviceItems = normalizeServiceItems(body.serviceItems);
    data.medicineItems = normalizeMedicineItems(body.medicineItems);
  }
  if (resource === 'medicines') {
    data.perUnitPrice = Number(data.perUnitPrice || data.sellingPrice || 0);
    data.perPiecePrice = Number(data.perPiecePrice || 0);
    data.sellingPrice = Number(data.sellingPrice || data.perUnitPrice || 0);
  }

  return data;
}

async function resolveRefIds(config, data) {
  for (const field of config.fields.filter((item) => item.type === 'ref')) {
    const val = String(data[field.name] || '').trim();
    if (val) {
      if (mongoose.Types.ObjectId.isValid(val)) continue;
      const doc = await field.ref.model.findOne({ [field.ref.label]: val }).select('_id').lean();
      if (doc) {
        data[field.name] = doc._id;
      } else {
        throw new Error(`Invalid ${field.label}: "${val}" not found`);
      }
    }
  }
}

exports.list = (resource, basePath = '/admin') => async (req, res, next) => {
  try {
    const config = meta[resource];
    const search = String(req.query.q || '').trim();
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = 10;
    const query = { ...(config.fixed || {}) };

    if (search) {
      const searchable = ['name', 'email', 'mobile', 'patientId', 'doctorId', 'appointmentNo', 'billNo', 'roomNumber', 'batchNumber', 'title'];
      const orQuery = searchable
        .filter((field) => config.model.schema.paths[field])
        .map((field) => ({ [field]: new RegExp(search, 'i') }));

      const [matchingPatients, matchingAppointments] = await Promise.all([
        Patient.find({
          $or: [
            { patientId: new RegExp(search, 'i') },
            { name: new RegExp(search, 'i') },
            { mobile: new RegExp(search, 'i') },
            { email: new RegExp(search, 'i') }
          ]
        }).select('_id').lean(),
        Appointment.find({
          appointmentNo: new RegExp(search, 'i')
        }).select('_id').lean()
      ]);

      const patientIds = matchingPatients.map((p) => p._id);
      const appointmentIds = matchingAppointments.map((a) => a._id);

      if (config.model.schema.paths.patient && patientIds.length) {
        orQuery.push({ patient: { $in: patientIds } });
      }
      if (config.model.schema.paths.appointment && appointmentIds.length) {
        orQuery.push({ appointment: { $in: appointmentIds } });
      }

      if (orQuery.length) {
        query.$or = orQuery;
      } else {
        query._id = null;
      }
    }

    let dbQuery = config.model.find(query);
    config.populate.forEach((path) => {
      dbQuery = dbQuery.populate(path);
    });
    const [items, total] = await Promise.all([
      dbQuery.sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      config.model.countDocuments(query)
    ]);

    res.render('admin/list', {
      title: config.title,
      resource,
      config,
      items,
      page,
      pages: Math.max(Math.ceil(total / limit), 1),
      search,
      basePath,
      getNested,
      formatValue
    });
  } catch (error) {
    next(error);
  }
};

exports.form = (resource, basePath = '/admin') => async (req, res, next) => {
  try {
    const config = meta[resource];
    const item = req.params.id ? await config.model.findById(req.params.id).lean() : {};
    const options = await loadOptions(resource);

    for (const field of config.fields.filter((itemField) => itemField.auto && !item[itemField.name])) {
      item[field.name] = await nextCode(config.model, field.auto, field.name);
    }

    res.render('admin/form', { title: `${item._id ? 'Edit' : 'Add'} ${config.singular}`, resource, config, item, options, basePath });
  } catch (error) {
    next(error);
  }
};

exports.create = (resource, basePath = '/admin') => async (req, res, next) => {
  try {
    const config = meta[resource];
    const data = normalizeBody(resource, req.body, req.file);
    await resolveRefIds(config, data);
    if (resource === 'prescriptions') {
      const appointment = await Appointment.findById(data.appointment).lean();
      if (!appointment) {
        req.flash('error', 'Please select a valid appointment ID');
        return res.redirect('back');
      }
      if (req.session.user.role === 'doctor' && String(appointment.doctor) !== String(req.session.user.doctor)) {
        req.flash('error', 'You can add prescriptions only for your own appointments');
        return res.redirect('back');
      }
      data.patient = appointment.patient;
      data.doctor = appointment.doctor;
    }
    for (const field of config.fields.filter((itemField) => itemField.auto)) {
      data[field.name] = await nextCode(config.model, field.auto, field.name);
    }
    if (resource === 'patients' && req.session.user.role === 'doctor' && req.session.user.doctor) {
      data.assignedDoctor = req.session.user.doctor;
      if (!data.department) {
        const doctor = await Doctor.findById(req.session.user.doctor).select('department').lean();
        data.department = doctor?.department;
      }
    }
    if (resource === 'bills') await assertMedicineStock(medicineStockChanges([], data.medicineItems || []));
    const item = await config.model.create(data);
    if (resource === 'bills') await applyMedicineStockChange([], item.medicineItems || []);
    if (resource === 'doctors') {
      await User.create({
        name: item.name,
        email: item.email,
        password: req.body.password,
        role: 'doctor',
        doctor: item._id
      });
    }
    req.flash('success', `${config.singular} saved successfully`);
    res.redirect(`${basePath}/${resource}`);
  } catch (error) {
    next(error);
  }
};

exports.update = (resource, basePath = '/admin') => async (req, res, next) => {
  try {
    const config = meta[resource];
    const data = normalizeBody(resource, req.body, req.file);
    await resolveRefIds(config, data);
    if (resource === 'prescriptions') {
      const appointment = await Appointment.findById(data.appointment).lean();
      if (!appointment) {
        req.flash('error', 'Please select a valid appointment ID');
        return res.redirect('back');
      }
      if (req.session.user.role === 'doctor' && String(appointment.doctor) !== String(req.session.user.doctor)) {
        req.flash('error', 'You can edit prescriptions only for your own appointments');
        return res.redirect('back');
      }
      data.patient = appointment.patient;
      data.doctor = appointment.doctor;
    }
    for (const field of config.fields.filter((itemField) => itemField.auto)) {
      delete data[field.name];
    }
    if (resource === 'patients' && req.session.user.role === 'doctor' && req.session.user.doctor) {
      data.assignedDoctor = req.session.user.doctor;
      if (!data.department) {
        const doctor = await Doctor.findById(req.session.user.doctor).select('department').lean();
        data.department = doctor?.department;
      }
    }
    if (['receptionists', 'pharmacists'].includes(resource) && data.password) data.password = await bcrypt.hash(data.password, 12);
    const previous = resource === 'bills' ? await config.model.findById(req.params.id).select('medicineItems').lean() : null;
    if (resource === 'bills') await assertMedicineStock(medicineStockChanges(previous?.medicineItems || [], data.medicineItems || []));
    const item = await config.model.findByIdAndUpdate(req.params.id, data, { runValidators: true, new: true });
    if (resource === 'bills' && item) await applyMedicineStockChange(previous?.medicineItems || [], item.medicineItems || []);
    if (resource === 'doctors' && item) {
      const userData = { name: item.name, email: item.email, role: 'doctor', doctor: item._id };
      if (req.body.password) userData.password = await bcrypt.hash(req.body.password, 12);
      await User.findOneAndUpdate({ doctor: item._id }, userData, { upsert: true, runValidators: true, setDefaultsOnInsert: true });
    }
    req.flash('success', `${config.singular} updated successfully`);
    res.redirect(`${basePath}/${resource}`);
  } catch (error) {
    next(error);
  }
};

exports.remove = (resource, basePath = '/admin') => async (req, res, next) => {
  try {
    const config = meta[resource];
    await config.model.findByIdAndDelete(req.params.id);
    req.flash('success', `${config.singular} deleted successfully`);
    res.redirect(`${basePath}/${resource}`);
  } catch (error) {
    next(error);
  }
};
