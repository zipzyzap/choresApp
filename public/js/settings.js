/*
  Settings coordinator — shared state, modal helpers, and PIN keyboard.
  The actual UI for each section lives in its own file:
    settings-pin.js       — PIN gate
    settings-dashboard.js — main settings screen
    settings-children.js  — child profile editor
    settings-columns.js   — column editor
    settings-items.js     — item editor
*/

const Settings = {

  _pinBuffer:   '',
  _attempts:    0,
  _maxAttempts: 5,
  _modalEl:     null,

  init() {
    // Nothing to init eagerly — settings are rendered on demand
  },

  // ── Modal helpers ─────────────────────────────────────────────

  // Create and show a floating modal overlay over the current screen
  _openModal(contentHtml) {
    Settings.closeModal();

    const overlay = Utils.el('div', 'modal-overlay settings-modal-overlay');
    overlay.id = 'settings-modal';
    overlay.innerHTML = `<div class="modal settings-modal">${contentHtml}</div>`;
    document.body.appendChild(overlay);
    Settings._modalEl = overlay;
    return overlay;
  },

  // Remove the settings modal if it exists
  closeModal() {
    Settings._removePinKeyboard();
    document.getElementById('settings-modal')?.remove();
    Settings._modalEl = null;
    Router._clearSettingsTimeout();
  },

  // ── PIN keyboard support ──────────────────────────────────────

  _pinKeyHandler: null,

  _bindPinKeyboard() {
    Settings._pinKeyHandler = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        Settings._pinKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        Settings._pinKeyPress('⌫');
      } else if (e.key === 'Enter') {
        Settings._pinKeyPress('✓');
      } else if (e.key === 'Escape') {
        Settings.closeModal();
        Router._history.pop();
      }
    };
    document.addEventListener('keydown', Settings._pinKeyHandler);
  },

  _removePinKeyboard() {
    if (Settings._pinKeyHandler) {
      document.removeEventListener('keydown', Settings._pinKeyHandler);
      Settings._pinKeyHandler = null;
    }
  },

  // ── Shared keyboard helper for settings forms ─────────────────

  // Binds Enter to save and Escape to a back action on a screen.
  // Returns the handler so the caller can remove it when navigating away.
  bindFormKeys(saveId, onEscape) {
    const handler = (e) => {
      if (e.key === 'Enter' && e.target.tagName !== 'SELECT') {
        document.getElementById(saveId)?.click();
      } else if (e.key === 'Escape') {
        document.removeEventListener('keydown', handler);
        onEscape();
      }
    };
    document.addEventListener('keydown', handler);
    return handler;
  },

  removeFormKeys(handler) {
    if (handler) document.removeEventListener('keydown', handler);
  },

  // ── Switch to the full-screen settings UI ─────────────────────

  showSettingsScreen() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-settings').classList.add('active');
  },

  // ── Return to the screen that was active before settings ──────

  returnToPreviousScreen() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const prev = Router._history.find(s => s !== 'settings') || 'selector';
    document.getElementById(`screen-${prev}`)?.classList.add('active');
    if (prev === 'selector') Children.init();
  },

};