/**
 * Xestus BizCraft - Main Application Orchestrator
 * Pure Vanilla JS, Modular Architecture, 100% Client-Side.
 * Includes FAQ toggles, legal compliance modals, and PWA registration.
 */

import { Storage } from './storage.js';
import { initInvoiceModule, getInvoiceState, setInvoiceState, calculateTotalAmount } from './invoice.js';
import { initUPIModule } from './upi-qr.js';
import { initRentModule } from './rent-receipt.js';
import { initSalaryModule } from './salary-slip.js';
import { triggerPrint } from './pdf-export.js';
import { formatCurrencyNumber } from './number-to-words.js';

// Global toast system
window.showToast = function(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: `<svg width="18" height="18" fill="none" stroke="#10b981" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>`,
    error: `<svg width="18" height="18" fill="none" stroke="#f43f5e" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6m0-6l6 6"/></svg>`,
    info: `<svg width="18" height="18" fill="none" stroke="#6366f1" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></svg>`
  };

  toast.innerHTML = `
    ${iconMap[type] || iconMap.info}
    <div style="flex: 1; font-weight: 500;">${message}</div>
    <button style="background: none; border: none; color: inherit; cursor: pointer; opacity: 0.6; font-size: 1.1rem;" aria-label="Close Toast" onclick="this.parentElement.remove()">&times;</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 250);
  }, 4000);
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  setupTheme();
  setupTabRouting();
  setupPrintButtons();
  setupPWA();
  setupFAQ();
  setupLegalModals();

  // Initialize child modules
  initInvoiceModule();
  initUPIModule();
  initRentModule();
  initSalaryModule();
  initVaultModule();

  updatePrivacyStatus();
});

/* --------------------------------------------------------------------------
   THEME TOGGLE
   -------------------------------------------------------------------------- */
function setupTheme() {
  const savedTheme = Storage.getTheme();
  document.documentElement.setAttribute('data-theme', savedTheme);

  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  if (themeToggleBtn) {
    updateThemeIcon(savedTheme);
    themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      Storage.setTheme(next);
      updateThemeIcon(next);
      window.showToast(`Switched to ${next.toUpperCase()} mode`, 'info');
    });
  }
}

function updateThemeIcon(theme) {
  const iconContainer = document.getElementById('theme-icon-container');
  if (!iconContainer) return;
  if (theme === 'dark') {
    iconContainer.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`;
  } else {
    iconContainer.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>`;
  }
}

/* --------------------------------------------------------------------------
   TAB ROUTING
   -------------------------------------------------------------------------- */
/* --------------------------------------------------------------------------
   SEO ROUTE CONFIGURATION & DEEP LINK ARCHITECTURE
   Enables indexing for Googlebot, direct linking, and dynamic title/meta sync.
   -------------------------------------------------------------------------- */
const ROUTE_CONFIG = {
  invoice: {
    hash: 'gst-invoice-generator',
    aliases: ['invoice', 'gst-invoice-generator', 'gst-invoice', 'invoices', 'quotation', 'estimate'],
    title: 'Free GST Invoice Generator Online • Tax Invoices & Quotations | Xestus BizCraft',
    description: 'Generate 100% compliant GST tax invoices, proforma bills, and quotations with automated CGST, SGST, IGST calculations, live UPI QR codes, and instant A4 PDF download.',
    keywords: 'gst invoice generator, online invoice maker india, free gst bill format, intra-state cgst sgst calculator, quotation estimate generator, private client side invoice, pdf invoice download',
    canonical: 'https://bizcraft.xestus.in/gst-invoice-generator.html'
  },
  upi: {
    hash: 'upi-qr-generator',
    aliases: ['upi', 'upi-qr-generator', 'upi-qr', 'dynamic-upi-qr', 'payment-qr', 'qr-code'],
    title: 'Dynamic UPI QR Code Generator with Logo & Amount • NPCI Compliant | Xestus BizCraft',
    description: 'Create dynamic UPI QR codes with custom amount, payee name, transaction notes, and color themes. Download high-resolution PNG (1024x1024) or print tabletop counter standees for GPay, PhonePe, and Paytm.',
    keywords: 'upi qr code generator, dynamic upi qr with amount, printable upi counter standee, npci upi qr generator, gpay phonepe qr code, download upi qr png, merchant payment qr',
    canonical: 'https://bizcraft.xestus.in/upi-qr-generator.html'
  },
  rent: {
    hash: 'rent-receipt-generator',
    aliases: ['rent', 'rent-receipt-generator', 'rent-receipt', 'hra-rent-receipt', 'hra', 'rent-receipts'],
    title: 'HRA Rent Receipt Generator Online • Free 12-Month Batch PDF | Xestus BizCraft',
    description: 'Generate legally compliant HRA rent receipts for income tax exemption under Section 10(13A). Supports single month and 12-month batch financial year receipts with revenue stamps and Landlord PAN.',
    keywords: 'hra rent receipt generator, rent receipt for income tax exemption, section 10 13a rent receipt, 12 month rent receipt pdf, landlord pan rent receipt, rent receipt online download, free rent receipt maker',
    canonical: 'https://bizcraft.xestus.in/rent-receipt-generator.html'
  },
  salary: {
    hash: 'salary-slip-generator',
    aliases: ['salary', 'salary-slip-generator', 'salary-slip', 'payslip', 'payslip-generator', 'salary-slips', 'payment-voucher', 'voucher'],
    title: 'Free Salary Slip Generator Online • Employee Payslip & Payment Voucher Maker | Xestus BizCraft',
    description: 'Create corporate salary payslips and payment vouchers with automated Basic, HRA, PF, Professional Tax, TDS deductions, and Net Pay in words. Instant PDF download.',
    keywords: 'salary slip generator, payslip maker online, free salary slip excel pdf, employee pay slip generator, payment voucher maker, hra basic pf calculator, hr payslip template',
    canonical: 'https://bizcraft.xestus.in/salary-slip-generator.html'
  },
  vault: {
    hash: 'vault',
    aliases: ['vault', 'encrypted-vault', 'storage', 'backup', 'offline-vault'],
    title: 'Offline Encrypted Vault • Private Client-Side Business Data Storage | Xestus BizCraft',
    description: 'Secure, zero-cloud encrypted client-side storage vault. Manage saved invoices, rent receipts, and salary slips with zero telemetry. Export and import JSON backups.',
    keywords: 'private invoice vault, client side business data storage, offline accounting records, zero cloud business vault, encrypted local storage',
    canonical: 'https://bizcraft.xestus.in/vault.html'
  }
};

export function switchTab(targetTab, updateHistory = true) {
  const config = ROUTE_CONFIG[targetTab] || ROUTE_CONFIG.invoice;
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-content-pane');

  tabBtns.forEach(b => {
    b.classList.toggle('active', b.dataset.tab === targetTab);
  });

  tabPanes.forEach(p => {
    p.style.display = 'none';
  });

  const targetPane = document.getElementById(`tab-pane-${targetTab}`);
  if (targetPane) {
    targetPane.style.display = 'block';
  }

  // Update dynamic SEO metadata in head
  document.title = config.title;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', config.description);
  const metaKeywords = document.querySelector('meta[name="keywords"]');
  if (metaKeywords) metaKeywords.setAttribute('content', config.keywords);
  const metaOgTitle = document.querySelector('meta[property="og:title"]');
  if (metaOgTitle) metaOgTitle.setAttribute('content', config.title);
  const metaOgDesc = document.querySelector('meta[property="og:description"]');
  if (metaOgDesc) metaOgDesc.setAttribute('content', config.description);
  const canonicalEl = document.querySelector('link[rel="canonical"]');
  if (canonicalEl) canonicalEl.setAttribute('href', config.canonical);

  if (targetTab === 'vault') {
    renderVault();
  }

  if (updateHistory) {
    try {
      history.pushState({ tab: targetTab }, config.title, `#${config.hash}`);
    } catch (e) {
      window.location.hash = config.hash;
    }
  }
}

function resolveTabFromSlug(slug) {
  if (!slug) return null;
  const clean = slug.toLowerCase().replace(/^[#/?]+/, '').split('?')[0].split('&')[0];
  for (const [tabKey, cfg] of Object.entries(ROUTE_CONFIG)) {
    if (cfg.aliases.includes(clean)) {
      return tabKey;
    }
  }
  return null;
}

function setupTabRouting() {
  const tabBtns = document.querySelectorAll('.tab-btn');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab(btn.dataset.tab, true);
    });
  });

  // Handle URL hash changes & browser Back / Forward buttons
  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.tab) {
      switchTab(e.state.tab, false);
    } else {
      initRouteFromURL(false);
    }
  });

  window.addEventListener('hashchange', () => {
    initRouteFromURL(false);
  });

  // Resolve initial route from hash, query param, or pathname
  initRouteFromURL(false);
}

function initRouteFromURL(updateHistory = false) {
  const searchParams = new URLSearchParams(window.location.search);
  const queryTool = searchParams.get('tool') || searchParams.get('tab');
  const hash = window.location.hash;
  const path = window.location.pathname;

  let matched = resolveTabFromSlug(queryTool) || resolveTabFromSlug(hash) || resolveTabFromSlug(path);

  // If path or hash requested payment voucher directly, switch sub-mode
  if (hash.includes('voucher') || path.includes('voucher')) {
    matched = 'salary';
    setTimeout(() => {
      const voucherBtn = document.querySelector('.slip-mode-btn[data-mode="voucher"]');
      if (voucherBtn) voucherBtn.click();
    }, 50);
  }

  if (matched) {
    switchTab(matched, updateHistory);
  } else {
    // Default to invoice
    switchTab('invoice', false);
  }
}

/* --------------------------------------------------------------------------
   PRINT CONTROLS
   -------------------------------------------------------------------------- */
function setupPrintButtons() {
  document.querySelectorAll('.btn-trigger-print').forEach(btn => {
    btn.addEventListener('click', () => {
      triggerPrint();
    });
  });
}

/* --------------------------------------------------------------------------
   PRIVACY BADGE & STORAGE CAPACITY
   -------------------------------------------------------------------------- */
function updatePrivacyStatus() {
  const stats = Storage.getStorageStats();
  const meterText = document.getElementById('vault-meter-text');
  if (meterText) {
    meterText.textContent = `${stats.formatted} • ${stats.recordCount} records saved`;
  }
}

/* --------------------------------------------------------------------------
   FAQ ACCORDION
   -------------------------------------------------------------------------- */
function setupFAQ() {
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      item.classList.toggle('open');
      const isOpen = item.classList.contains('open');
      btn.setAttribute('aria-expanded', isOpen);
    });
  });
}

/* --------------------------------------------------------------------------
   LEGAL MODALS (Privacy, Terms, Disclaimer, About) - Essential for AdSense
   -------------------------------------------------------------------------- */
function setupLegalModals() {
  const modal = document.getElementById('legal-modal');
  const modalTitle = document.getElementById('legal-modal-title');
  const modalBody = document.getElementById('legal-modal-body');
  const modalClose = document.getElementById('legal-modal-close');

  if (!modal) return;

  const legalContent = {
    privacy: {
      title: 'Privacy Policy & Zero-Data Telemetry Guarantee',
      content: `
        <p><strong>Effective Date:</strong> October 2026 | <strong>Website:</strong> https://bizcraft.xestus.in/</p>
        <br/>
        <h4>1. 100% In-Browser Client-Side Processing</h4>
        <p>Xestus BizCraft is engineered under a strict Zero-Cloud, Privacy-First architecture. When you enter customer names, GST numbers, PAN details, bank accounts, or financial figures, <strong>no data is transmitted to our servers or any third-party clouds</strong>. All calculations, QR generation, PDF formatting, and preview renderings happen strictly inside your browser's local sandbox memory.</p>
        <br/>
        <h4>2. Local Storage Usage</h4>
        <p>We use standard HTML5 <code>LocalStorage</code> exclusively on your device to remember your drafts, business profile, and theme preference so that you don't lose work when refreshing the page. This data never leaves your computer or smartphone.</p>
        <br/>
        <h4>3. Zero Cookies & Zero Personal Tracking</h4>
        <p>Xestus BizCraft does not use tracking cookies, analytics pixels, or biometric profiling. You can verify this at any time by opening your browser's Network Inspector (F12) and observing that zero outbound network payload packets are dispatched during invoice creation.</p>
        <br/>
        <h4>4. Your Right to Clear & Export Data</h4>
        <p>You maintain 100% sovereignty over your data. You can download an encrypted JSON backup at any time via the Vault tab, or permanently wipe all locally saved records with a single click.</p>
      `
    },
    terms: {
      title: 'Terms of Service & Usage Agreement',
      content: `
        <p><strong>Last Updated:</strong> October 2026</p>
        <br/>
        <h4>1. Acceptance of Terms</h4>
        <p>By accessing or utilizing Xestus BizCraft (https://bizcraft.xestus.in/), you agree to abide by these Terms of Service. If you disagree with any portion of these terms, you should discontinue use of the utility suite.</p>
        <br/>
        <h4>2. Permitted Use & Commercial License</h4>
        <p>Xestus BizCraft is provided as a client-side productivity tool. You are permitted to generate invoices, payment QR codes, rent receipts, and salary payslips for your legitimate personal, freelance, and corporate business operations without paying licensing royalties.</p>
        <br/>
        <h4>3. User Responsibility & Accuracy</h4>
        <p>You are solely responsible for verifying the accuracy of tax rates, HSN/SAC codes, PAN/GSTIN numbers, and calculation formulas generated on your documents before issuing them to clients, statutory bodies, or financial institutions.</p>
        <br/>
        <h4>4. Limitation of Liability</h4>
        <p>In no event shall Xestus, its founders, or contributors be liable for any indirect, punitive, or consequential damages resulting from document generation or reliance on the software.</p>
      `
    },
    disclaimer: {
      title: 'Legal, Tax & Financial Disclaimer',
      content: `
        <h4>Not Financial or Registered Tax Advice</h4>
        <p>The calculations, receipts, and invoices generated by Xestus BizCraft are intended solely for clerical and productivity assistance. Xestus BizCraft is not a Chartered Accountancy firm, legal counsel, or registered tax advisory service.</p>
        <br/>
        <h4>Tax Compliance & Regulatory Verification</h4>
        <p>Tax laws, including the Goods & Services Tax (GST) Act and Section 10(13A) of the Income Tax Act 1961, are subject to government amendments and jurisdictional interpretation. Users must ensure that their PAN disclosures, HRA claims, reverse charge mechanisms, and tax filings comply with prevailing regulations and consult a qualified tax professional where appropriate.</p>
      `
    },
    about: {
      title: 'About Xestus & Contact Information',
      content: `
        <h4>Mission</h4>
        <p>Xestus BizCraft was built to deliver enterprise-grade business software that respects user privacy. While modern web apps upload sensitive financial records to external cloud databases, BizCraft runs 100% inside your browser.</p>
        <br/>
        <h4>Technology & Standards</h4>
        <p>Crafted using modern Vanilla JavaScript, CSS Design Tokens, and Progressive Web App standards. Compliant with NPCI UPI deep linking specifications and Indian Income Tax regulations.</p>
        <br/>
        <h4>Contact & Inquiries</h4>
        <p>For corporate partnerships, bug reports, or feature requests, contact us at:</p>
        <p><strong>Email:</strong> <a href="mailto:contact@xestus.in">contact@xestus.in</a></p>
        <p><strong>Official Website:</strong> <a href="https://bizcraft.xestus.in/" target="_blank" rel="noopener noreferrer">https://bizcraft.xestus.in/</a></p>
      `
    }
  };

  document.querySelectorAll('.open-legal-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const type = link.dataset.legal;
      const data = legalContent[type];
      if (data) {
        modalTitle.textContent = data.title;
        modalBody.innerHTML = data.content;
        modal.classList.add('active');
      }
    });
  });

  if (modalClose) {
    modalClose.onclick = () => modal.classList.remove('active');
  }
  modal.onclick = (e) => {
    if (e.target === modal) modal.classList.remove('active');
  };
}

/* --------------------------------------------------------------------------
   VAULT MODULE
   -------------------------------------------------------------------------- */
function initVaultModule() {
  const saveInvBtn = document.getElementById('inv-save-vault-btn');
  if (saveInvBtn) {
    saveInvBtn.addEventListener('click', () => {
      const inv = getInvoiceState();
      const record = {
        type: 'invoice',
        title: `${inv.docType} #${inv.invoiceNo}`,
        subtitle: `Client: ${inv.client.name || 'Unspecified'}`,
        amount: formatCurrencyNumber(calculateTotalAmount(inv), inv.currency),
        currency: inv.currency,
        data: inv
      };
      Storage.saveVaultRecord(record);
      window.showToast('Invoice saved securely to your Vault!', 'success');
      updatePrivacyStatus();
    });
  }

  const exportBtn = document.getElementById('vault-export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      Storage.exportAllData();
      window.showToast('Complete offline backup exported successfully!', 'success');
    });
  }

  const importFile = document.getElementById('vault-import-input');
  if (importFile) {
    importFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const res = Storage.importData(evt.target.result);
          if (res.success) {
            window.showToast('Backup restored successfully! Reloading...', 'success');
            setTimeout(() => window.location.reload(), 1000);
          } else {
            window.showToast('Failed to import backup: ' + res.error, 'error');
          }
        };
        reader.readAsText(file);
      }
    });
  }

  const clearBtn = document.getElementById('vault-clear-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to completely erase all local drafts, records, and profiles? This cannot be undone.')) {
        Storage.clearAllData();
        window.showToast('All local data wiped cleanly.', 'info');
        setTimeout(() => window.location.reload(), 800);
      }
    });
  }

  const searchInput = document.getElementById('vault-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => renderVault());
  }

  document.querySelectorAll('.vault-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.vault-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      renderVault();
    });
  });
}

function renderVault() {
  const container = document.getElementById('vault-records-grid');
  if (!container) return;

  const records = Storage.getVaultRecords();
  const searchVal = document.getElementById('vault-search-input')?.value.toLowerCase() || '';
  const activePill = document.querySelector('.vault-pill.active')?.dataset.filter || 'all';

  const filtered = records.filter(r => {
    const matchesFilter = activePill === 'all' || r.type === activePill;
    const matchesSearch = !searchVal ||
      r.title.toLowerCase().includes(searchVal) ||
      (r.subtitle && r.subtitle.toLowerCase().includes(searchVal));
    return matchesFilter && matchesSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="vault-empty-state">
        <div class="vault-empty-icon">
          <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
        </div>
        <h3 style="margin-bottom: 6px;">Your Vault is Empty</h3>
        <p>Finalize any Invoice, Rent Receipt, or Salary Slip and click "Save to Vault" to keep a permanent encrypted local record.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  filtered.forEach(r => {
    const card = document.createElement('div');
    card.className = 'vault-card';
    const dateFormatted = new Date(r.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    const badgeClass = {
      invoice: 'badge-indigo',
      rent: 'badge-emerald',
      payslip: 'badge-amber',
      voucher: 'badge-indigo'
    }[r.type] || 'badge-indigo';

    card.innerHTML = `
      <div>
        <div class="vault-card-top">
          <div>
            <div class="vault-card-title">${r.title}</div>
            <div class="vault-card-sub">${r.subtitle || ''}</div>
          </div>
          <span class="badge ${badgeClass}">${r.type.toUpperCase()}</span>
        </div>
        <div class="vault-card-amount">${r.amount ? `₹ ${r.amount}` : ''}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">${dateFormatted}</div>
      </div>
      <div class="vault-card-actions">
        <button class="btn btn-secondary btn-sm btn-load-record" data-id="${r.id}">
          <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          Load in Studio
        </button>
        <button class="btn-icon btn-sm btn-del-record" data-id="${r.id}" title="Delete Record" aria-label="Delete Record" style="color: var(--rose-500);">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      </div>
    `;

    card.querySelector('.btn-del-record').onclick = () => {
      if (confirm(`Delete record "${r.title}"?`)) {
        Storage.deleteVaultRecord(r.id);
        renderVault();
        updatePrivacyStatus();
        window.showToast('Record removed from vault', 'info');
      }
    };

    card.querySelector('.btn-load-record').onclick = () => {
      if (r.type === 'invoice' && r.data) {
        setInvoiceState(r.data);
        document.querySelector('.tab-btn[data-tab="invoice"]').click();
        window.showToast('Invoice loaded into studio!', 'success');
      }
    };

    container.appendChild(card);
  });
}

/* --------------------------------------------------------------------------
   PWA & SERVICE WORKER
   -------------------------------------------------------------------------- */
function setupPWA() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => {
          reg.update();
          console.log('Xestus BizCraft ServiceWorker active:', reg.scope);
        })
        .catch(err => {
          console.warn('ServiceWorker registration error:', err);
        });
    });
  }
}
