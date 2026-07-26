// app.js
// All frontend logic: fetching, rendering, search/filter, create/update/delete,
// and handling loading / empty / error / no-results states (Task 4).

const API = '/api/jobcards';

const els = {
  search: document.getElementById('search'),
  statusFilter: document.getElementById('status-filter'),
  resultCount: document.getElementById('result-count'),
  jobList: document.getElementById('job-list'),
  stateLoading: document.getElementById('state-loading'),
  stateError: document.getElementById('state-error'),
  errorMessage: document.getElementById('error-message'),
  stateEmpty: document.getElementById('state-empty'),
  stateNoResults: document.getElementById('state-no-results'),
  btnRetry: document.getElementById('btn-retry'),
  btnNew: document.getElementById('btn-new'),
  btnEmptyNew: document.getElementById('btn-empty-new'),

  modalBackdrop: document.getElementById('modal-backdrop'),
  modalTitle: document.getElementById('modal-title'),
  modalClose: document.getElementById('modal-close'),
  form: document.getElementById('job-form'),
  fJobId: document.getElementById('f-job-id'),
  fVehicle: document.getElementById('f-vehicle-no'),
  fCustomer: document.getElementById('f-customer'),
  fDesc: document.getElementById('f-work-description'),
  fParts: document.getElementById('f-parts-cost'),
  fLabour: document.getElementById('f-labour-cost'),
  fDateIn: document.getElementById('f-date-in'),
  fDateOut: document.getElementById('f-date-out'),
  liveTotal: document.getElementById('live-total'),
  liveTotalValue: document.getElementById('live-total-value'),
  formGeneralError: document.getElementById('form-general-error'),
  btnCancel: document.getElementById('btn-cancel'),
  btnDelete: document.getElementById('btn-delete'),
  btnSave: document.getElementById('btn-save'),
  toast: document.getElementById('toast'),
};

let allRecords = [];   // last full list fetched from the server
let currentFiltered = [];

// ---------------- Rendering helpers ----------------

function rupee(n) {
  return '₹' + Number(n).toLocaleString('en-IN');
}

function statusClass(status) {
  if (status === 'Completed') return 'completed';
  if (status === 'Overdue') return 'overdue';
  return 'in-progress';
}

function showOnly(panelToShow) {
  const panels = [els.stateLoading, els.stateError, els.stateEmpty, els.stateNoResults, els.jobList];
  panels.forEach((p) => { p.hidden = p !== panelToShow; });
}

function showToast(message, isError = false) {
  els.toast.textContent = message;
  els.toast.className = 'toast' + (isError ? ' toast--error' : '');
  els.toast.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { els.toast.hidden = true; }, 3200);
}

function renderList(records) {
  currentFiltered = records;
  els.resultCount.textContent = `${records.length} record${records.length === 1 ? '' : 's'}`;

  if (allRecords.length === 0) {
    showOnly(els.stateEmpty);
    return;
  }
  if (records.length === 0) {
    showOnly(els.stateNoResults);
    return;
  }

  els.jobList.innerHTML = records.map(cardTemplate).join('');
  showOnly(els.jobList);

  els.jobList.querySelectorAll('.job-card').forEach((el) => {
    el.addEventListener('click', () => openEdit(el.dataset.jobId));
  });
}

function cardTemplate(r) {
  const cls = statusClass(r.status);
  const desc = r.work_description && r.work_description.trim()
    ? escapeHtml(r.work_description)
    : '<span class="job-card__desc--missing">No work description recorded yet</span>';

  return `
    <article class="job-card job-card--${cls}" data-job-id="${r.job_id}" tabindex="0">
      <div class="job-card__top">
        <span class="job-card__id">${r.job_id}</span>
        <span class="stamp stamp--${cls}">${r.status}</span>
      </div>
      <p class="job-card__vehicle">${escapeHtml(r.vehicle_no)}</p>
      <p class="job-card__customer">${escapeHtml(r.customer)}</p>
      <p class="job-card__desc">${desc}</p>
      <div class="job-card__footer">
        <span class="job-card__total ${r.billing_complete ? '' : 'job-card__total--incomplete'}">${rupee(r.total)}</span>
        <span class="job-card__dates">${r.date_in} ${r.date_out ? '&rarr; ' + r.date_out : '(in progress, ' + r.days_in_shop + 'd)'}</span>
      </div>
    </article>
  `;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---------------- Data fetching ----------------

async function loadRecords() {
  showOnly(els.stateLoading);
  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error('Server responded with an error while loading job cards.');
    const json = await res.json();
    allRecords = json.data;
    applyFilters();
  } catch (err) {
    els.errorMessage.textContent = err.message || 'Could not reach the server. Check your connection and try again.';
    showOnly(els.stateError);
  }
}

function applyFilters() {
  const q = els.search.value.trim().toLowerCase();
  const status = els.statusFilter.value;

  let results = allRecords;
  if (q) {
    results = results.filter((r) =>
      r.job_id.toLowerCase().includes(q) ||
      r.vehicle_no.toLowerCase().includes(q) ||
      r.customer.toLowerCase().includes(q) ||
      (r.work_description || '').toLowerCase().includes(q)
    );
  }
  if (status !== 'All') {
    results = results.filter((r) => r.status === status);
  }
  renderList(results);
}

els.search.addEventListener('input', applyFilters);
els.statusFilter.addEventListener('change', applyFilters);
els.btnRetry.addEventListener('click', loadRecords);

// ---------------- Modal: create / edit ----------------

function clearFieldErrors() {
  document.querySelectorAll('.form-error[data-for]').forEach((el) => { el.textContent = ''; });
  els.formGeneralError.hidden = true;
  els.formGeneralError.textContent = '';
}

function openCreate() {
  els.modalTitle.textContent = 'New job card';
  els.form.reset();
  els.fJobId.value = '';
  els.btnDelete.hidden = true;
  clearFieldErrors();
  els.liveTotal.hidden = true;
  els.modalBackdrop.hidden = false;
  els.fVehicle.focus();
}

function openEdit(jobId) {
  const r = allRecords.find((x) => x.job_id === jobId);
  if (!r) {
    showToast(`Job card ${jobId} was not found. It may have been deleted.`, true);
    return;
  }
  els.modalTitle.textContent = `Edit ${r.job_id}`;
  els.fJobId.value = r.job_id;
  els.fVehicle.value = r.vehicle_no;
  els.fCustomer.value = r.customer;
  els.fDesc.value = r.work_description || '';
  els.fParts.value = r.parts_cost === null ? '' : r.parts_cost;
  els.fLabour.value = r.labour_cost === null ? '' : r.labour_cost;
  els.fDateIn.value = r.date_in;
  els.fDateOut.value = r.date_out || '';
  els.btnDelete.hidden = false;
  clearFieldErrors();
  updateLiveTotal();
  els.modalBackdrop.hidden = false;
}

function closeModal() {
  els.modalBackdrop.hidden = true;
}

function updateLiveTotal() {
  const parts = Number(els.fParts.value || 0);
  const labour = Number(els.fLabour.value || 0);
  els.liveTotalValue.textContent = rupee(parts + labour);
  els.liveTotal.hidden = false;
}

els.fParts.addEventListener('input', updateLiveTotal);
els.fLabour.addEventListener('input', updateLiveTotal);
els.btnNew.addEventListener('click', openCreate);
els.btnEmptyNew.addEventListener('click', openCreate);
els.modalClose.addEventListener('click', closeModal);
els.btnCancel.addEventListener('click', closeModal);
els.modalBackdrop.addEventListener('click', (e) => { if (e.target === els.modalBackdrop) closeModal(); });

els.form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearFieldErrors();

  const jobId = els.fJobId.value;
  const payload = {
    vehicle_no: els.fVehicle.value.trim(),
    customer: els.fCustomer.value.trim(),
    work_description: els.fDesc.value.trim() || null,
    parts_cost: els.fParts.value === '' ? null : Number(els.fParts.value),
    labour_cost: els.fLabour.value === '' ? null : Number(els.fLabour.value),
    date_in: els.fDateIn.value,
    date_out: els.fDateOut.value || null,
  };

  els.btnSave.disabled = true;
  els.btnSave.textContent = 'Saving…';

  try {
    const res = await fetch(jobId ? `${API}/${jobId}` : API, {
      method: jobId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();

    if (!res.ok) {
      if (json.fieldErrors) {
        Object.entries(json.fieldErrors).forEach(([field, msg]) => {
          const el = document.querySelector(`.form-error[data-for="${field}"]`);
          if (el) el.textContent = msg;
        });
      }
      els.formGeneralError.textContent = json.error || 'Could not save this job card.';
      els.formGeneralError.hidden = false;
      return;
    }

    closeModal();
    showToast(jobId ? `${jobId} updated.` : `${json.data.job_id} created.`);
    await loadRecords();
  } catch (err) {
    els.formGeneralError.textContent = 'Could not reach the server. Your changes were not saved — please try again.';
    els.formGeneralError.hidden = false;
  } finally {
    els.btnSave.disabled = false;
    els.btnSave.textContent = 'Save job card';
  }
});

els.btnDelete.addEventListener('click', async () => {
  const jobId = els.fJobId.value;
  if (!jobId) return;
  if (!confirm(`Delete job card ${jobId}? This cannot be undone.`)) return;

  try {
    const res = await fetch(`${API}/${jobId}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Could not delete this job card.');
    closeModal();
    showToast(`${jobId} deleted.`);
    await loadRecords();
  } catch (err) {
    showToast(err.message, true);
  }
});

// ---------------- Init ----------------
loadRecords();
