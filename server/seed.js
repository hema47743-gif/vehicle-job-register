// seed.js
// Populates the database with ~20 realistic job card records for Task 1.
// Run with: npm run seed
//
// Deliberately includes awkward cases needed for Task 4 testing:
//   - JC-2026-009 : missing parts_cost (NULL)              -> "missing value"
//   - JC-2026-004 : date_in far in the past (2019)          -> "unusually old date"
//   - JC-2026-013 : missing work_description (NULL/blank)   -> "missing value"
//   - "Rajesh Kumar" appears twice (JC-2026-002, JC-2026-017) -> "duplicate name"

const db = require('./db');

const records = [
  ['JC-2026-001', 'TN22AB1234', 'Priya Sundaram',   'Engine oil change + oil filter replacement', 850,  300, '2026-07-01', '2026-07-01'],
  ['JC-2026-002', 'TN09CD5678', 'Rajesh Kumar',     'Front brake pad replacement',                 1600, 500, '2026-07-02', '2026-07-03'],
  ['JC-2026-003', 'TN10EF4321', 'Anitha Raman',     'Full car service (oil, filters, coolant top-up)', 2200, 900, '2026-07-03', '2026-07-04'],
  ['JC-2026-004', 'TN01GH1111', 'Suresh Babu',      'Clutch plate replacement',                    3200, 1200, '2019-03-15', '2019-03-18'],
  ['JC-2026-005', 'TN22IJ2222', 'Meena Iyer',       'AC gas refill + AC filter clean',              1100, 400, '2026-07-05', '2026-07-05'],
  ['JC-2026-006', 'TN07KL3333', 'Vignesh Pandian',  'Battery replacement',                          4200, 200, '2026-07-06', '2026-07-06'],
  ['JC-2026-007', 'TN33MN4444', 'Deepa Krishnan',   'Wheel alignment + balancing',                  0,    600, '2026-07-07', '2026-07-07'],
  ['JC-2026-008', 'TN14OP5555', 'Karthik Subramani','Radiator leak repair',                         1800, 700, '2026-07-08', null],
  ['JC-2026-009', 'TN22QR6666', 'Lakshmi Narayan',  'Suspension noise check and bush replacement',  null, 500, '2026-07-09', null],
  ['JC-2026-010', 'TN66ST7777', 'Arun Prakash',     'Headlight assembly replacement',               2600, 400, '2026-07-10', '2026-07-11'],
  ['JC-2026-011', 'TN19UV8888', 'Divya Bharathi',   'Timing belt replacement',                      3500, 1500, '2026-07-11', '2026-07-13'],
  ['JC-2026-012', 'TN05WX9999', 'Naveen Kumar',     'Puncture repair + tyre rotation',               400,  150, '2026-07-12', '2026-07-12'],
  ['JC-2026-013', 'TN22YZ0001', 'Sowmya Ramesh',    null,                                            1200, 300, '2026-07-13', null],
  ['JC-2026-014', 'TN45AA0002', 'Ramesh Gopal',     'Gearbox oil change',                            900,  350, '2026-07-14', '2026-07-14'],
  ['JC-2026-015', 'TN22BB0003', 'Kavya Selvam',     'AC compressor replacement',                     6500, 1800, '2026-07-15', '2026-07-17'],
  ['JC-2026-016', 'TN08CC0004', 'Manoj Verma',      'Horn and indicator relay repair',               350,  200, '2026-07-16', '2026-07-16'],
  ['JC-2026-017', 'TN22DD0005', 'Rajesh Kumar',     'Second visit: coolant leak fix',                700,  400, '2026-07-18', '2026-07-18'],
  ['JC-2026-018', 'TN31EE0006', 'Harini Chandran',  'Full body wash and interior detailing',         0,    800, '2026-07-19', '2026-07-19'],
  ['JC-2026-019', 'TN22FF0007', 'Bala Subramaniam', 'Exhaust silencer replacement',                  2100, 500, '2026-07-20', null],
  ['JC-2026-020', 'TN17GG0008', 'Nithya Menon',     'Fuel pump replacement',                         4800, 900, '2026-07-21', '2026-07-23'],
];

const insert = db.prepare(`
  INSERT OR REPLACE INTO job_cards
    (job_id, vehicle_no, customer, work_description, parts_cost, labour_cost, date_in, date_out)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

db.exec('BEGIN');
for (const r of records) {
  insert.run(...r);
}
db.exec('COMMIT');

console.log(`Seeded ${records.length} job card records into jobcards.db`);
