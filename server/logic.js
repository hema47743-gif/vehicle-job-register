// logic.js
// Validation rules and derived-value calculations, kept in one place so that
// "total" and "status" can never be calculated two different ways in two places.

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validates incoming job card data (used for both create and update).
 * Returns { valid: boolean, errors: { field: message } }
 */
function validateJobCard(data, { partial = false } = {}) {
  const errors = {};

  const has = (key) => Object.prototype.hasOwnProperty.call(data, key) && data[key] !== undefined;

  // vehicle_no - required, simple non-empty check
  if (!partial || has('vehicle_no')) {
    if (!data.vehicle_no || typeof data.vehicle_no !== 'string' || !data.vehicle_no.trim()) {
      errors.vehicle_no = 'Vehicle number is required.';
    }
  }

  // customer - required
  if (!partial || has('customer')) {
    if (!data.customer || typeof data.customer !== 'string' || !data.customer.trim()) {
      errors.customer = 'Customer name is required.';
    }
  }

  // work_description - optional, but if given must be a string
  if (has('work_description') && data.work_description !== null && typeof data.work_description !== 'string') {
    errors.work_description = 'Work description must be text.';
  }

  // parts_cost - optional but if present must be a non-negative number
  if (has('parts_cost') && data.parts_cost !== null) {
    const n = Number(data.parts_cost);
    if (Number.isNaN(n) || n < 0) {
      errors.parts_cost = 'Parts cost must be a number that is 0 or greater.';
    }
  }

  // labour_cost - optional but if present must be a non-negative number
  if (has('labour_cost') && data.labour_cost !== null) {
    const n = Number(data.labour_cost);
    if (Number.isNaN(n) || n < 0) {
      errors.labour_cost = 'Labour cost must be a number that is 0 or greater.';
    }
  }

  // date_in - required, must be YYYY-MM-DD
  if (!partial || has('date_in')) {
    if (!data.date_in || !DATE_RE.test(data.date_in) || Number.isNaN(Date.parse(data.date_in))) {
      errors.date_in = 'Date in is required and must be a valid date (YYYY-MM-DD).';
    }
  }

  // date_out - optional, must be valid date and not before date_in
  if (has('date_out') && data.date_out !== null && data.date_out !== '') {
    if (!DATE_RE.test(data.date_out) || Number.isNaN(Date.parse(data.date_out))) {
      errors.date_out = 'Date out must be a valid date (YYYY-MM-DD).';
    } else if (data.date_in && Date.parse(data.date_out) < Date.parse(data.date_in)) {
      errors.date_out = 'Date out cannot be earlier than date in.';
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * Given a raw DB row, attaches derived fields: total, billing_complete,
 * days_in_shop, and status. This is recalculated fresh every time a record
 * is read, so it is always consistent with the underlying data (Task 3).
 */
function withDerivedFields(row) {
  const partsCost = row.parts_cost === null || row.parts_cost === undefined ? null : Number(row.parts_cost);
  const labourCost = row.labour_cost === null || row.labour_cost === undefined ? null : Number(row.labour_cost);

  const billingComplete = partsCost !== null && labourCost !== null;
  const total = (partsCost || 0) + (labourCost || 0);

  const dateIn = new Date(row.date_in);
  const endDate = row.date_out ? new Date(row.date_out) : new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysInShop = Math.max(0, Math.round((endDate - dateIn) / msPerDay));

  let status;
  if (row.date_out) {
    status = 'Completed';
  } else if (daysInShop > 3) {
    status = 'Overdue';
  } else {
    status = 'In Progress';
  }

  return {
    ...row,
    parts_cost: partsCost,
    labour_cost: labourCost,
    total,
    billing_complete: billingComplete,
    days_in_shop: daysInShop,
    status,
  };
}

module.exports = { validateJobCard, withDerivedFields };
