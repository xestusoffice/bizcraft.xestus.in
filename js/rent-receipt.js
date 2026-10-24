/**
 * Xestus BizCraft - Rent Receipt (HRA Tax Exemption) Generator
 * Full compliance with Section 10(13A) of the Income Tax Act.
 * Single Month & 12-Month Batch generation with simulated revenue stamp.
 * XSS sanitized and secured.
 */

import { Storage } from './storage.js';
import { amountInWords, formatCurrencyNumber } from './number-to-words.js';
import { escapeHTML } from './security.js';

let rentState = {
  tenantName: 'Siddharth Sharma',
  landlordName: 'Rajesh K. Mehta',
  landlordPan: 'ABCDE1234F',
  propertyAddress: 'Flat 402, Green Acres Heights, Hiranandani Gardens, Powai, Mumbai - 400076',
  monthlyRent: 35000,
  paymentMode: 'Online Bank Transfer / UPI',
  paymentRef: 'UPI-TXN-984712',
  generationMode: 'single',
  singleMonth: 'October 2026',
  financialYear: '2026-27'
};

const MONTHS_FY = [
  'April', 'May', 'June', 'July', 'August', 'September',
  'October', 'November', 'December', 'January', 'February', 'March'
];

export function initRentModule() {
  const saved = Storage.getDraft('RENT_DRAFT');
  if (saved) {
    rentState = { ...rentState, ...saved };
  }

  bindRentEvents();
  renderRentControls();
  renderRentPreview();
}

function renderRentControls() {
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val !== undefined ? val : '';
  };

  setVal('rent-tenant-name', rentState.tenantName);
  setVal('rent-landlord-name', rentState.landlordName);
  setVal('rent-landlord-pan', rentState.landlordPan);
  setVal('rent-property-address', rentState.propertyAddress);
  setVal('rent-amount', rentState.monthlyRent);
  setVal('rent-payment-mode', rentState.paymentMode);
  setVal('rent-payment-ref', rentState.paymentRef);
  setVal('rent-mode-select', rentState.generationMode);
  setVal('rent-single-month', rentState.singleMonth);
}

function bindRentEvents() {
  const form = document.getElementById('rent-builder-form');
  if (!form) return;

  const handleInput = () => {
    rentState.tenantName = document.getElementById('rent-tenant-name')?.value.trim() || '';
    rentState.landlordName = document.getElementById('rent-landlord-name')?.value.trim() || '';
    rentState.landlordPan = document.getElementById('rent-landlord-pan')?.value.trim().toUpperCase() || '';
    rentState.propertyAddress = document.getElementById('rent-property-address')?.value.trim() || '';
    rentState.monthlyRent = parseFloat(document.getElementById('rent-amount')?.value) || 0;
    rentState.paymentMode = document.getElementById('rent-payment-mode')?.value.trim() || '';
    rentState.paymentRef = document.getElementById('rent-payment-ref')?.value.trim() || '';
    rentState.generationMode = document.getElementById('rent-mode-select')?.value || 'single';
    rentState.singleMonth = document.getElementById('rent-single-month')?.value.trim() || 'October 2026';

    renderRentPreview();
    Storage.saveDraft('RENT_DRAFT', rentState);
  };

  form.addEventListener('input', handleInput);
  form.addEventListener('change', handleInput);

  // Print button
  const printBtn = document.getElementById('rent-print-btn');
  if (printBtn) {
    printBtn.onclick = () => {
      window.print();
    };
  }
}

export function renderRentPreview() {
  const container = document.getElementById('rent-receipts-preview-container');
  if (!container) return;

  // Check PAN rule (> ₹1 Lakh annually = ₹8,333/month)
  const annualRent = rentState.monthlyRent * 12;
  const panBanner = document.getElementById('rent-pan-warning');
  if (panBanner) {
    if (annualRent > 100000 && !rentState.landlordPan) {
      panBanner.style.display = 'flex';
    } else {
      panBanner.style.display = 'none';
    }
  }

  container.innerHTML = '';

  if (rentState.generationMode === 'single') {
    container.appendChild(createReceiptElement(rentState.singleMonth, 1));
  } else {
    // Generate 12 months for the FY
    const startYear = parseInt(rentState.financialYear.split('-')[0], 10) || 2026;
    MONTHS_FY.forEach((month, index) => {
      const year = index < 9 ? startYear : startYear + 1;
      const periodLabel = `${month} ${year}`;
      container.appendChild(createReceiptElement(periodLabel, index + 1));
    });
  }
}

function createReceiptElement(periodString, receiptNo) {
  const receipt = document.createElement('div');
  receipt.className = 'rent-receipt-sheet';

  const rentFormatted = formatCurrencyNumber(rentState.monthlyRent, 'INR');
  const rentInWords = amountInWords(rentState.monthlyRent, 'INR');
  const receiptCode = `RR-${new Date().getFullYear()}-${String(receiptNo).padStart(3, '0')}`;

  receipt.innerHTML = `
    <div class="rent-receipt-title">RENT RECEIPT</div>
    <div class="rent-receipt-period">Receipt No: <strong>${receiptCode}</strong> &bull; Period: <strong>${escapeHTML(periodString)}</strong></div>

    <div class="rent-receipt-body-text">
      Received a sum of <span class="highlight">₹ ${rentFormatted}</span>
      (<strong>${rentInWords}</strong>) from <span class="highlight">${escapeHTML(rentState.tenantName || 'Tenant Name')}</span>
      towards rent for the residential premises located at <span class="highlight">${escapeHTML(rentState.propertyAddress || 'Address')}</span>
      for the month of <strong>${escapeHTML(periodString)}</strong>.
      Payment was received via <span class="highlight">${escapeHTML(rentState.paymentMode || 'Online Bank Transfer')}</span>
      ${rentState.paymentRef ? `(Ref/Transaction No: <strong>${escapeHTML(rentState.paymentRef)}</strong>)` : ''}.
    </div>

    <div class="rent-receipt-footer">
      <div class="rent-receipt-landlord-info">
        <strong>${escapeHTML(rentState.landlordName || 'Landlord Name')}</strong>
        <div>Owner / Landlord</div>
        ${rentState.landlordPan ? `<div>PAN: <strong style="font-family: var(--font-mono);">${escapeHTML(rentState.landlordPan)}</strong></div>` : '<div style="color: #64748b;">(PAN not provided)</div>'}
        <div style="font-size: 0.78rem; color: #64748b; margin-top: 4px;">Date: End of ${escapeHTML(periodString)}</div>
      </div>

      <div class="revenue-stamp-box">
        <div class="revenue-stamp-inner">
          <div class="stamp-header">India Revenue</div>
          <div class="stamp-value">₹1</div>
          <div class="stamp-sub">One Rupee</div>
          <div class="stamp-cross-signature"></div>
        </div>
        <div style="font-size: 0.65rem; color: #64748b; margin-top: 4px;">Landlord Signature</div>
      </div>
    </div>
  `;

  return receipt;
}
