/**
 * Xestus BizCraft - Invoice & Quotation Engine
 * Complete GST & Non-GST calculations, live preview synchronization, QR embedding.
 * Fully sanitized against XSS attacks, supports CSV export, WhatsApp sharing, and demo presets.
 */

import { Storage } from './storage.js';
import { amountInWords, formatCurrencyNumber, getCurrencySymbol } from './number-to-words.js';
import { escapeHTML, sanitizeFilename } from './security.js';

const DEMO_PRESET = {
  template: 'apex-modern',
  docType: 'TAX INVOICE',
  invoiceNo: 'INV-2026-089',
  invoiceDate: new Date().toISOString().slice(0, 10),
  dueDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
  poNo: 'PO-XES-9921',
  currency: 'INR',
  taxType: 'intra',
  reverseCharge: 'No',

  seller: {
    name: 'Xestus Media LLP',
    gstin: '27AABCT3518Q1Z4',
    pan: 'AABCT3518Q',
    email: 'contact@xestus.in',
    phone: '+91 98765 43210',
    address: 'Suite 404, Tech Park, Powai',
    cityState: 'Mumbai, Maharashtra - 400076',
    stateCode: '27'
  },

  client: {
    name: 'Acme Technologies Pvt Ltd',
    gstin: '27AAACA9876R1Z2',
    pan: 'AAACA9876R',
    email: 'billing@acmetech.io',
    phone: '+91 99887 76655',
    billingAddress: 'Tower B, Cyber City, Phase 2, Gurugram, Haryana - 122002',
    shippingAddress: 'Tower B, Cyber City, Phase 2, Gurugram, Haryana - 122002',
    sameShipping: true
  },

  items: [
    {
      id: 1,
      description: 'Cloud Infrastructure & High Availability Setup',
      hsn: '998313',
      qty: 1,
      unit: 'Job',
      rate: 45000,
      discount: 0,
      gstRate: 18
    },
    {
      id: 2,
      description: 'UX Architecture & Design System Implementation',
      hsn: '998314',
      qty: 1,
      unit: 'Service',
      rate: 35000,
      discount: 5,
      gstRate: 18
    },
    {
      id: 3,
      description: 'Enterprise API Security Hardening & Zero-Trust Audit',
      hsn: '998319',
      qty: 2,
      unit: 'Audit',
      rate: 22000,
      discount: 10,
      gstRate: 18
    }
  ],

  charges: {
    shipping: 1200,
    shippingGst: 18,
    extraDiscount: 0,
    roundOff: true
  },

  bank: {
    bankName: 'HDFC Bank',
    accountName: 'Xestus Media LLP',
    accountNo: '50200012345678',
    ifsc: 'HDFC0001234',
    branch: 'Powai Central',
    upiId: 'xestus@hdfcbank'
  },

  terms: '1. Payment is due within 15 days of invoice date.\n2. Please mention invoice number in payment transfer remarks.\n3. Make all payments to the specified bank account or scan the verified UPI QR code.',
  signatory: 'Authorized Signatory',
  signatureUrl: '',
  logoUrl: ''
};

let invoiceState = JSON.parse(JSON.stringify(DEMO_PRESET));

export function getInvoiceState() {
  return invoiceState;
}

export function setInvoiceState(newState) {
  invoiceState = { ...invoiceState, ...newState };
  renderEditor();
  calculateAndRenderPreview();
  Storage.saveDraft('INVOICE_DRAFT', invoiceState);
}

export function initInvoiceModule() {
  const savedDraft = Storage.getDraft('INVOICE_DRAFT');
  if (savedDraft) {
    invoiceState = { ...invoiceState, ...savedDraft };
  } else {
    const profile = Storage.getBusinessProfile();
    if (profile) {
      invoiceState.seller = { ...invoiceState.seller, ...profile };
      if (profile.bank) invoiceState.bank = { ...invoiceState.bank, ...profile.bank };
      if (profile.logoUrl) invoiceState.logoUrl = profile.logoUrl;
      if (profile.signatureUrl) invoiceState.signatureUrl = profile.signatureUrl;
    }
  }

  renderEditor();
  bindEditorEvents();
  calculateAndRenderPreview();
}

function renderEditor() {
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val !== undefined ? val : '';
  };

  setVal('inv-doc-type', invoiceState.docType);
  setVal('inv-number', invoiceState.invoiceNo);
  setVal('inv-date', invoiceState.invoiceDate);
  setVal('inv-due-date', invoiceState.dueDate);
  setVal('inv-po-no', invoiceState.poNo);
  setVal('inv-currency', invoiceState.currency);
  setVal('inv-tax-type', invoiceState.taxType);
  setVal('inv-template-select', invoiceState.template);

  // Seller
  setVal('inv-seller-name', invoiceState.seller.name);
  setVal('inv-seller-gstin', invoiceState.seller.gstin);
  setVal('inv-seller-pan', invoiceState.seller.pan);
  setVal('inv-seller-email', invoiceState.seller.email);
  setVal('inv-seller-phone', invoiceState.seller.phone);
  setVal('inv-seller-address', invoiceState.seller.address);
  setVal('inv-seller-city-state', invoiceState.seller.cityState);

  // Client
  setVal('inv-client-name', invoiceState.client.name);
  setVal('inv-client-gstin', invoiceState.client.gstin);
  setVal('inv-client-pan', invoiceState.client.pan);
  setVal('inv-client-email', invoiceState.client.email);
  setVal('inv-client-phone', invoiceState.client.phone);
  setVal('inv-client-bill-addr', invoiceState.client.billingAddress);
  setVal('inv-client-ship-addr', invoiceState.client.shippingAddress);

  const sameShip = document.getElementById('inv-same-shipping');
  if (sameShip) sameShip.checked = invoiceState.client.sameShipping;

  // Bank
  setVal('inv-bank-name', invoiceState.bank.bankName);
  setVal('inv-bank-holder', invoiceState.bank.accountName);
  setVal('inv-bank-acc', invoiceState.bank.accountNo);
  setVal('inv-bank-ifsc', invoiceState.bank.ifsc);
  setVal('inv-bank-branch', invoiceState.bank.branch);
  setVal('inv-bank-upi', invoiceState.bank.upiId);

  // Charges & Notes
  setVal('inv-shipping', invoiceState.charges.shipping);
  setVal('inv-extra-discount', invoiceState.charges.extraDiscount);
  setVal('inv-terms', invoiceState.terms);

  renderLineItemsEditor();
}

function renderLineItemsEditor() {
  const container = document.getElementById('inv-line-items-tbody');
  if (!container) return;

  container.innerHTML = '';
  invoiceState.items.forEach((item, index) => {
    const tr = document.createElement('tr');
    tr.className = 'line-item-row';
    tr.innerHTML = `
      <td style="width: 28%;">
        <input type="text" class="form-input item-desc" data-index="${index}" value="${escapeHTML(item.description)}" placeholder="Item description" aria-label="Item Description" />
      </td>
      <td style="width: 14%;">
        <input type="text" class="form-input font-mono item-hsn" data-index="${index}" value="${escapeHTML(item.hsn)}" placeholder="HSN/SAC" aria-label="HSN Code" />
      </td>
      <td style="width: 9%;">
        <input type="number" min="0.01" step="any" class="form-input font-mono item-qty" data-index="${index}" value="${item.qty}" aria-label="Quantity" />
      </td>
      <td style="width: 9%;">
        <input type="text" class="form-input item-unit" data-index="${index}" value="${escapeHTML(item.unit || 'Nos')}" placeholder="Unit" aria-label="Unit" />
      </td>
      <td style="width: 13%;">
        <input type="number" min="0" step="any" class="form-input font-mono item-rate" data-index="${index}" value="${item.rate}" aria-label="Unit Rate" />
      </td>
      <td style="width: 9%;">
        <input type="number" min="0" max="100" step="any" class="form-input font-mono item-disc" data-index="${index}" value="${item.discount || 0}" aria-label="Discount %" placeholder="0" />
      </td>
      <td style="width: 10%;">
        <select class="form-select item-gst" data-index="${index}" aria-label="GST Slab">
          <option value="0" ${item.gstRate === 0 ? 'selected' : ''}>0%</option>
          <option value="5" ${item.gstRate === 5 ? 'selected' : ''}>5%</option>
          <option value="12" ${item.gstRate === 12 ? 'selected' : ''}>12%</option>
          <option value="18" ${item.gstRate === 18 ? 'selected' : ''}>18%</option>
          <option value="28" ${item.gstRate === 28 ? 'selected' : ''}>28%</option>
        </select>
      </td>
      <td style="width: 8%; text-align: center;">
        <button type="button" class="btn-icon btn-sm btn-delete-item" data-index="${index}" title="Remove item" aria-label="Remove item" style="color: var(--rose-500);">
          <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      </td>
    `;
    container.appendChild(tr);
  });
}

function bindEditorEvents() {
  const container = document.getElementById('invoice-builder-form');
  if (!container) return;

  container.addEventListener('input', (e) => {
    handleFieldChange(e.target);
  });

  container.addEventListener('change', (e) => {
    handleFieldChange(e.target);
  });

  // Add Item button
  const addBtn = document.getElementById('inv-add-item-btn');
  if (addBtn) {
    addBtn.onclick = () => {
      invoiceState.items.push({
        id: Date.now(),
        description: 'New Service / Deliverable',
        hsn: '9983',
        qty: 1,
        unit: 'Nos',
        rate: 2500,
        discount: 0,
        gstRate: 18
      });
      renderLineItemsEditor();
      calculateAndRenderPreview();
      Storage.saveDraft('INVOICE_DRAFT', invoiceState);
    };
  }

  // Load Demo Data button
  const demoBtn = document.getElementById('inv-load-demo-btn');
  if (demoBtn) {
    demoBtn.onclick = () => {
      invoiceState = JSON.parse(JSON.stringify(DEMO_PRESET));
      invoiceState.invoiceNo = 'INV-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 900) + 100);
      renderEditor();
      calculateAndRenderPreview();
      Storage.saveDraft('INVOICE_DRAFT', invoiceState);
      if (window.showToast) window.showToast('Loaded verified demo enterprise invoice!', 'success');
    };
  }

  // Export CSV button
  const csvBtn = document.getElementById('inv-export-csv-btn');
  if (csvBtn) {
    csvBtn.onclick = () => exportItemsCSV();
  }

  // WhatsApp Share button
  const waBtn = document.getElementById('inv-share-wa-btn');
  if (waBtn) {
    waBtn.onclick = () => shareOnWhatsApp();
  }

  // Delete Item delegation
  const tbody = document.getElementById('inv-line-items-tbody');
  if (tbody) {
    tbody.onclick = (e) => {
      const btn = e.target.closest('.btn-delete-item');
      if (btn) {
        const idx = parseInt(btn.dataset.index, 10);
        if (invoiceState.items.length > 1) {
          invoiceState.items.splice(idx, 1);
          renderLineItemsEditor();
          calculateAndRenderPreview();
          Storage.saveDraft('INVOICE_DRAFT', invoiceState);
        } else {
          if (window.showToast) window.showToast('An invoice must contain at least one item.', 'error');
        }
      }
    };
  }

  // Logo upload
  const logoInput = document.getElementById('inv-logo-upload');
  if (logoInput) {
    logoInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          invoiceState.logoUrl = evt.target.result;
          calculateAndRenderPreview();
          Storage.saveDraft('INVOICE_DRAFT', invoiceState);
        };
        reader.readAsDataURL(file);
      }
    };
  }

  // Signature upload
  const sigInput = document.getElementById('inv-signature-upload');
  if (sigInput) {
    sigInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          invoiceState.signatureUrl = evt.target.result;
          calculateAndRenderPreview();
          Storage.saveDraft('INVOICE_DRAFT', invoiceState);
        };
        reader.readAsDataURL(file);
      }
    };
  }

  // Same shipping checkbox
  const sameShip = document.getElementById('inv-same-shipping');
  if (sameShip) {
    sameShip.onchange = () => {
      invoiceState.client.sameShipping = sameShip.checked;
      if (sameShip.checked) {
        invoiceState.client.shippingAddress = invoiceState.client.billingAddress;
        const shipInput = document.getElementById('inv-client-ship-addr');
        if (shipInput) shipInput.value = invoiceState.client.billingAddress;
      }
      calculateAndRenderPreview();
    };
  }
}

function handleFieldChange(target) {
  const id = target.id;
  const val = target.value;

  if (target.classList.contains('item-desc')) {
    const idx = parseInt(target.dataset.index, 10);
    invoiceState.items[idx].description = val;
  } else if (target.classList.contains('item-hsn')) {
    const idx = parseInt(target.dataset.index, 10);
    invoiceState.items[idx].hsn = val;
  } else if (target.classList.contains('item-qty')) {
    const idx = parseInt(target.dataset.index, 10);
    invoiceState.items[idx].qty = parseFloat(val) || 0;
  } else if (target.classList.contains('item-unit')) {
    const idx = parseInt(target.dataset.index, 10);
    invoiceState.items[idx].unit = val;
  } else if (target.classList.contains('item-rate')) {
    const idx = parseInt(target.dataset.index, 10);
    invoiceState.items[idx].rate = parseFloat(val) || 0;
  } else if (target.classList.contains('item-disc')) {
    const idx = parseInt(target.dataset.index, 10);
    invoiceState.items[idx].discount = parseFloat(val) || 0;
  } else if (target.classList.contains('item-gst')) {
    const idx = parseInt(target.dataset.index, 10);
    invoiceState.items[idx].gstRate = parseFloat(val) || 0;
  } else {
    switch (id) {
      case 'inv-doc-type': invoiceState.docType = val; break;
      case 'inv-number': invoiceState.invoiceNo = val; break;
      case 'inv-date': invoiceState.invoiceDate = val; break;
      case 'inv-due-date': invoiceState.dueDate = val; break;
      case 'inv-po-no': invoiceState.poNo = val; break;
      case 'inv-currency': invoiceState.currency = val; break;
      case 'inv-tax-type': invoiceState.taxType = val; break;
      case 'inv-template-select': invoiceState.template = val; break;

      case 'inv-seller-name': invoiceState.seller.name = val; break;
      case 'inv-seller-gstin': invoiceState.seller.gstin = val.toUpperCase(); break;
      case 'inv-seller-pan': invoiceState.seller.pan = val.toUpperCase(); break;
      case 'inv-seller-email': invoiceState.seller.email = val; break;
      case 'inv-seller-phone': invoiceState.seller.phone = val; break;
      case 'inv-seller-address': invoiceState.seller.address = val; break;
      case 'inv-seller-city-state': invoiceState.seller.cityState = val; break;

      case 'inv-client-name': invoiceState.client.name = val; break;
      case 'inv-client-gstin': invoiceState.client.gstin = val.toUpperCase(); break;
      case 'inv-client-pan': invoiceState.client.pan = val.toUpperCase(); break;
      case 'inv-client-email': invoiceState.client.email = val; break;
      case 'inv-client-phone': invoiceState.client.phone = val; break;
      case 'inv-client-bill-addr':
        invoiceState.client.billingAddress = val;
        if (invoiceState.client.sameShipping) {
          invoiceState.client.shippingAddress = val;
          const s = document.getElementById('inv-client-ship-addr');
          if (s) s.value = val;
        }
        break;
      case 'inv-client-ship-addr': invoiceState.client.shippingAddress = val; break;

      case 'inv-bank-name': invoiceState.bank.bankName = val; break;
      case 'inv-bank-holder': invoiceState.bank.accountName = val; break;
      case 'inv-bank-acc': invoiceState.bank.accountNo = val; break;
      case 'inv-bank-ifsc': invoiceState.bank.ifsc = val.toUpperCase(); break;
      case 'inv-bank-branch': invoiceState.bank.branch = val; break;
      case 'inv-bank-upi': invoiceState.bank.upiId = val; break;

      case 'inv-shipping': invoiceState.charges.shipping = parseFloat(val) || 0; break;
      case 'inv-extra-discount': invoiceState.charges.extraDiscount = parseFloat(val) || 0; break;
      case 'inv-terms': invoiceState.terms = val; break;
    }
  }

  calculateAndRenderPreview();
  Storage.saveDraft('INVOICE_DRAFT', invoiceState);
}

/**
 * Recalculate all tax amounts & update preview paper with sanitized HTML
 */
export function calculateAndRenderPreview() {
  const curr = invoiceState.currency;
  const sym = getCurrencySymbol(curr);
  const taxType = invoiceState.taxType;

  let totalTaxable = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;

  const computedItems = invoiceState.items.map((item) => {
    const qty = Number(item.qty) || 0;
    const rate = Number(item.rate) || 0;
    const disc = Number(item.discount) || 0;
    const baseVal = qty * rate;
    const discAmount = (baseVal * disc) / 100;
    const taxable = baseVal - discAmount;
    totalTaxable += taxable;

    let cgstRate = 0, sgstRate = 0, igstRate = 0;
    let cgstVal = 0, sgstVal = 0, igstVal = 0;

    if (taxType === 'intra') {
      cgstRate = item.gstRate / 2;
      sgstRate = item.gstRate / 2;
      cgstVal = (taxable * cgstRate) / 100;
      sgstVal = (taxable * sgstRate) / 100;
      totalCGST += cgstVal;
      totalSGST += sgstVal;
    } else if (taxType === 'inter') {
      igstRate = item.gstRate;
      igstVal = (taxable * igstRate) / 100;
      totalIGST += igstVal;
    }

    const itemTotal = taxable + cgstVal + sgstVal + igstVal;
    return {
      ...item,
      taxable,
      cgstVal,
      sgstVal,
      igstVal,
      itemTotal
    };
  });

  const shipping = Number(invoiceState.charges.shipping) || 0;
  const extraDiscount = Number(invoiceState.charges.extraDiscount) || 0;

  let grandTotalExact = totalTaxable + totalCGST + totalSGST + totalIGST + shipping - extraDiscount;
  let roundOffDiff = 0;
  let grandTotal = grandTotalExact;

  if (invoiceState.charges.roundOff) {
    grandTotal = Math.round(grandTotalExact);
    roundOffDiff = Math.round((grandTotal - grandTotalExact) * 100) / 100;
  }

  // Update preview paper DOM safely
  const paper = document.getElementById('invoice-paper-element');
  if (!paper) return;

  paper.className = `document-paper template-${invoiceState.template}`;

  // Doc Type & Meta
  const typeBadge = paper.querySelector('.doc-type-badge');
  if (typeBadge) typeBadge.textContent = invoiceState.docType;

  const setHtml = (selector, html) => {
    const el = paper.querySelector(selector);
    if (el) el.innerHTML = html;
  };
  const setText = (selector, txt) => {
    const el = paper.querySelector(selector);
    if (el) el.textContent = txt;
  };

  // Company / Seller with HTML escaping
  setText('.doc-company-title', invoiceState.seller.name || 'Your Company Name');
  let sellerSub = '';
  if (invoiceState.seller.address) sellerSub += `${escapeHTML(invoiceState.seller.address)}<br/>`;
  if (invoiceState.seller.cityState) sellerSub += `${escapeHTML(invoiceState.seller.cityState)}<br/>`;
  if (invoiceState.seller.gstin) sellerSub += `<strong>GSTIN:</strong> ${escapeHTML(invoiceState.seller.gstin)} | `;
  if (invoiceState.seller.pan) sellerSub += `<strong>PAN:</strong> ${escapeHTML(invoiceState.seller.pan)}<br/>`;
  if (invoiceState.seller.email || invoiceState.seller.phone) {
    sellerSub += `${escapeHTML(invoiceState.seller.email)} &bull; ${escapeHTML(invoiceState.seller.phone)}`;
  }
  setHtml('.doc-company-sub', sellerSub);

  // Logo
  const logoEl = paper.querySelector('.doc-brand-logo');
  if (logoEl) {
    if (invoiceState.logoUrl) {
      logoEl.src = invoiceState.logoUrl;
      logoEl.style.display = 'block';
    } else {
      logoEl.style.display = 'none';
    }
  }

  // Meta Table
  setText('.doc-val-inv-no', invoiceState.invoiceNo || 'INV-001');
  setText('.doc-val-inv-date', invoiceState.invoiceDate || '');
  setText('.doc-val-due-date', invoiceState.dueDate || '');
  setText('.doc-val-po-no', invoiceState.poNo || 'N/A');

  // Parties
  setText('.doc-val-client-name', invoiceState.client.name || 'Client Name');
  let clientAddr = `${escapeHTML(invoiceState.client.billingAddress || '')}<br/>`;
  if (invoiceState.client.gstin) clientAddr += `<strong>GSTIN:</strong> ${escapeHTML(invoiceState.client.gstin)}<br/>`;
  if (invoiceState.client.pan) clientAddr += `<strong>PAN:</strong> ${escapeHTML(invoiceState.client.pan)}<br/>`;
  if (invoiceState.client.email) clientAddr += `${escapeHTML(invoiceState.client.email)}`;
  setHtml('.doc-val-client-details', clientAddr);

  setText('.doc-val-ship-name', invoiceState.client.name || 'Client Name');
  setHtml('.doc-val-ship-details', `${escapeHTML(invoiceState.client.shippingAddress || invoiceState.client.billingAddress || '')}`);

  // Items Table Header and Rows
  const itemsTbody = paper.querySelector('.doc-items-tbody');
  const itemsThead = paper.querySelector('.doc-items-thead');

  if (itemsThead) {
    let theadHtml = `
      <tr>
        <th style="width: 5%;">#</th>
        <th style="width: 38%;">Item & Description</th>
        <th style="width: 12%;">HSN/SAC</th>
        <th class="num" style="width: 8%;">Qty</th>
        <th class="num" style="width: 12%;">Rate (${sym})</th>
    `;
    if (taxType === 'intra') {
      theadHtml += `
        <th class="num" style="width: 12%;">CGST</th>
        <th class="num" style="width: 12%;">SGST</th>
      `;
    } else if (taxType === 'inter') {
      theadHtml += `<th class="num" style="width: 14%;">IGST</th>`;
    }
    theadHtml += `<th class="num" style="width: 14%;">Amount (${sym})</th></tr>`;
    itemsThead.innerHTML = theadHtml;
  }

  if (itemsTbody) {
    itemsTbody.innerHTML = '';
    computedItems.forEach((item, i) => {
      const tr = document.createElement('tr');
      let rowHtml = `
        <td>${i + 1}</td>
        <td>
          <div class="doc-item-desc">${escapeHTML(item.description)}</div>
        </td>
        <td style="font-family: var(--font-mono); font-size: 0.82rem;">${escapeHTML(item.hsn || '-')}</td>
        <td class="num">${item.qty} ${escapeHTML(item.unit || '')}</td>
        <td class="num">${formatCurrencyNumber(item.rate, curr)}</td>
      `;
      if (taxType === 'intra') {
        rowHtml += `
          <td class="num" style="font-size: 0.8rem;">
            ${formatCurrencyNumber(item.cgstVal, curr)}<br/><span style="color:#64748b; font-size: 0.72rem;">(${item.gstRate / 2}%)</span>
          </td>
          <td class="num" style="font-size: 0.8rem;">
            ${formatCurrencyNumber(item.sgstVal, curr)}<br/><span style="color:#64748b; font-size: 0.72rem;">(${item.gstRate / 2}%)</span>
          </td>
        `;
      } else if (taxType === 'inter') {
        rowHtml += `
          <td class="num" style="font-size: 0.8rem;">
            ${formatCurrencyNumber(item.igstVal, curr)}<br/><span style="color:#64748b; font-size: 0.72rem;">(${item.gstRate}%)</span>
          </td>
        `;
      }
      rowHtml += `<td class="num"><strong>${formatCurrencyNumber(item.itemTotal, curr)}</strong></td>`;
      tr.innerHTML = rowHtml;
      itemsTbody.appendChild(tr);
    });
  }

  // Totals Table
  const totalsTable = paper.querySelector('.doc-totals-table');
  if (totalsTable) {
    let totalsHtml = `
      <tr>
        <td>Taxable Subtotal:</td>
        <td class="num">${sym} ${formatCurrencyNumber(totalTaxable, curr)}</td>
      </tr>
    `;
    if (taxType === 'intra') {
      totalsHtml += `
        <tr>
          <td>CGST:</td>
          <td class="num">${sym} ${formatCurrencyNumber(totalCGST, curr)}</td>
        </tr>
        <tr>
          <td>SGST:</td>
          <td class="num">${sym} ${formatCurrencyNumber(totalSGST, curr)}</td>
        </tr>
      `;
    } else if (taxType === 'inter') {
      totalsHtml += `
        <tr>
          <td>IGST:</td>
          <td class="num">${sym} ${formatCurrencyNumber(totalIGST, curr)}</td>
        </tr>
      `;
    }

    if (shipping > 0) {
      totalsHtml += `
        <tr>
          <td>Shipping / Freight:</td>
          <td class="num">${sym} ${formatCurrencyNumber(shipping, curr)}</td>
        </tr>
      `;
    }

    if (extraDiscount > 0) {
      totalsHtml += `
        <tr>
          <td>Discount:</td>
          <td class="num" style="color: var(--rose-500);">- ${sym} ${formatCurrencyNumber(extraDiscount, curr)}</td>
        </tr>
      `;
    }

    if (roundOffDiff !== 0) {
      totalsHtml += `
        <tr>
          <td>Round Off:</td>
          <td class="num">${roundOffDiff > 0 ? '+' : ''}${sym} ${formatCurrencyNumber(roundOffDiff, curr)}</td>
        </tr>
      `;
    }

    totalsHtml += `
      <tr class="total-row">
        <td>Total Payable:</td>
        <td class="num">${sym} ${formatCurrencyNumber(grandTotal, curr)}</td>
      </tr>
    `;
    totalsTable.innerHTML = totalsHtml;
  }

  // Amount in Words
  const wordsEl = paper.querySelector('.doc-amount-words-text');
  if (wordsEl) {
    wordsEl.textContent = amountInWords(grandTotal, curr);
  }

  // Bank Info
  setText('.doc-val-bank-name', invoiceState.bank.bankName || 'N/A');
  setText('.doc-val-bank-holder', invoiceState.bank.accountName || invoiceState.seller.name || 'N/A');
  setText('.doc-val-bank-acc', invoiceState.bank.accountNo || 'N/A');
  setText('.doc-val-bank-ifsc', invoiceState.bank.ifsc || 'N/A');
  setText('.doc-val-bank-branch', invoiceState.bank.branch || 'N/A');
  setText('.doc-val-bank-upi', invoiceState.bank.upiId || 'N/A');

  // Terms
  const termsEl = paper.querySelector('.doc-terms-content');
  if (termsEl) termsEl.innerText = invoiceState.terms || 'N/A';

  // Signature
  setText('.doc-val-signatory-name', invoiceState.seller.name || 'Authorized Signatory');
  const sigImg = paper.querySelector('.doc-signature-img');
  if (sigImg) {
    if (invoiceState.signatureUrl) {
      sigImg.src = invoiceState.signatureUrl;
      sigImg.style.display = 'inline-block';
    } else {
      sigImg.style.display = 'none';
    }
  }

  // Render QR Code in Preview
  renderInvoiceUPIQRCode(grandTotal);
}

function renderInvoiceUPIQRCode(amount) {
  const canvas = document.getElementById('doc-upi-qr-canvas');
  if (!canvas || !window.QRCode) return;

  const vpa = invoiceState.bank.upiId;
  const name = encodeURIComponent(invoiceState.seller.name || 'Merchant');
  const note = encodeURIComponent(`Invoice ${invoiceState.invoiceNo}`);

  if (vpa && vpa.includes('@')) {
    const upiUrl = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${name}&am=${amount}&cu=INR&tn=${note}`;
    window.QRCode.drawToCanvas(canvas, upiUrl, {
      width: 160,
      height: 160,
      colorDark: '#0f172a',
      colorLight: '#ffffff',
      quietZone: 1
    });
    canvas.parentElement.style.display = 'flex';
  } else {
    canvas.parentElement.style.display = 'none';
  }
}

/**
 * Export Line Items as CSV
 */
function exportItemsCSV() {
  const headers = ['Item Description', 'HSN/SAC', 'Quantity', 'Unit', 'Rate', 'Discount %', 'GST Rate %', 'Taxable Value', 'Total'];
  const rows = invoiceState.items.map(item => {
    const qty = Number(item.qty) || 0;
    const rate = Number(item.rate) || 0;
    const disc = Number(item.discount) || 0;
    const baseVal = qty * rate;
    const taxable = baseVal * (1 - disc / 100);
    const tax = (taxable * (item.gstRate || 0)) / 100;
    return [
      `"${(item.description || '').replace(/"/g, '""')}"`,
      `"${item.hsn || ''}"`,
      qty,
      `"${item.unit || ''}"`,
      rate,
      disc,
      item.gstRate,
      taxable.toFixed(2),
      (taxable + tax).toFixed(2)
    ];
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const a = document.createElement('a');
  a.href = encodedUri;
  a.download = `${sanitizeFilename(invoiceState.invoiceNo, 'invoice')}_items.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  if (window.showToast) window.showToast('Line items exported to CSV spreadsheet!', 'success');
}

/**
 * Share Invoice via WhatsApp
 */
function shareOnWhatsApp() {
  const inv = invoiceState;
  const total = calculateTotalAmount(inv);
  const text = `*Invoice: ${inv.invoiceNo}*\nFrom: ${inv.seller.name}\nBilled To: ${inv.client.name}\nTotal Amount: ₹${formatCurrencyNumber(total, 'INR')}\nDue Date: ${inv.dueDate}\nPay via UPI: ${inv.bank.upiId || 'Contact for details'}\n\nGenerated with Xestus BizCraft: https://bizcraft.xestus.in/`;

  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

export function calculateTotalAmount(inv) {
  let total = 0;
  inv.items.forEach(item => {
    const qty = Number(item.qty) || 0;
    const rate = Number(item.rate) || 0;
    const disc = Number(item.discount) || 0;
    const taxable = (qty * rate) * (1 - disc / 100);
    const tax = inv.taxType === 'none' ? 0 : (taxable * (item.gstRate || 0)) / 100;
    total += taxable + tax;
  });
  total += Number(inv.charges?.shipping || 0);
  total -= Number(inv.charges?.extraDiscount || 0);
  return inv.charges?.roundOff ? Math.round(total) : total;
}
