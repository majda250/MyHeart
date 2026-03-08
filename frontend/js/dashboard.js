async function loadDashboard() {
  const statEls = {
    patients: document.getElementById('dash-patients'),
    appointments: document.getElementById('dash-appointments'),
    bills: document.getElementById('dash-bills'),
    prescriptions: document.getElementById('dash-prescriptions'),
    labs: document.getElementById('dash-labs'),
  };
  const [pRes, aRes, bRes, prRes, lRes] = await Promise.allSettled([
    http(`${API.PATIENT}/patients`),
    http(`${API.APPOINTMENT}/appointments`),
    http(`${API.BILLING}/bills`),
    http(`${API.PRESCRIPTION}/prescriptions`),
    http(`${API.LAB}/lab-reports`),
  ]);
  if (pRes.status === 'fulfilled') statEls.patients.textContent = pRes.value.data.length;
  else statEls.patients.textContent = '—';
  if (aRes.status === 'fulfilled') {
    statEls.appointments.textContent = aRes.value.data.length;
    renderRecentActivity(aRes.value.data);
  } else statEls.appointments.textContent = '—';
  if (bRes.status === 'fulfilled')
    statEls.bills.textContent = bRes.value.data.filter(b => b.status === 'En attente').length;
  else statEls.bills.textContent = '—';
  if (prRes.status === 'fulfilled') statEls.prescriptions.textContent = prRes.value.data.length;
  else statEls.prescriptions.textContent = '—';
  if (lRes.status === 'fulfilled') statEls.labs.textContent = lRes.value.data.length;
  else statEls.labs.textContent = '—';
  checkServiceHealth();
}

function renderRecentActivity(appointments) {
  const list = document.getElementById('recent-activity');
  const colors = { 'Planifié':'#74b9ff','Confirmé':'#00b894','Terminé':'#b2bec3','Annulé':'#e17055' };
  const recent = appointments.slice(0, 6);
  if (!recent.length) {
    list.innerHTML = '<li class="activity-item"><div class="activity-content"><p>Aucune activité récente</p></div></li>';
    return;
  }
  list.innerHTML = recent.map(a => `
    <li class="activity-item">
      <div class="activity-dot" style="background:${colors[a.status]||'#ccc'}"></div>
      <div class="activity-content">
        <p><strong>${a.patientName || 'Patient'}</strong> → Dr. ${a.doctorName} (${a.specialty})</p>
        <span>${fmtDate(a.date)} à ${a.time} · ${a.status}</span>
      </div>
    </li>`).join('');
}

async function checkServiceHealth() {
  const services = [
    { id: 'h-patient',      url: `${API.PATIENT}/health`,      name: 'Patients' },
    { id: 'h-appointment',  url: `${API.APPOINTMENT}/health`,  name: 'Rendez-vous' },
    { id: 'h-billing',      url: `${API.BILLING}/health`,      name: 'Facturation' },
    { id: 'h-prescription', url: `${API.PRESCRIPTION}/health`, name: 'Prescriptions' },
    { id: 'h-lab',          url: `${API.LAB}/health`,          name: 'Laboratoire' },
  ];
  for (const svc of services) {
    const el = document.getElementById(svc.id);
    if (!el) continue;
    el.querySelector('.h-dot').className = 'h-dot checking';
    try {
      const res = await fetch(svc.url, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        el.querySelector('.h-dot').className = 'h-dot up';
        el.querySelector('span').textContent = svc.name + ' ✓';
      } else throw new Error();
    } catch {
      el.querySelector('.h-dot').className = 'h-dot down';
      el.querySelector('span').textContent = svc.name + ' ✗';
    }
  }
}
