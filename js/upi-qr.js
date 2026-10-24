/**
 * Xestus BizCraft - Dynamic UPI QR Studio
 * Generates NPCI-compliant UPI deep links, custom branded QR codes, and Counter Display Standees.
 */

import { Storage } from './storage.js';
import { formatCurrencyNumber } from './number-to-words.js';

let upiState = {
  vpa: 'xestus@okaxis',
  name: 'Xestus Media LLP',
  amount: '',
  note: 'Service Payment',
  mcc: '',
  colorDark: '#0f172a',
  colorLight: '#ffffff',
  centerLogo: 'upi', // 'upi', 'gpay', 'phonepe', 'custom'
  customLogoUrl: ''
};

export function initUPIModule() {
  const saved = Storage.getDraft('UPI_DRAFT');
  if (saved) {
    upiState = { ...upiState, ...saved };
  } else {
    const profile = Storage.getBusinessProfile();
    if (profile) {
      if (profile.bank && profile.bank.upiId) upiState.vpa = profile.bank.upiId;
      if (profile.name) upiState.name = profile.name;
    }
  }

  bindUPIEvents();
  renderUPIControls();
  generateUPIQRCode();
}

function renderUPIControls() {
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val !== undefined ? val : '';
  };

  setVal('upi-vpa-input', upiState.vpa);
  setVal('upi-name-input', upiState.name);
  setVal('upi-amount-input', upiState.amount);
  setVal('upi-note-input', upiState.note);

  // Update active color swatch
  document.querySelectorAll('.color-swatch-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.color === upiState.colorDark);
  });
}

function bindUPIEvents() {
  const form = document.getElementById('upi-builder-form');
  if (!form) return;

  const handleInput = () => {
    upiState.vpa = document.getElementById('upi-vpa-input')?.value.trim() || '';
    upiState.name = document.getElementById('upi-name-input')?.value.trim() || '';
    upiState.amount = document.getElementById('upi-amount-input')?.value.trim() || '';
    upiState.note = document.getElementById('upi-note-input')?.value.trim() || '';

    generateUPIQRCode();
    Storage.saveDraft('UPI_DRAFT', upiState);
  };

  form.addEventListener('input', handleInput);

  // Preset chips
  document.querySelectorAll('.preset-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const amt = chip.dataset.amount;
      const amtInput = document.getElementById('upi-amount-input');
      if (amtInput) {
        amtInput.value = amt;
        upiState.amount = amt;
        generateUPIQRCode();
        Storage.saveDraft('UPI_DRAFT', upiState);
      }
    });
  });

  // Color swatches
  document.querySelectorAll('.color-swatch-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      upiState.colorDark = btn.dataset.color;
      document.querySelectorAll('.color-swatch-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      generateUPIQRCode();
      Storage.saveDraft('UPI_DRAFT', upiState);
    });
  });

  // Download PNG button
  const dlBtn = document.getElementById('upi-download-png-btn');
  if (dlBtn) {
    dlBtn.onclick = () => downloadUPIPNG();
  }

  // Copy Link button
  const copyBtn = document.getElementById('upi-copy-link-btn');
  if (copyBtn) {
    copyBtn.onclick = () => {
      const link = buildUPIURL();
      navigator.clipboard.writeText(link).then(() => {
        if (window.showToast) window.showToast('UPI Payment Link copied to clipboard!', 'success');
        if (window.confetti) window.confetti({ particleCount: 30 });
      });
    };
  }

  // Print Standee button
  const standeeBtn = document.getElementById('upi-print-standee-btn');
  if (standeeBtn) {
    standeeBtn.onclick = () => {
      document.body.classList.add('print-standee-mode');
      window.print();
      setTimeout(() => {
        document.body.classList.remove('print-standee-mode');
      }, 1000);
    };
  }
}

export function buildUPIURL() {
  const vpa = encodeURIComponent(upiState.vpa || 'merchant@upi');
  const name = encodeURIComponent(upiState.name || 'Merchant');
  let url = `upi://pay?pa=${vpa}&pn=${name}&cu=INR`;

  if (upiState.amount && Number(upiState.amount) > 0) {
    url += `&am=${encodeURIComponent(upiState.amount)}`;
  }
  if (upiState.note) {
    url += `&tn=${encodeURIComponent(upiState.note)}`;
  }
  if (upiState.mcc) {
    url += `&mc=${encodeURIComponent(upiState.mcc)}`;
  }
  return url;
}

export function generateUPIQRCode() {
  const canvas = document.getElementById('upi-qr-canvas');
  if (!canvas || !window.QRCode) return;

  const upiUrl = buildUPIURL();

  window.QRCode.drawToCanvas(canvas, upiUrl, {
    width: 250,
    height: 250,
    colorDark: upiState.colorDark || '#0f172a',
    colorLight: '#ffffff',
    quietZone: 2
  });

  // Also update Standee canvas
  const standeeCanvas = document.getElementById('standee-qr-canvas');
  if (standeeCanvas) {
    window.QRCode.drawToCanvas(standeeCanvas, upiUrl, {
      width: 240,
      height: 240,
      colorDark: upiState.colorDark || '#0f172a',
      colorLight: '#ffffff',
      quietZone: 2
    });
  }

  // Update Preview Labels
  const nameEl = document.getElementById('upi-preview-name');
  if (nameEl) nameEl.textContent = upiState.name || 'Business Name';

  const vpaEl = document.getElementById('upi-preview-vpa');
  if (vpaEl) vpaEl.textContent = upiState.vpa || 'vpa@upi';

  const amtEl = document.getElementById('upi-preview-amount');
  if (amtEl) {
    if (upiState.amount && Number(upiState.amount) > 0) {
      amtEl.textContent = `₹ ${formatCurrencyNumber(upiState.amount, 'INR')}`;
      amtEl.style.display = 'block';
    } else {
      amtEl.style.display = 'none';
    }
  }

  // Update Standee Labels
  const standeeName = document.getElementById('standee-val-name');
  if (standeeName) standeeName.textContent = upiState.name || 'Business / Store Name';

  const standeeVpa = document.getElementById('standee-val-vpa');
  if (standeeVpa) standeeVpa.textContent = upiState.vpa || 'vpa@upi';
}

function downloadUPIPNG() {
  const canvas = document.getElementById('upi-qr-canvas');
  if (!canvas) return;

  // Render high-res 1024x1024 offscreen canvas for crisp printing
  const highResCanvas = document.createElement('canvas');
  highResCanvas.width = 1024;
  highResCanvas.height = 1024;

  const upiUrl = buildUPIURL();
  window.QRCode.drawToCanvas(highResCanvas, upiUrl, {
    width: 1024,
    height: 1024,
    colorDark: upiState.colorDark || '#0f172a',
    colorLight: '#ffffff',
    quietZone: 3
  });

  const a = document.createElement('a');
  a.href = highResCanvas.toDataURL('image/png');
  a.download = `UPI_QR_${(upiState.name || 'merchant').replace(/\s+/g, '_')}_${Date.now()}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  if (window.showToast) window.showToast('High-Resolution QR Code downloaded (1024x1024)!', 'success');
  if (window.confetti) window.confetti({ particleCount: 40 });
}
