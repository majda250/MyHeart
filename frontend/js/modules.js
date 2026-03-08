let editingAppointmentId = null;

async function loadAppointments() {
  const container = document.getElementById('appointments-list');
  container.innerHTML = `<div class="loading"><div class="spinner"></div> Chargement...</div>`;
  try {
    const res = await http(`${API.APPOINTMENT}/appointments`);
    window._appointments = res.data;
    renderAppointments(res.data);
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h4>Service indisponible</h4><p>${err.message}</p></div>`;
  }
}

function renderAppointments(appointments) {
  const container = document.getElementById('appointments-list');
  if (!appointments.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">📅</div><h4>Aucun rendez-vous</h4><p>Planifiez votre premier rendez-vous.</p></div>`;
    return;
  }
  container.innerHTML = `
    <div class="table-wrap"><table>
      <thead><tr><th>Patient</th><th>Médecin</th><th>Spécialité</th><th>Date</th><th>Heure</th><th>Statut</th><th>Actions</th></tr></thead>
      <tbody>
        ${appointments.map(a => `
          <tr>
            <td>${a.patientName || a.patientId}</td>
            <td>Dr. ${a.doctorName}</td>
            <td>${a.specialty}</td>
            <td>${fmtDate(a.date)}</td>
            <td>${a.time}</td>
            <td>${statusBadge(a.status)}</td>
            <td>
              <button class="btn btn-outline btn-sm" onclick="editAppointment('${a._id}')">✏️</button>
              <button class="btn btn-danger btn-sm" onclick="deleteAppointment('${a._id}')">🗑️</button>
            </td>
          </tr>`).join('')}
      </tbody>
    </table></div>`;
}

async function saveAppointment() {
  const form = document.getElementById('appointment-form');
  const data = {
    patientId:   form.patientId.value.trim(),
    patientName: form.patientName.value.trim(),
    doctorName:  form.doctorName.value.trim(),
    specialty:   form.specialty.value,
    date:        form.date.value,
    time:        form.time.value,
    reason:      form.reason.value.trim(),
    status:      form.status.value,
    notes:       form.notes.value.trim()
  };
  if (!data.patientId || !data.doctorName || !data.date || !data.time) {
    toast('Champs obligatoires manquants', 'error'); return;
  }
  try {
    if (editingAppointmentId) {
      await http(`${API.APPOINTMENT}/appointments/${editingAppointmentId}`, { method: 'PUT', body: data });
      toast('Rendez-vous mis à jour');
    } else {
      await http(`${API.APPOINTMENT}/appointments`, { method: 'POST', body: data });
      toast('Rendez-vous créé (facture générée automatiquement)');
    }
    closeModal('modal-appointment');
    loadAppointments();
  } catch (err) { toast(err.message, 'error'); }
}

async function editAppointment(id) {
  const a = window._appointments?.find(x => x._id === id);
  if (!a) return;
  editingAppointmentId = id;
  const form = document.getElementById('appointment-form');
  form.patientId.value   = a.patientId;
  form.patientName.value = a.patientName || '';
  form.doctorName.value  = a.doctorName;
  form.specialty.value   = a.specialty;
  form.date.value        = a.date?.split('T')[0] || '';
  form.time.value        = a.time;
  form.reason.value      = a.reason || '';
  form.status.value      = a.status;
  form.notes.value       = a.notes || '';
  document.getElementById('modal-appointment-title').textContent = 'Modifier le rendez-vous';
  openModal('modal-appointment');
}

async function deleteAppointment(id) {
  confirmAction('Supprimer ce rendez-vous ?', async () => {
    try {
      await http(`${API.APPOINTMENT}/appointments/${id}`, { method: 'DELETE' });
      toast('Rendez-vous supprimé');
      loadAppointments();
    } catch (err) { toast(err.message, 'error'); }
  });
}

function openAddAppointment() {
  editingAppointmentId = null;
  document.getElementById('modal-appointment-title').textContent = 'Nouveau rendez-vous';
  openModal('modal-appointment');
}

async function loadBilling() {
  const container = document.getElementById('billing-list');
  container.innerHTML = `<div class="loading"><div class="spinner"></div> Chargement...</div>`;
  try {
    const res = await http(`${API.BILLING}/bills`);
    window._bills = res.data;
    renderBills(res.data);
    loadBillingStats();
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h4>Service indisponible</h4><p>${err.message}</p></div>`;
  }
}

async function loadBillingStats() {
  try {
    const res = await http(`${API.BILLING}/bills/stats/summary`);
    const s = res.data;
    document.getElementById('bill-stat-total').textContent = s.total;
    document.getElementById('bill-stat-paid').textContent = s.paid;
    document.getElementById('bill-stat-pending').textContent = s.pending;
    document.getElementById('bill-stat-amount').textContent = `${s.paidAmount} MAD`;
  } catch(e) {}
}

function renderBills(bills) {
  const container = document.getElementById('billing-list');
  if (!bills.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">💰</div><h4>Aucune facture</h4><p>Les factures sont créées automatiquement à la prise de rendez-vous.</p></div>`;
    return;
  }
  container.innerHTML = `
    <div class="table-wrap"><table>
      <thead><tr><th>Patient</th><th>Description</th><th>Montant</th><th>Date</th><th>Statut</th><th>Actions</th></tr></thead>
      <tbody>
        ${bills.map(b => `
          <tr>
            <td>${b.patientName || b.patientId}</td>
            <td>${b.description}</td>
            <td><strong>${b.amount} MAD</strong></td>
            <td>${fmtDate(b.date)}</td>
            <td>${statusBadge(b.status)}</td>
            <td>
              ${b.status === 'En attente' ? `<button class="btn btn-primary btn-sm" onclick="payBill('${b._id}')">💳 Payer</button>` : ''}
              <button class="btn btn-danger btn-sm" onclick="deleteBill('${b._id}')">🗑️</button>
            </td>
          </tr>`).join('')}
      </tbody>
    </table></div>`;
}

async function payBill(id) {
  const method = prompt('Méthode de paiement (Carte / Espèces / Virement / Assurance):', 'Carte');
  if (!method) return;
  try {
    await http(`${API.BILLING}/bills/${id}/pay`, { method: 'PUT', body: { paymentMethod: method } });
    toast('Paiement enregistré avec succès');
    loadBilling();
  } catch (err) { toast(err.message, 'error'); }
}

async function saveBill() {
  const form = document.getElementById('bill-form');
  const data = {
    patientId:   form.patientId.value.trim(),
    patientName: form.patientName.value.trim(),
    description: form.description.value.trim(),
    amount:      parseFloat(form.amount.value),
    doctorName:  form.doctorName.value.trim()
  };
  if (!data.patientId || !data.description || !data.amount) {
    toast('Champs obligatoires manquants', 'error'); return;
  }
  try {
    await http(`${API.BILLING}/bills`, { method: 'POST', body: data });
    toast('Facture créée');
    closeModal('modal-bill');
    loadBilling();
  } catch (err) { toast(err.message, 'error'); }
}

async function deleteBill(id) {
  confirmAction('Supprimer cette facture ?', async () => {
    try {
      await http(`${API.BILLING}/bills/${id}`, { method: 'DELETE' });
      toast('Facture supprimée');
      loadBilling();
    } catch (err) { toast(err.message, 'error'); }
  });
}

async function loadPrescriptions() {
  const container = document.getElementById('prescriptions-list');
  container.innerHTML = `<div class="loading"><div class="spinner"></div> Chargement...</div>`;
  try {
    const res = await http(`${API.PRESCRIPTION}/prescriptions`);
    window._prescriptions = res.data;
    renderPrescriptions(res.data);
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h4>Service indisponible</h4><p>${err.message}</p></div>`;
  }
}

function renderPrescriptions(prescriptions) {
  const container = document.getElementById('prescriptions-list');
  if (!prescriptions.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">💊</div><h4>Aucune prescription</h4><p>Ajoutez la première prescription.</p></div>`;
    return;
  }
  container.innerHTML = `
    <div class="table-wrap"><table>
      <thead><tr><th>Patient</th><th>Médecin</th><th>Diagnostic</th><th>Médicaments</th><th>Date</th><th>Statut</th><th>Actions</th></tr></thead>
      <tbody>
        ${prescriptions.map(p => `
          <tr>
            <td>${p.patientName || p.patientId}</td>
            <td>Dr. ${p.doctorName}</td>
            <td>${p.diagnosis}</td>
            <td>${(p.medications||[]).map(m => m.name).join(', ') || '—'}</td>
            <td>${fmtDate(p.issuedAt)}</td>
            <td>${statusBadge(p.status)}</td>
            <td>
              <button class="btn btn-outline btn-sm" onclick="viewPrescription('${p._id}')">👁️</button>
              <button class="btn btn-danger btn-sm" onclick="deletePrescription('${p._id}')">🗑️</button>
            </td>
          </tr>`).join('')}
      </tbody>
    </table></div>`;
}

async function savePrescription() {
  const form = document.getElementById('prescription-form');
  const medications = [];
  form.querySelectorAll('.med-row').forEach(row => {
    const name = row.querySelector('[name=medName]')?.value?.trim();
    if (name) medications.push({
      name,
      dosage:    row.querySelector('[name=medDosage]')?.value?.trim() || '',
      frequency: row.querySelector('[name=medFreq]')?.value?.trim() || '',
      duration:  row.querySelector('[name=medDuration]')?.value?.trim() || '',
    });
  });
  const data = {
    patientId:   form.patientId.value.trim(),
    patientName: form.patientName.value.trim(),
    doctorName:  form.doctorName.value.trim(),
    specialty:   form.specialty.value.trim(),
    diagnosis:   form.diagnosis.value.trim(),
    medications,
    notes:       form.notes.value.trim(),
    status:      'Active'
  };
  if (!data.patientId || !data.doctorName || !data.diagnosis) {
    toast('Champs obligatoires manquants', 'error'); return;
  }
  try {
    await http(`${API.PRESCRIPTION}/prescriptions`, { method: 'POST', body: data });
    toast('Prescription créée');
    closeModal('modal-prescription');
    loadPrescriptions();
  } catch (err) { toast(err.message, 'error'); }
}

function viewPrescription(id) {
  const p = window._prescriptions?.find(x => x._id === id);
  if (!p) return;
  alert(`Prescription\nPatient: ${p.patientName}\nDiagnostic: ${p.diagnosis}\nMédicaments:\n${(p.medications||[]).map(m => `- ${m.name} | ${m.dosage} | ${m.frequency} | ${m.duration}`).join('\n')}`);
}

async function deletePrescription(id) {
  confirmAction('Supprimer cette prescription ?', async () => {
    try {
      await http(`${API.PRESCRIPTION}/prescriptions/${id}`, { method: 'DELETE' });
      toast('Prescription supprimée');
      loadPrescriptions();
    } catch (err) { toast(err.message, 'error'); }
  });
}

async function loadLab() {
  const container = document.getElementById('lab-list');
  container.innerHTML = `<div class="loading"><div class="spinner"></div> Chargement...</div>`;
  try {
    const res = await http(`${API.LAB}/lab-reports`);
    window._labs = res.data;
    renderLabs(res.data);
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h4>Service indisponible</h4><p>${err.message}</p></div>`;
  }
}

function renderLabs(labs) {
  const container = document.getElementById('lab-list');
  if (!labs.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">🔬</div><h4>Aucun rapport</h4><p>Créez le premier rapport de laboratoire.</p></div>`;
    return;
  }
  container.innerHTML = `
    <div class="table-wrap"><table>
      <thead><tr><th>Patient</th><th>Type d'analyse</th><th>Médecin</th><th>Priorité</th><th>Date</th><th>Statut</th><th>Actions</th></tr></thead>
      <tbody>
        ${labs.map(l => `
          <tr>
            <td>${l.patientName || l.patientId}</td>
            <td>${l.testType}</td>
            <td>Dr. ${l.doctorName}</td>
            <td>${statusBadge(l.priority)}</td>
            <td>${fmtDate(l.requestedAt)}</td>
            <td>${statusBadge(l.status)}</td>
            <td>
              <button class="btn btn-outline btn-sm" onclick="updateLabStatus('${l._id}')">✏️ Statut</button>
              <button class="btn btn-danger btn-sm" onclick="deleteLab('${l._id}')">🗑️</button>
            </td>
          </tr>`).join('')}
      </tbody>
    </table></div>`;
}

async function saveLabReport() {
  const form = document.getElementById('lab-form');
  const data = {
    patientId:     form.patientId.value.trim(),
    patientName:   form.patientName.value.trim(),
    doctorName:    form.doctorName.value.trim(),
    testType:      form.testType.value.trim(),
    labTechnician: form.labTechnician.value.trim(),
    priority:      form.priority.value,
    summary:       form.summary.value.trim(),
    status:        'En attente',
    results:       []
  };
  if (!data.patientId || !data.doctorName || !data.testType) {
    toast('Champs obligatoires manquants', 'error'); return;
  }
  try {
    await http(`${API.LAB}/lab-reports`, { method: 'POST', body: data });
    toast('Rapport de laboratoire créé');
    closeModal('modal-lab');
    loadLab();
  } catch (err) { toast(err.message, 'error'); }
}

async function updateLabStatus(id) {
  const status = prompt('Nouveau statut (En attente / En cours / Complété):', 'En cours');
  if (!status) return;
  try {
    await http(`${API.LAB}/lab-reports/${id}`, { method: 'PUT', body: { status } });
    toast('Statut mis à jour');
    loadLab();
  } catch (err) { toast(err.message, 'error'); }
}

async function deleteLab(id) {
  confirmAction('Supprimer ce rapport ?', async () => {
    try {
      await http(`${API.LAB}/lab-reports/${id}`, { method: 'DELETE' });
      toast('Rapport supprimé');
      loadLab();
    } catch (err) { toast(err.message, 'error'); }
  });
}
