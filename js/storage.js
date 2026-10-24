/**
 * LocalStorage State Manager & Privacy Vault
 * 100% In-Browser. Zero Telemetry. Zero Cloud Sync.
 */

const STORAGE_KEYS = {
  THEME: 'xestus_bizcraft_theme',
  BUSINESS_PROFILE: 'xestus_bizcraft_profile',
  INVOICE_DRAFT: 'xestus_bizcraft_invoice_draft',
  UPI_DRAFT: 'xestus_bizcraft_upi_draft',
  RENT_DRAFT: 'xestus_bizcraft_rent_draft',
  SALARY_DRAFT: 'xestus_bizcraft_salary_draft',
  VOUCHER_DRAFT: 'xestus_bizcraft_voucher_draft',
  VAULT_RECORDS: 'xestus_bizcraft_vault_records',
  SETTINGS: 'xestus_bizcraft_settings'
};

export const Storage = {
  // Theme
  getTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
  },
  setTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  },

  // Business Profile (reused across Invoices, Slips, Receipts)
  getBusinessProfile() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BUSINESS_PROFILE);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Error reading business profile', e);
      return null;
    }
  },
  setBusinessProfile(profile) {
    try {
      localStorage.setItem(STORAGE_KEYS.BUSINESS_PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error('Error saving business profile', e);
    }
  },

  // Drafts
  getDraft(key) {
    try {
      const fullKey = STORAGE_KEYS[key] || key;
      const data = localStorage.getItem(fullKey);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },
  saveDraft(key, data) {
    try {
      const fullKey = STORAGE_KEYS[key] || key;
      localStorage.setItem(fullKey, JSON.stringify(data));
    } catch (e) {
      console.warn('Storage save draft failed', e);
    }
  },
  removeDraft(key) {
    const fullKey = STORAGE_KEYS[key] || key;
    localStorage.removeItem(fullKey);
  },

  // Vault Records
  getVaultRecords() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.VAULT_RECORDS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },
  saveVaultRecord(record) {
    try {
      const records = this.getVaultRecords();
      const existingIdx = records.findIndex(r => r.id === record.id);
      if (existingIdx >= 0) {
        records[existingIdx] = { ...records[existingIdx], ...record, updatedAt: new Date().toISOString() };
      } else {
        records.unshift({
          ...record,
          id: record.id || 'rec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      localStorage.setItem(STORAGE_KEYS.VAULT_RECORDS, JSON.stringify(records));
      return true;
    } catch (e) {
      console.error('Failed to save vault record', e);
      return false;
    }
  },
  deleteVaultRecord(id) {
    try {
      const records = this.getVaultRecords().filter(r => r.id !== id);
      localStorage.setItem(STORAGE_KEYS.VAULT_RECORDS, JSON.stringify(records));
      return true;
    } catch (e) {
      return false;
    }
  },
  getVaultRecordById(id) {
    const records = this.getVaultRecords();
    return records.find(r => r.id === id) || null;
  },

  // Privacy & Storage Stats
  getStorageStats() {
    let totalBytes = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalBytes += (localStorage[key].length + key.length) * 2;
      }
    }
    const kb = (totalBytes / 1024).toFixed(1);
    const records = this.getVaultRecords();
    return {
      bytes: totalBytes,
      formatted: `${kb} KB used`,
      recordCount: records.length,
      isPrivate: true
    };
  },

  // Backup & Restore
  exportAllData() {
    const payload = {
      app: 'Xestus BizCraft',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      keys: {}
    };
    for (let key in STORAGE_KEYS) {
      const raw = localStorage.getItem(STORAGE_KEYS[key]);
      if (raw) {
        payload.keys[STORAGE_KEYS[key]] = raw;
      }
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xestus_bizcraft_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  importData(jsonString) {
    try {
      const payload = JSON.parse(jsonString);
      if (!payload.keys) {
        throw new Error('Invalid BizCraft backup format.');
      }
      for (let key in payload.keys) {
        localStorage.setItem(key, payload.keys[key]);
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  clearAllData() {
    for (let key in STORAGE_KEYS) {
      localStorage.removeItem(STORAGE_KEYS[key]);
    }
  }
};
