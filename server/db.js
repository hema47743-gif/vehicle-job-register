// db.js
// Sets up the SQLite database using Node's built-in node:sqlite module
// (available from Node 22.5+, no external native dependency needed).

const path = require('node:path');
const fs = require('node:fs');
const { DatabaseSync } = require('node:sqlite');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'jobcards.db');

const db = new DatabaseSync(DB_PATH);

// ---- Schema ----
// job_id            : unique job card number, e.g. JC-2026-001
// vehicle_no        : registration number of the vehicle
// customer          : name of the customer
// work_description  : free text describing the work carried out
// parts_cost        : cost of parts used (can be 0, can be missing/NULL if not yet billed)
// labour_cost       : cost of labour (can be 0, can be missing/NULL if not yet billed)
// date_in           : date the vehicle came in (YYYY-MM-DD)
// date_out          : date the vehicle was returned to the customer (YYYY-MM-DD), NULL if still in progress
//
// total and status are NOT stored — they are DERIVED on every read/write so they can
// never go out of sync with the underlying data (see task4 "recalculate automatically").
db.exec(`
  CREATE TABLE IF NOT EXISTS job_cards (
    job_id           TEXT PRIMARY KEY,
    vehicle_no        TEXT NOT NULL,
    customer          TEXT NOT NULL,
    work_description  TEXT,
    parts_cost        REAL,
    labour_cost       REAL,
    date_in           TEXT NOT NULL,
    date_out          TEXT
  );
`);

module.exports = db;
