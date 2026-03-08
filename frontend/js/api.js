const API = {
  PATIENT:      'http://localhost:3001',
  APPOINTMENT:  'http://localhost:3002',
  BILLING:      'http://localhost:3003',
  PRESCRIPTION: 'http://localhost:3004',
  LAB:          'http://localhost:3005',
};

async function http(url, options = {}) {
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erreur serveur');
    return data;
  } catch (err) {
    throw err;
  }
}

function toast(message, type = 'success') {
  const container = document.getElementById('toast-container') || (() => {
    const el = document.createElement('div');
    el.id = 'toast-container';
    el.className = 'toast-container';
    document.body.appendChild(el);
    return el;
  })();
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const t = document.createElement('div');
  t.className = `toast ${type !== 'success' ? type : ''}`;
  t.innerHTML = `<span>${icons[type] || '✅'}</span><span>${message}</span>`;
  container.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.4s'; setTimeout(() => t.remove(), 400); }, 3500);
}

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) {
  document.getElementById(id).classList.remove('active');
  const form = document.getElementById(id).querySelector('form');
  if (form) form.reset();
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function statusBadge(status) {
  const map = {
    'Planifié':   'badge-info',
    'Confirmé':   'badge-success',
    'Terminé':    'badge-default',
    'Annulé':     'badge-danger',
    'En attente': 'badge-warning',
    'Payé':       'badge-success',
    'Active':     'badge-success',
    'Expirée':    'badge-default',
    'En cours':   'badge-info',
    'Complété':   'badge-success',
    'Normal':     'badge-success',
    'Anormal':    'badge-warning',
    'Critique':   'badge-danger',
    'Urgent':     'badge-danger',
  };
  return `<span class="badge ${map[status] || 'badge-default'}">${status}</span>`;
}

function confirmAction(message, callback) {
  if (confirm(message)) callback();
}

function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const pageEl = document.getElementById(`page-${page}`);
  if (pageEl) {
    pageEl.style.display = 'block';
    if (window[`load${page.charAt(0).toUpperCase() + page.slice(1)}`]) {
      window[`load${page.charAt(0).toUpperCase() + page.slice(1)}`]();
    }
  }
  const navEl = document.querySelector(`[data-page="${page}"]`);
  if (navEl) navEl.classList.add('active');
  document.getElementById('page-title').textContent = {
    dashboard: 'Tableau de Bord',
    patients: 'Patients',
    appointments: 'Rendez-vous',
    billing: 'Facturation',
    prescriptions: 'Prescriptions',
    lab: 'Laboratoire',
  }[page] || page;
}
