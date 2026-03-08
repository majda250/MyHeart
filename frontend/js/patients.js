let editingPatientId = null;

async function loadPatients() {
  const container = document.getElementById('patients-list');
  container.innerHTML = `<div class="loading"><div class="spinner"></div> Chargement...</div>`;
  try {
    const res = await http(`${API.PATIENT}/patients`);
    renderPatients(res.data);
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h4>Service indisponible</h4><p>${err.message}</p></div>`;
  }
}

function renderPatients(patients) {
  const container = document.getElementById('patients-list');
  if (!patients.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">👤</div><h4>Aucun patient</h4><p>Ajoutez votre premier patient.</p></div>`;
    return;
  }
  const q = document.getElementById('patient-search')?.value?.toLowerCase() || '';
  const filtered = patients.filter(p =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
    p.email?.toLowerCase().includes(q) || p.phone?.includes(q)
  );
  container.innerHTML = `
    <div class="table-wrap"><table>
      <thead><tr><th>Nom</th><th>Date de naissance</th><th>Genre</th><th>Email</th><th>Téléphone</th><th>Groupe sanguin</th><th>Actions</th></tr></thead>
      <tbody>
        ${filtered.map(p => `
          <tr>
            <td><strong>${p.firstName} ${p.lastName}</strong></td>
            <td>${fmtDate(p.dateOfBirth)}</td>
            <td>${p.gender}</td>
            <td>${p.email}</td>
            <td>${p.phone}</td>
            <td>${p.bloodType || '—'}</td>
            <td>
              <button class="btn btn-outline btn-sm" onclick="editPatient('${p._id}')">✏️</button>
              <button class="btn btn-danger btn-sm" onclick="deletePatient('${p._id}')">🗑️</button>
            </td>
          </tr>`).join('')}
      </tbody>
    </table></div>`;
  window._patients = patients;
}

async function savePatient() {
  const form = document.getElementById('patient-form');
  const data = {
    firstName: form.firstName.value.trim(), lastName: form.lastName.value.trim(),
    dateOfBirth: form.dateOfBirth.value, gender: form.gender.value,
    email: form.email.value.trim(), phone: form.phone.value.trim(),
    address: form.address.value.trim(), bloodType: form.bloodType.value,
    allergies: form.allergies.value ? form.allergies.value.split(',').map(s=>s.trim()) : [],
    medicalHistory: form.medicalHistory.value ? form.medicalHistory.value.split(',').map(s=>s.trim()) : []
  };
  if (!data.firstName || !data.lastName || !data.email || !data.phone) {
    toast('Veuillez remplir tous les champs obligatoires', 'error'); return;
  }
  try {
    if (editingPatientId) {
      await http(`${API.PATIENT}/patients/${editingPatientId}`, { method: 'PUT', body: data });
      toast('Patient mis à jour avec succès');
    } else {
      await http(`${API.PATIENT}/patients`, { method: 'POST', body: data });
      toast('Patient créé avec succès');
    }
    closeModal('modal-patient');
    loadPatients();
  } catch (err) { toast(err.message, 'error'); }
}

async function editPatient(id) {
  try {
    const res = await http(`${API.PATIENT}/patients/${id}`);
    const p = res.data;
    editingPatientId = id;
    const form = document.getElementById('patient-form');
    form.firstName.value = p.firstName; form.lastName.value = p.lastName;
    form.dateOfBirth.value = p.dateOfBirth?.split('T')[0] || '';
    form.gender.value = p.gender; form.email.value = p.email;
    form.phone.value = p.phone; form.address.value = p.address || '';
    form.bloodType.value = p.bloodType || '';
    form.allergies.value = (p.allergies || []).join(', ');
    form.medicalHistory.value = (p.medicalHistory || []).join(', ');
    document.getElementById('modal-patient-title').textContent = 'Modifier le patient';
    openModal('modal-patient');
  } catch (err) { toast(err.message, 'error'); }
}

async function deletePatient(id) {
  confirmAction('Êtes-vous sûr de vouloir supprimer ce patient ?', async () => {
    try {
      await http(`${API.PATIENT}/patients/${id}`, { method: 'DELETE' });
      toast('Patient supprimé'); loadPatients();
    } catch (err) { toast(err.message, 'error'); }
  });
}

function openAddPatient() {
  editingPatientId = null;
  document.getElementById('modal-patient-title').textContent = 'Nouveau patient';
  openModal('modal-patient');
}
