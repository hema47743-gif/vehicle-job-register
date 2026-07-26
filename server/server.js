// server.js
// Express REST API for the Vehicle Service Centre Job Card and Billing Register.

const path = require('node:path');
const express = require('express');
const db = require('./db');
const { validateJobCard, withDerivedFields } = require('./logic');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

function nextJobId() {
  const row = db.prepare(`SELECT job_id FROM job_cards ORDER BY job_id DESC LIMIT 1`).get();
  const year = new Date().getFullYear();
  if (!row) return `JC-${year}-001`;
  const match = row.job_id.match(/(\d+)$/);
  const nextNum = match ? String(Number(match[1]) + 1).padStart(3, '0') : '001';
  return `JC-${year}-${nextNum}`;
}

// ---- GET /api/jobcards  (list, with search + status filter) ----
app.get('/api/jobcards', (req, res) => {
  try {
    const { search = '', status = '' } = req.query;
    const rows = db.prepare(`SELECT * FROM job_cards ORDER BY date_in DESC, job_id DESC`).all();
    let results = rows.map(withDerivedFields);

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      results = results.filter((r) =>
        r.job_id.toLowerCase().includes(q) ||
        r.vehicle_no.toLowerCase().includes(q) ||
        r.customer.toLowerCase().includes(q) ||
        (r.work_description || '').toLowerCase().includes(q)
      );
    }

    if (status && status.trim() && status !== 'All') {
      results = results.filter((r) => r.status === status);
    }

    res.json({ data: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load job cards. Please try again.' });
  }
});

// ---- GET /api/jobcards/:id ----
app.get('/api/jobcards/:id', (req, res) => {
  try {
    const row = db.prepare(`SELECT * FROM job_cards WHERE job_id = ?`).get(req.params.id);
    if (!row) {
      return res.status(404).json({ error: `Job card ${req.params.id} was not found.` });
    }
    res.json({ data: withDerivedFields(row) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load this job card. Please try again.' });
  }
});

// ---- POST /api/jobcards  (create) ----
app.post('/api/jobcards', (req, res) => {
  try {
    const body = req.body || {};
    const { valid, errors } = validateJobCard(body, { partial: false });
    if (!valid) {
      return res.status(400).json({ error: 'Please fix the highlighted fields.', fieldErrors: errors });
    }

    const jobId = nextJobId();
    db.prepare(`
      INSERT INTO job_cards (job_id, vehicle_no, customer, work_description, parts_cost, labour_cost, date_in, date_out)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      jobId,
      body.vehicle_no.trim(),
      body.customer.trim(),
      body.work_description ?? null,
      body.parts_cost === undefined || body.parts_cost === '' ? null : Number(body.parts_cost),
      body.labour_cost === undefined || body.labour_cost === '' ? null : Number(body.labour_cost),
      body.date_in,
      body.date_out || null
    );

    const row = db.prepare(`SELECT * FROM job_cards WHERE job_id = ?`).get(jobId);
    res.status(201).json({ data: withDerivedFields(row) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save the new job card. Please try again.' });
  }
});

// ---- PUT /api/jobcards/:id  (update) ----
app.put('/api/jobcards/:id', (req, res) => {
  try {
    const existing = db.prepare(`SELECT * FROM job_cards WHERE job_id = ?`).get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: `Job card ${req.params.id} was not found.` });
    }

    const body = req.body || {};
    const { valid, errors } = validateJobCard(body, { partial: true });
    if (!valid) {
      return res.status(400).json({ error: 'Please fix the highlighted fields.', fieldErrors: errors });
    }

    const merged = {
      vehicle_no: body.vehicle_no !== undefined ? body.vehicle_no.trim() : existing.vehicle_no,
      customer: body.customer !== undefined ? body.customer.trim() : existing.customer,
      work_description: body.work_description !== undefined ? body.work_description : existing.work_description,
      parts_cost: body.parts_cost !== undefined ? (body.parts_cost === '' ? null : Number(body.parts_cost)) : existing.parts_cost,
      labour_cost: body.labour_cost !== undefined ? (body.labour_cost === '' ? null : Number(body.labour_cost)) : existing.labour_cost,
      date_in: body.date_in !== undefined ? body.date_in : existing.date_in,
      date_out: body.date_out !== undefined ? (body.date_out || null) : existing.date_out,
    };

    db.prepare(`
      UPDATE job_cards
      SET vehicle_no = ?, customer = ?, work_description = ?, parts_cost = ?, labour_cost = ?, date_in = ?, date_out = ?
      WHERE job_id = ?
    `).run(
      merged.vehicle_no, merged.customer, merged.work_description,
      merged.parts_cost, merged.labour_cost, merged.date_in, merged.date_out,
      req.params.id
    );

    const row = db.prepare(`SELECT * FROM job_cards WHERE job_id = ?`).get(req.params.id);
    res.json({ data: withDerivedFields(row) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update this job card. Please try again.' });
  }
});

// ---- DELETE /api/jobcards/:id ----
app.delete('/api/jobcards/:id', (req, res) => {
  try {
    const existing = db.prepare(`SELECT * FROM job_cards WHERE job_id = ?`).get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: `Job card ${req.params.id} was not found.` });
    }
    db.prepare(`DELETE FROM job_cards WHERE job_id = ?`).run(req.params.id);
    res.json({ data: { job_id: req.params.id, deleted: true } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete this job card. Please try again.' });
  }
});

app.listen(PORT, () => {
  console.log(`Vehicle Job Register running at http://localhost:${PORT}`);
});
