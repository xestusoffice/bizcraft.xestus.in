/**
 * Xestus BizCraft - Security, Input Sanitization & Regulatory Validation Engine
 * 100% Client-Side Shield. Zero Server Exploits. Defends against XSS, Injection & Malformed Data.
 */

/**
 * Escapes unsafe HTML characters to strictly prevent Cross-Site Scripting (XSS).
 * Safe to insert into innerHTML.
 */
export function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Strips all script tags and HTML markup entirely for plain text safety.
 */
export function stripHTML(str) {
  if (!str) return '';
  return String(str).replace(/<[^>]*>?/gm, '');
}

/**
 * Cleans string for safe filenames during file downloads (PDF, JSON, PNG, CSV).
 */
export function sanitizeFilename(filename, defaultName = 'document') {
  if (!filename) return defaultName;
  const clean = filename.replace(/[^a-zA-Z0-9_\-\.]/g, '_').replace(/_+/g, '_');
  return clean.slice(0, 80) || defaultName;
}

/**
 * Validates Indian GSTIN format:
 * 2 digits (state code) + 5 letters (PAN) + 4 digits + 1 letter + 1 entity num + 'Z' + 1 checksum
 */
export function validateGSTIN(gstin) {
  if (!gstin) return { valid: true, error: null }; // Optional
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  const clean = gstin.trim().toUpperCase();
  const valid = regex.test(clean);
  return {
    valid,
    error: valid ? null : 'Invalid GSTIN format (e.g. 27AABCT3518Q1Z4)'
  };
}

/**
 * Validates Indian Permanent Account Number (PAN):
 * 5 uppercase letters + 4 digits + 1 uppercase letter
 */
export function validatePAN(pan) {
  if (!pan) return { valid: true, error: null }; // Optional
  const regex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  const clean = pan.trim().toUpperCase();
  const valid = regex.test(clean);
  return {
    valid,
    error: valid ? null : 'Invalid PAN format (e.g. ABCDE1234F)'
  };
}

/**
 * Validates Indian Bank IFSC Code:
 * 4 letters (Bank code) + 0 + 6 alphanumeric characters
 */
export function validateIFSC(ifsc) {
  if (!ifsc) return { valid: true, error: null };
  const regex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  const clean = ifsc.trim().toUpperCase();
  const valid = regex.test(clean);
  return {
    valid,
    error: valid ? null : 'Invalid IFSC format (e.g. HDFC0001234)'
  };
}

/**
 * Validates UPI Virtual Payment Address (VPA):
 * alphanumeric.hyphen.underscore@bankhandle
 */
export function validateUPI(vpa) {
  if (!vpa) return { valid: false, error: 'UPI ID is required' };
  const regex = /^[a-zA-Z0-9.\-_]{2,64}@[a-zA-Z0-9]{2,32}$/;
  const clean = vpa.trim().toLowerCase();
  const valid = regex.test(clean);
  return {
    valid,
    error: valid ? null : 'Invalid UPI ID format (e.g. merchant@upi or user@okaxis)'
  };
}
