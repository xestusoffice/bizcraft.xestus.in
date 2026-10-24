/**
 * Xestus BizCraft - Salary Slip & Payment Voucher Generator
 * Calculates Gross, Deductions, Net Salary, and Net Pay in words.
 * Fully sanitized and secure against XSS.
 */

import { Storage } from './storage.js';
import { amountInWords, formatCurrencyNumber } from './number-to-words.js';
import { escapeHTML } from './security.js';

let slipState = {
  viewMode: 'slip', // 'slip' or 'voucher'
  companyName: 'Xestus Media LLP',
  companyAddress: 'Suite 404, Tech Park, Powai, Mumbai - 400076',
  payPeriod: 'October 2026',

  // Employee
  employeeName: 'Rahul Verma',
  employeeId: 'XES-204',
  designation: 'Senior Frontend Engineer',
  department: 'Engineering',
  doj: '2023-04-15',
  bankName: 'HDFC Bank',
  bankAcc: '50200088991122',
  ifsc: 'HDFC0001234',
  pan: 'ABCDE9876Q',
  uan: '100987654321',

  workingDays: 31,
  daysWorked: 31,

  // Earnings
  earnings: {
    basic: 45000,
    hra: 22500,
    special: 15000,
    conveyance: 1600,
    medical: 1250,
    bonus: 5000
  },

  // Deductions
  deductions: {
    pf: 1800,
    profTax: 200,
    tds: 3500,
    esi: 0,
    other: 0
  },

  // Voucher Fields
  voucher: {
    voucherNo: 'PV-2026-042',
    date: new Date().toISOString().slice(0, 10),
    paidTo: 'Apex Cloud Solutions',
    amount: 14500,
    category: 'Cloud Hosting & Infrastructure',
    mode: 'Online Transfer',
    narration: 'Monthly AWS production cluster and storage charges'
  }
};

export function initSalaryModule() {
  const savedSlip = Storage.getDraft('SALARY_DRAFT');
  if (savedSlip) {
    slipState = { ...slipState, ...savedSlip };
  } else {
    const profile = Storage.getBusinessProfile();
    if (profile) {
      if (profile.name) slipState.companyName = profile.name;
      if (profile.address) slipState.companyAddress = profile.address;
    }
  }

  bindSalaryEvents();
  renderSalaryControls();
  renderSalaryPreview();
}

function renderSalaryControls() {
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val !== undefined ? val : '';
  };

  setVal('slip-company-name', slipState.companyName);
  setVal('slip-company-addr', slipState.companyAddress);
  setVal('slip-period', slipState.payPeriod);

  setVal('slip-emp-name', slipState.employeeName);
  setVal('slip-emp-id', slipState.employeeId);
  setVal('slip-emp-designation', slipState.designation);
  setVal('slip-emp-dept', slipState.department);
  setVal('slip-emp-doj', slipState.doj);
  setVal('slip-emp-bank', slipState.bankName);
  setVal('slip-emp-acc', slipState.bankAcc);
  setVal('slip-emp-ifsc', slipState.ifsc);
  setVal('slip-emp-pan', slipState.pan);
  setVal('slip-emp-uan', slipState.uan);

  setVal('slip-working-days', slipState.workingDays);
  setVal('slip-days-worked', slipState.daysWorked);

  // Earnings
  setVal('slip-earn-basic', slipState.earnings.basic);
  setVal('slip-earn-hra', slipState.earnings.hra);
  setVal('slip-earn-special', slipState.earnings.special);
  setVal('slip-earn-conveyance', slipState.earnings.conveyance);
  setVal('slip-earn-bonus', slipState.earnings.bonus);

  // Deductions
  setVal('slip-ded-pf', slipState.deductions.pf);
  setVal('slip-ded-pt', slipState.deductions.profTax);
  setVal('slip-ded-tds', slipState.deductions.tds);
  setVal('slip-ded-other', slipState.deductions.other);

  // Voucher
  setVal('vouch-no', slipState.voucher.voucherNo);
  setVal('vouch-date', slipState.voucher.date);
  setVal('vouch-paid-to', slipState.voucher.paidTo);
  setVal('vouch-amount', slipState.voucher.amount);
  setVal('vouch-category', slipState.voucher.category);
  setVal('vouch-mode', slipState.voucher.mode);
  setVal('vouch-narration', slipState.voucher.narration);
}

function bindSalaryEvents() {
  const form = document.getElementById('salary-builder-form');
  if (!form) return;

  const handleInput = () => {
    slipState.companyName = document.getElementById('slip-company-name')?.value || '';
    slipState.companyAddress = document.getElementById('slip-company-addr')?.value || '';
    slipState.payPeriod = document.getElementById('slip-period')?.value || '';

    slipState.employeeName = document.getElementById('slip-emp-name')?.value || '';
    slipState.employeeId = document.getElementById('slip-emp-id')?.value || '';
    slipState.designation = document.getElementById('slip-emp-designation')?.value || '';
    slipState.department = document.getElementById('slip-emp-dept')?.value || '';
    slipState.doj = document.getElementById('slip-emp-doj')?.value || '';
    slipState.bankName = document.getElementById('slip-emp-bank')?.value || '';
    slipState.bankAcc = document.getElementById('slip-emp-acc')?.value || '';
    slipState.ifsc = document.getElementById('slip-emp-ifsc')?.value || '';
    slipState.pan = document.getElementById('slip-emp-pan')?.value || '';
    slipState.uan = document.getElementById('slip-emp-uan')?.value || '';

    slipState.workingDays = parseInt(document.getElementById('slip-working-days')?.value, 10) || 30;
    slipState.daysWorked = parseInt(document.getElementById('slip-days-worked')?.value, 10) || 30;

    slipState.earnings.basic = parseFloat(document.getElementById('slip-earn-basic')?.value) || 0;
    slipState.earnings.hra = parseFloat(document.getElementById('slip-earn-hra')?.value) || 0;
    slipState.earnings.special = parseFloat(document.getElementById('slip-earn-special')?.value) || 0;
    slipState.earnings.conveyance = parseFloat(document.getElementById('slip-earn-conveyance')?.value) || 0;
    slipState.earnings.bonus = parseFloat(document.getElementById('slip-earn-bonus')?.value) || 0;

    slipState.deductions.pf = parseFloat(document.getElementById('slip-ded-pf')?.value) || 0;
    slipState.deductions.profTax = parseFloat(document.getElementById('slip-ded-pt')?.value) || 0;
    slipState.deductions.tds = parseFloat(document.getElementById('slip-ded-tds')?.value) || 0;
    slipState.deductions.other = parseFloat(document.getElementById('slip-ded-other')?.value) || 0;

    // Voucher
    slipState.voucher.voucherNo = document.getElementById('vouch-no')?.value || '';
    slipState.voucher.date = document.getElementById('vouch-date')?.value || '';
    slipState.voucher.paidTo = document.getElementById('vouch-paid-to')?.value || '';
    slipState.voucher.amount = parseFloat(document.getElementById('vouch-amount')?.value) || 0;
    slipState.voucher.category = document.getElementById('vouch-category')?.value || '';
    slipState.voucher.mode = document.getElementById('vouch-mode')?.value || '';
    slipState.voucher.narration = document.getElementById('vouch-narration')?.value || '';

    renderSalaryPreview();
    Storage.saveDraft('SALARY_DRAFT', slipState);
  };

  form.addEventListener('input', handleInput);
  form.addEventListener('change', handleInput);

  // Toggle Mode button (Payslip vs Payment Voucher)
  const modeToggles = document.querySelectorAll('.slip-mode-btn');
  modeToggles.forEach(btn => {
    btn.onclick = () => {
      slipState.viewMode = btn.dataset.mode;
      modeToggles.forEach(b => b.classList.toggle('active', b.dataset.mode === slipState.viewMode));
      document.getElementById('payslip-fields-section')?.style.setProperty('display', slipState.viewMode === 'slip' ? 'block' : 'none');
      document.getElementById('voucher-fields-section')?.style.setProperty('display', slipState.viewMode === 'voucher' ? 'block' : 'none');
      renderSalaryPreview();
    };
  });

  // Print button
  const printBtn = document.getElementById('slip-print-btn');
  if (printBtn) {
    printBtn.onclick = () => {
      window.print();
    };
  }
}

export function renderSalaryPreview() {
  const container = document.getElementById('salary-preview-container');
  if (!container) return;

  if (slipState.viewMode === 'voucher') {
    container.innerHTML = createVoucherHTML();
  } else {
    container.innerHTML = createPayslipHTML();
  }
}

function createPayslipHTML() {
  let gross = 0;
  for (let key in slipState.earnings) {
    gross += Number(slipState.earnings[key]) || 0;
  }

  let totalDeductions = 0;
  for (let key in slipState.deductions) {
    totalDeductions += Number(slipState.deductions[key]) || 0;
  }

  const netPay = gross - totalDeductions;
  const netInWords = amountInWords(netPay, 'INR');

  return `
    <div class="payslip-paper">
      <div class="payslip-header">
        <div class="payslip-company-name">${escapeHTML(slipState.companyName || 'Your Company Name')}</div>
        <div class="payslip-company-addr">${escapeHTML(slipState.companyAddress || 'Company Address')}</div>
        <div class="payslip-badge-title">Salary Payslip for ${escapeHTML(slipState.payPeriod || 'Current Month')}</div>
      </div>

      <div class="payslip-emp-grid">
        <div class="emp-info-row"><span class="lbl">Employee Name:</span><span class="val">${escapeHTML(slipState.employeeName)}</span></div>
        <div class="emp-info-row"><span class="lbl">Employee ID:</span><span class="val">${escapeHTML(slipState.employeeId)}</span></div>
        <div class="emp-info-row"><span class="lbl">Designation:</span><span class="val">${escapeHTML(slipState.designation)}</span></div>
        <div class="emp-info-row"><span class="lbl">Department:</span><span class="val">${escapeHTML(slipState.department)}</span></div>
        <div class="emp-info-row"><span class="lbl">Date of Joining:</span><span class="val">${escapeHTML(slipState.doj)}</span></div>
        <div class="emp-info-row"><span class="lbl">Bank Name:</span><span class="val">${escapeHTML(slipState.bankName)}</span></div>
        <div class="emp-info-row"><span class="lbl">Bank Account:</span><span class="val">${escapeHTML(slipState.bankAcc)}</span></div>
        <div class="emp-info-row"><span class="lbl">IFSC Code:</span><span class="val">${escapeHTML(slipState.ifsc)}</span></div>
        <div class="emp-info-row"><span class="lbl">PAN:</span><span class="val">${escapeHTML(slipState.pan)}</span></div>
        <div class="emp-info-row"><span class="lbl">UAN (PF):</span><span class="val">${escapeHTML(slipState.uan)}</span></div>
        <div class="emp-info-row"><span class="lbl">Days in Month:</span><span class="val">${slipState.workingDays}</span></div>
        <div class="emp-info-row"><span class="lbl">Paid Days:</span><span class="val">${slipState.daysWorked}</span></div>
      </div>

      <table class="payslip-calc-table">
        <thead>
          <tr>
            <th style="width: 32%;">Earnings</th>
            <th class="num" style="width: 18%;">Amount (₹)</th>
            <th style="width: 32%;">Deductions</th>
            <th class="num" style="width: 18%;">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Basic Salary</td>
            <td class="num">${formatCurrencyNumber(slipState.earnings.basic, 'INR')}</td>
            <td>Provident Fund (PF)</td>
            <td class="num">${formatCurrencyNumber(slipState.deductions.pf, 'INR')}</td>
          </tr>
          <tr>
            <td>House Rent Allowance (HRA)</td>
            <td class="num">${formatCurrencyNumber(slipState.earnings.hra, 'INR')}</td>
            <td>Professional Tax (PT)</td>
            <td class="num">${formatCurrencyNumber(slipState.deductions.profTax, 'INR')}</td>
          </tr>
          <tr>
            <td>Special Allowance</td>
            <td class="num">${formatCurrencyNumber(slipState.earnings.special, 'INR')}</td>
            <td>Income Tax / TDS</td>
            <td class="num">${formatCurrencyNumber(slipState.deductions.tds, 'INR')}</td>
          </tr>
          <tr>
            <td>Conveyance Allowance</td>
            <td class="num">${formatCurrencyNumber(slipState.earnings.conveyance, 'INR')}</td>
            <td>Loan / Other Deductions</td>
            <td class="num">${formatCurrencyNumber(slipState.deductions.other, 'INR')}</td>
          </tr>
          <tr>
            <td>Performance Bonus / Variable</td>
            <td class="num">${formatCurrencyNumber(slipState.earnings.bonus, 'INR')}</td>
            <td>-</td>
            <td class="num">-</td>
          </tr>
          <tr class="subtotal-row">
            <td>Gross Earnings</td>
            <td class="num">₹ ${formatCurrencyNumber(gross, 'INR')}</td>
            <td>Total Deductions</td>
            <td class="num">₹ ${formatCurrencyNumber(totalDeductions, 'INR')}</td>
          </tr>
        </tbody>
      </table>

      <div class="payslip-net-box">
        <div>
          <div class="net-lbl">Net Salary Payable</div>
          <div style="font-size: 0.8rem; color: #047857;">Transferred to Bank Account</div>
        </div>
        <div class="net-val">₹ ${formatCurrencyNumber(netPay, 'INR')}</div>
      </div>

      <div class="payslip-words">
        <strong>Amount in words:</strong> ${netInWords}
      </div>

      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; padding-top: 20px; border-top: 1px solid #cbd5e1;">
        <div style="text-align: center; width: 180px;">
          <div style="height: 40px;"></div>
          <div style="border-top: 1px solid #0f172a; font-weight: 700; font-size: 0.8rem;">Employee Signature</div>
        </div>
        <div style="font-size: 0.72rem; color: #64748b; text-align: center; max-width: 250px;">
          This is a computer-generated salary slip and requires no physical seal if verified.
        </div>
        <div style="text-align: center; width: 180px;">
          <div style="height: 40px;"></div>
          <div style="border-top: 1px solid #0f172a; font-weight: 700; font-size: 0.8rem;">Authorized Signatory</div>
          <div style="font-size: 0.72rem; color: #64748b;">${escapeHTML(slipState.companyName)}</div>
        </div>
      </div>
    </div>
  `;
}

function createVoucherHTML() {
  const v = slipState.voucher;
  const amtFormatted = formatCurrencyNumber(v.amount, 'INR');
  const amtWords = amountInWords(v.amount, 'INR');

  return `
    <div class="voucher-paper">
      <div class="voucher-header">
        <div>
          <div style="font-size: 1.1rem; font-weight: 800;">${escapeHTML(slipState.companyName)}</div>
          <div class="voucher-title">PAYMENT VOUCHER</div>
        </div>
        <div class="voucher-meta">
          <div>Voucher No: <strong>${escapeHTML(v.voucherNo)}</strong></div>
          <div>Date: <strong>${escapeHTML(v.date)}</strong></div>
        </div>
      </div>

      <div class="voucher-field-grid">
        <div class="lbl">Paid To:</div>
        <div class="val-line"><strong>${escapeHTML(v.paidTo)}</strong></div>

        <div class="lbl">Amount:</div>
        <div class="val-line" style="font-size: 1.15rem; font-family: var(--font-mono);">
          <strong>₹ ${amtFormatted}</strong>
        </div>

        <div class="lbl">In Words:</div>
        <div class="val-line">${amtWords}</div>

        <div class="lbl">Debit Head:</div>
        <div class="val-line">${escapeHTML(v.category)}</div>

        <div class="lbl">Payment Mode:</div>
        <div class="val-line">${escapeHTML(v.mode)}</div>

        <div class="lbl">Narration / Notes:</div>
        <div class="val-line">${escapeHTML(v.narration)}</div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 48px; text-align: center; font-size: 0.78rem;">
        <div>
          <div style="height: 45px;"></div>
          <div style="border-top: 1px solid #0f172a; font-weight: 700;">Prepared By</div>
        </div>
        <div>
          <div style="height: 45px;"></div>
          <div style="border-top: 1px solid #0f172a; font-weight: 700;">Checked By</div>
        </div>
        <div>
          <div style="height: 45px;"></div>
          <div style="border-top: 1px solid #0f172a; font-weight: 700;">Authorized Signatory</div>
        </div>
        <div>
          <div style="height: 45px;"></div>
          <div style="border-top: 1px solid #0f172a; font-weight: 700;">Receiver's Signature</div>
        </div>
      </div>
    </div>
  `;
}
