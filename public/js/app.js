document.addEventListener('submit', (event) => {
  const form = event.target;
  if (form.classList.contains('needs-validation') && !form.checkValidity()) {
    event.preventDefault();
    event.stopPropagation();
  }
  if (form.classList.contains('delete-form')) {
    event.preventDefault();
    Swal.fire({
      title: 'Delete record?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d94a4a',
      confirmButtonText: 'Delete'
    }).then((result) => {
      if (result.isConfirmed) form.submit();
    });
  }
  form.classList.add('was-validated');
});

document.querySelectorAll('.data-table th').forEach((header, index) => {
  header.addEventListener('click', () => {
    const table = header.closest('table');
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    rows.sort((a, b) => a.children[index].innerText.localeCompare(b.children[index].innerText, undefined, { numeric: true }));
    rows.forEach((row) => table.querySelector('tbody').appendChild(row));
  });
});

document.addEventListener('click', (event) => {
  const addButton = event.target.closest('[data-add-medicine]');
  const removeButton = event.target.closest('[data-remove-medicine]');
  const stockAdd = event.target.closest('[data-stock-add]');
  const billStockAdd = event.target.closest('[data-bill-stock-add]');
  const addService = event.target.closest('[data-add-service]');
  const addBillMedicine = event.target.closest('[data-add-bill-medicine]');
  const removeLine = event.target.closest('[data-remove-line]');
  const addPharmacyMedicine = event.target.closest('[data-add-pharmacy-medicine]');

  if (addButton) {
    const list = document.querySelector('[data-medicine-list]');
    const index = list.querySelectorAll('[data-medicine-row]').length;
    const row = document.createElement('div');
    row.className = 'medicine-row';
    row.dataset.medicineRow = '';
    row.innerHTML = `
      <input type="hidden" name="medicines[${index}][medicine]" data-medicine-id>
      <input class="form-control" name="medicines[${index}][name]" placeholder="Medicine" required>
      <input class="form-control" name="medicines[${index}][dosage]" placeholder="Dosage">
      <input class="form-control" type="number" min="1" name="medicines[${index}][quantity]" value="1" placeholder="Qty">
      <select class="form-select" name="medicines[${index}][unit]">${unitOptions()}</select>
      <input class="form-control" type="number" name="medicines[${index}][days]" placeholder="Days">
      <label><input type="checkbox" name="medicines[${index}][morning]" value="true"> Morning</label>
      <label><input type="checkbox" name="medicines[${index}][afternoon]" value="true"> Afternoon</label>
      <label><input type="checkbox" name="medicines[${index}][night]" value="true"> Night</label>
      <input class="form-control" name="medicines[${index}][instructions]" placeholder="Instructions">
      <button class="btn btn-outline-danger btn-sm" type="button" data-remove-medicine><i class="fa-solid fa-trash"></i></button>
    `;
    list.appendChild(row);
  }

  if (removeButton) {
    const rows = document.querySelectorAll('[data-medicine-row]');
    if (rows.length > 1) removeButton.closest('[data-medicine-row]').remove();
  }

  if (stockAdd) addPrescriptionMedicine(stockAdd);
  if (billStockAdd) addBillMedicineRow(billStockAdd);
  if (addService) addServiceRow();
  if (addBillMedicine) addBillMedicineRow();
  if (addPharmacyMedicine) addPharmacyMedicineRow();
  if (removeLine) {
    const row = removeLine.closest('[data-service-row], [data-bill-medicine-row], [data-pharmacy-row]');
    const isPharmacy = row && row.hasAttribute('data-pharmacy-row');
    if (row) row.remove();
    if (isPharmacy) updatePharmacyBillSummary();
  }
});

document.addEventListener('input', (event) => {
  if (event.target.matches('[data-stock-search]')) filterStockList(event.target);
  if (event.target.matches('[data-line-qty], [data-line-rate]')) {
    const row = event.target.closest('[data-service-row], [data-bill-medicine-row], [data-pharmacy-row]');
    updateLineAmount(row);
    if (row && row.hasAttribute('data-pharmacy-row')) {
      updatePharmacyBillSummary();
    }
  }
  if (event.target.matches('[data-bill-paid]')) {
    updatePharmacyBillSummary();
  }
});

document.addEventListener('change', (event) => {
  if (event.target.matches('[data-price-type]')) {
    const row = event.target.closest('[data-pharmacy-row]');
    const rate = row?.querySelector('[data-line-rate]');
    if (rate) rate.value = event.target.value === 'piece' ? event.target.dataset.pieceRate || 0 : event.target.dataset.unitRate || 0;
    updateLineAmount(row);
    updatePharmacyBillSummary();
  }
});

function unitOptions(selected = 'Tablet') {
  return ['Tablet', 'Bottle', 'Packet', 'Strip', 'Injection', 'Other']
    .map((unit) => `<option value="${unit}" ${unit === selected ? 'selected' : ''}>${unit}</option>`)
    .join('');
}

function escapeAttr(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function filterStockList(input) {
  const query = input.value.trim().toLowerCase();
  const scope = input.closest('.stock-picker') || document;
  scope.querySelectorAll('[data-stock-add], [data-bill-stock-add], [data-pharmacy-stock-add]').forEach((button) => {
    button.hidden = query && !button.dataset.name.toLowerCase().includes(query);
  });
}

function addPrescriptionMedicine(button) {
  const list = document.querySelector('[data-medicine-list]');
  const rows = list.querySelectorAll('[data-medicine-row]');
  const row = rows[rows.length - 1];
  const target = row && !row.querySelector('input[name$="[name]"]').value ? row : null;
  if (!target) document.querySelector('[data-add-medicine]')?.click();
  const finalRow = target || list.querySelectorAll('[data-medicine-row]')[list.querySelectorAll('[data-medicine-row]').length - 1];
  finalRow.querySelector('[data-medicine-id]').value = button.dataset.id || '';
  finalRow.querySelector('input[name$="[name]"]').value = button.dataset.name || '';
}

function addServiceRow() {
  const list = document.querySelector('[data-service-list]');
  if (!list) return;
  const index = list.querySelectorAll('[data-service-row]').length;
  const row = document.createElement('div');
  row.className = 'bill-row';
  row.dataset.serviceRow = '';
  row.innerHTML = `
    <select class="form-select" name="serviceItems[${index}][category]">
      ${['Registration', 'Consultation', 'Room', 'Checkup', 'Test', 'Surgery', 'Other'].map((category) => `<option value="${category}">${category}</option>`).join('')}
    </select>
    <input class="form-control" name="serviceItems[${index}][description]" placeholder="Description">
    <input class="form-control" type="number" min="1" name="serviceItems[${index}][quantity]" value="1" placeholder="Qty" data-line-qty>
    <input class="form-control" type="number" min="0" step="0.01" name="serviceItems[${index}][rate]" value="0" placeholder="Rate" data-line-rate>
    <input class="form-control" type="number" name="serviceItems[${index}][amount]" value="0" placeholder="Amount" data-line-amount readonly>
    <button class="btn btn-outline-danger btn-sm" type="button" data-remove-line><i class="fa-solid fa-trash"></i></button>
  `;
  list.appendChild(row);
}

function addBillMedicineRow(button) {
  const list = document.querySelector('[data-bill-medicine-list]');
  if (!list) return;
  const index = list.querySelectorAll('[data-bill-medicine-row]').length;
  const row = document.createElement('div');
  row.className = 'bill-row';
  row.dataset.billMedicineRow = '';
  const medicineName = escapeAttr(button?.dataset.name || '');
  row.innerHTML = `
    <input type="hidden" name="medicineItems[${index}][medicine]" value="${button?.dataset.id || ''}" data-medicine-id>
    <input class="form-control" name="medicineItems[${index}][name]" value="${medicineName}" placeholder="Medicine">
    <select class="form-select" name="medicineItems[${index}][unit]">${unitOptions('Packet')}</select>
    <input class="form-control" type="number" min="1" max="${button?.dataset.quantity || ''}" name="medicineItems[${index}][quantity]" value="1" placeholder="Qty" data-line-qty>
    <input class="form-control" type="number" min="0" step="0.01" name="medicineItems[${index}][rate]" value="${button?.dataset.rate || 0}" placeholder="Rate" data-line-rate>
    <input class="form-control" type="number" name="medicineItems[${index}][amount]" value="${button?.dataset.rate || 0}" placeholder="Amount" data-line-amount readonly>
    <button class="btn btn-outline-danger btn-sm" type="button" data-remove-line><i class="fa-solid fa-trash"></i></button>
  `;
  list.appendChild(row);
}

function addPharmacyMedicineRow(button, defaultQty = 1) {
  const list = document.querySelector('[data-pharmacy-list]');
  if (!list) return;
  const index = list.querySelectorAll('[data-pharmacy-row]').length;
  const row = document.createElement('div');
  row.className = 'bill-row';
  row.dataset.pharmacyRow = '';
  
  const isManual = !button;
  const medicineName = escapeAttr(button?.dataset.name || '');
  const unitName = escapeAttr(button?.dataset.unit || 'Packet');
  const unitRate = button?.dataset.rate || 0;
  const pieceRate = button?.dataset.pieceRate || 0;
  const stockQty = isManual ? 99999 : Number(button?.dataset.quantity || 0);

  const stockLabel = isManual
    ? ''
    : (stockQty === 0
      ? `<span class="badge text-bg-danger d-block mt-1" data-stock-label style="font-size: 11px;">Not Available (0 left)</span>`
      : `<span class="badge text-bg-info d-block mt-1" data-stock-label style="font-size: 11px;">In Stock (${stockQty} left)</span>`);

  const initialQty = !isManual && stockQty === 0 ? 0 : Math.min(defaultQty, stockQty);

  row.innerHTML = `
    <input type="hidden" name="items[${index}][medicine]" value="${button?.dataset.id || ''}" data-medicine-id>
    <div>
      <input class="form-control" name="items[${index}][name]" value="${medicineName}" placeholder="Medicine" required>
      ${stockLabel}
    </div>
    <select class="form-select" name="items[${index}][unit]">${unitOptions(unitName)}</select>
    <select class="form-select" name="items[${index}][priceType]" data-price-type data-unit-rate="${unitRate}" data-piece-rate="${pieceRate}">
      <option value="unit">Per Unit</option>
      <option value="piece">Per Piece</option>
    </select>
    <input class="form-control" type="number" min="${!isManual && stockQty === 0 ? 0 : 1}" ${isManual ? '' : `max="${stockQty}"`} name="items[${index}][quantity]" value="${initialQty}" placeholder="Qty" data-line-qty ${!isManual && stockQty === 0 ? 'disabled' : ''}>
    <input class="form-control" type="number" min="0" step="0.01" name="items[${index}][rate]" value="${unitRate}" placeholder="Rate" data-line-rate>
    <input class="form-control" type="number" name="items[${index}][amount]" value="${(initialQty * unitRate).toFixed(2)}" placeholder="Amount" data-line-amount readonly>
    <button class="btn btn-outline-danger btn-sm" type="button" data-remove-line><i class="fa-solid fa-trash"></i></button>
  `;
  list.appendChild(row);
  updatePharmacyBillSummary();
}

document.addEventListener('click', (event) => {
  const pharmacyStockAdd = event.target.closest('[data-pharmacy-stock-add]');
  if (pharmacyStockAdd) addPharmacyMedicineRow(pharmacyStockAdd);
});

function updateLineAmount(row) {
  if (!row) return;
  const qty = Number(row.querySelector('[data-line-qty]')?.value || 0);
  const rate = Number(row.querySelector('[data-line-rate]')?.value || 0);
  const amount = row.querySelector('[data-line-amount]');
  if (amount) amount.value = (qty * rate).toFixed(2);
}

function updatePharmacyBillSummary() {
  const pharmacyList = document.querySelector('[data-pharmacy-list]');
  if (!pharmacyList) return;

  let subtotal = 0;
  pharmacyList.querySelectorAll('[data-pharmacy-row]').forEach((row) => {
    const qty = Number(row.querySelector('[data-line-qty]')?.value || 0);
    const rate = Number(row.querySelector('[data-line-rate]')?.value || 0);
    const amount = qty * rate;
    subtotal += amount;
  });

  const subtotalInput = document.querySelector('[data-bill-subtotal]');
  const gstInput = document.querySelector('[data-bill-gst]');
  const discountInput = document.querySelector('[data-bill-discount]');
  const totalInput = document.querySelector('[data-bill-total]');
  const paidInput = document.querySelector('[data-bill-paid]');
  const returnInput = document.querySelector('[data-bill-return]');

  if (subtotalInput) subtotalInput.value = subtotal.toFixed(2);

  const gst = Number((subtotal * 0.18).toFixed(2));
  if (gstInput) gstInput.value = gst.toFixed(2);

  const discount = Number(((subtotal + gst) * 0.10).toFixed(2));
  if (discountInput) discountInput.value = discount.toFixed(2);

  const total = Math.max(subtotal + gst - discount, 0);
  if (totalInput) totalInput.value = total.toFixed(2);

  const paidAmount = Number(paidInput?.value || 0);
  const returnAmount = Math.max(paidAmount - total, 0);
  if (returnInput) returnInput.value = returnAmount.toFixed(2);
}

// Initialize on page load if pharmacy elements exist
if (document.querySelector('[data-pharmacy-list]')) {
  updatePharmacyBillSummary();

  const patientIdInput = document.getElementById('patient-id-input');
  const patientDbIdInput = document.getElementById('patient-db-id');
  const customerNameInput = document.getElementById('customer-name-input');
  const customerMobileInput = document.getElementById('customer-mobile-input');
  const statusDiv = document.getElementById('patient-id-status');

  let patients = [];
  let medicines = [];
  let prescriptions = [];
  try {
    const patientsScript = document.getElementById('patients-data');
    if (patientsScript) patients = JSON.parse(patientsScript.textContent);

    const medicinesScript = document.getElementById('medicines-data');
    if (medicinesScript) medicines = JSON.parse(medicinesScript.textContent);

    const prescriptionsScript = document.getElementById('prescriptions-data');
    if (prescriptionsScript) prescriptions = JSON.parse(prescriptionsScript.textContent);
  } catch (err) {
    console.error('Failed to parse serialized data:', err);
  }

  if (patientIdInput) {
    patientIdInput.addEventListener('input', () => {
      const typedId = patientIdInput.value.trim().toUpperCase();
      if (!typedId) {
        patientDbIdInput.value = '';
        customerNameInput.value = '';
        customerMobileInput.value = '';
        customerNameInput.readOnly = false;
        customerMobileInput.readOnly = false;
        statusDiv.textContent = '';
        statusDiv.className = 'small text-muted mt-1';

        const list = document.querySelector('[data-pharmacy-list]');
        if (list) list.innerHTML = '';
        updatePharmacyBillSummary();
        return;
      }

      const patient = patients.find(p => p.patientId && p.patientId.toUpperCase() === typedId);
      if (patient) {
        patientDbIdInput.value = patient._id;
        customerNameInput.value = patient.name || '';
        customerMobileInput.value = patient.mobile || '';
        customerNameInput.readOnly = true;
        customerMobileInput.readOnly = true;
        statusDiv.textContent = `✓ Patient verified: ${patient.name}`;
        statusDiv.className = 'small text-success mt-1';

        // Auto-load prescribed medicines
        const list = document.querySelector('[data-pharmacy-list]');
        if (list) list.innerHTML = '';

        const prescription = prescriptions.find(p => String(p.patient) === String(patient._id));
        if (prescription && prescription.medicines && prescription.medicines.length) {
          prescription.medicines.forEach(prescribedMed => {
            const stockMed = medicines.find(m => m.name.toLowerCase() === prescribedMed.name.toLowerCase());
            if (stockMed) {
              const simButton = {
                dataset: {
                  id: stockMed._id,
                  name: stockMed.name,
                  rate: stockMed.perUnitPrice || stockMed.sellingPrice || 0,
                  pieceRate: stockMed.perPiecePrice || 0,
                  unit: stockMed.unitName || 'Packet',
                  quantity: stockMed.quantity || 0
                }
              };
              addPharmacyMedicineRow(simButton, prescribedMed.quantity || 1);
            } else {
              const simButton = {
                dataset: {
                  id: '',
                  name: prescribedMed.name,
                  rate: 0,
                  pieceRate: 0,
                  unit: prescribedMed.unit || 'Packet',
                  quantity: 0
                }
              };
              addPharmacyMedicineRow(simButton, prescribedMed.quantity || 1);
            }
          });
          statusDiv.innerHTML = `✓ Patient verified: ${patient.name}<br><span class="text-info" style="font-size: 11px;">Latest prescription loaded automatically (${prescription.medicines.length} items).</span>`;
        }
      } else {
        patientDbIdInput.value = '';
        customerNameInput.readOnly = false;
        customerMobileInput.readOnly = false;
        statusDiv.textContent = '⚠ ID not registered. Treating as walk-in customer.';
        statusDiv.className = 'small text-warning mt-1';

        const list = document.querySelector('[data-pharmacy-list]');
        if (list) list.innerHTML = '';
        updatePharmacyBillSummary();
      }
    });
  }
}

document.querySelectorAll('[data-max-checks]').forEach((group) => {
  group.addEventListener('change', () => {
    const max = Number(group.dataset.maxChecks || 0);
    if (!max) return;
    const checked = group.querySelectorAll('input[type="checkbox"]:checked');
    if (checked.length > max) {
      checked[checked.length - 1].checked = false;
      if (window.Swal) Swal.fire({ icon: 'info', title: `Choose only ${max}` });
    }
  });
});

function syncRefDetail(input) {
  const detailInput = input.parentElement.querySelector('[data-ref-detail]');
  if (!detailInput) return;

  const datalist = document.getElementById(input.getAttribute('list'));
  if (!datalist) return;

  const typedValue = input.value.trim().toUpperCase();
  const option = Array.from(datalist.options).find(opt => opt.value.trim().toUpperCase() === typedValue);
  
  detailInput.value = option ? option.dataset.detail || '' : '';
}

document.querySelectorAll('[data-ref-select]').forEach((input) => {
  syncRefDetail(input);
  input.addEventListener('change', () => syncRefDetail(input));
  input.addEventListener('input', () => syncRefDetail(input));
});

// Auto-charges fetch and rendering for Billing form
if (document.querySelector('[data-bill-builder]')) {
  const patientInput = document.querySelector('input[name="patient"]');
  const appointmentInput = document.querySelector('input[name="appointment"]');

  let debounceTimer;
  const fetchAutoCharges = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      const patientVal = patientInput?.value || '';
      const appointmentVal = appointmentInput?.value || '';
      if (!patientVal && !appointmentVal) return;

      try {
        const res = await fetch(`/billing/auto-charges?patientVal=${encodeURIComponent(patientVal)}&appointmentVal=${encodeURIComponent(appointmentVal)}`);
        const data = await res.json();
        if (data.serviceItems && data.serviceItems.length) {
          const list = document.querySelector('[data-service-list]');
          if (list) {
            list.innerHTML = '';
            data.serviceItems.forEach((service, index) => {
              const row = document.createElement('div');
              row.className = 'bill-row';
              row.dataset.serviceRow = '';
              row.innerHTML = `
                <select class="form-select" name="serviceItems[${index}][category]">
                  ${['Registration', 'Consultation', 'Room', 'Checkup', 'Test', 'Surgery', 'Other']
                    .map((cat) => `<option value="${cat}" ${service.category === cat ? 'selected' : ''}>${cat}</option>`)
                    .join('')}
                </select>
                <input class="form-control" name="serviceItems[${index}][description]" value="${escapeAttr(service.description)}" placeholder="Description">
                <input class="form-control" type="number" min="1" name="serviceItems[${index}][quantity]" value="${service.quantity}" placeholder="Qty" data-line-qty>
                <input class="form-control" type="number" min="0" step="0.01" name="serviceItems[${index}][rate]" value="${service.rate}" placeholder="Rate" data-line-rate>
                <input class="form-control" type="number" name="serviceItems[${index}][amount]" value="${service.amount.toFixed(2)}" placeholder="Amount" data-line-amount readonly>
                <button class="btn btn-outline-danger btn-sm" type="button" data-remove-line><i class="fa-solid fa-trash"></i></button>
              `;
              list.appendChild(row);
            });
          }
        }
      } catch (err) {
        console.error('Failed to load auto-charges:', err);
      }
    }, 250);
  };

  if (patientInput) {
    patientInput.addEventListener('change', fetchAutoCharges);
    patientInput.addEventListener('input', fetchAutoCharges);
  }
  if (appointmentInput) {
    appointmentInput.addEventListener('change', fetchAutoCharges);
    appointmentInput.addEventListener('input', fetchAutoCharges);
  }
}

function makeChart(id, type, labels, data, color) {
  const canvas = document.getElementById(id);
  if (!canvas || !window.Chart) return;
  new Chart(canvas, {
    type,
    data: { labels, datasets: [{ data, backgroundColor: color, borderColor: color, tension: .35 }] },
    options: { plugins: { legend: { display: false } }, responsive: true, maintainAspectRatio: false }
  });
}

makeChart('patientsChart', 'line', ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], [42, 58, 61, 73, 88, 94], '#0b72b9');
makeChart('revenueChart', 'bar', ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], [18000, 25000, 22000, 31000, 42000, 51000], '#2e9f6e');
makeChart('departmentChart', 'doughnut', ['Cardiology', 'Neurology', 'Pediatrics', 'Surgery'], [30, 18, 26, 21], ['#0b72b9', '#13a8b5', '#2e9f6e', '#f0ad4e']);
