/**
 * Xestus BizCraft - PDF Export & High-Res Print Controller
 */

export function triggerPrint() {
  const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab;
  const isUpi = activeTab === 'upi';

  if (isUpi) {
    document.body.classList.add('print-standee-mode');
  }

  if (window.confetti) {
    window.confetti({ particleCount: 35, spread: 1.2 });
  }

  // Short delay allows any pending render/layout pass to settle
  setTimeout(() => {
    window.print();
    if (isUpi) {
      setTimeout(() => {
        document.body.classList.remove('print-standee-mode');
      }, 1000);
    }
  }, 100);
}

export function openPreviewModal(contentHTML, title = 'Document Preview') {
  let modal = document.getElementById('biz-preview-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'biz-preview-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-container">
        <div class="card-header">
          <h3 id="modal-title">${title}</h3>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-emerald btn-sm" id="modal-print-btn">
              <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
              Print / Save PDF
            </button>
            <button class="btn-icon btn-sm" id="modal-close-btn">&times;</button>
          </div>
        </div>
        <div class="card-body" id="modal-body-content" style="background: #e2e8f0; display: flex; justify-content: center; padding: 24px;"></div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#modal-close-btn').onclick = () => modal.classList.remove('active');
    modal.querySelector('#modal-print-btn').onclick = () => triggerPrint();
    modal.onclick = (e) => {
      if (e.target === modal) modal.classList.remove('active');
    };
  }

  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body-content').innerHTML = contentHTML;
  modal.classList.add('active');
}
