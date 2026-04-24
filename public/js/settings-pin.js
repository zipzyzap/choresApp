/*
  PIN gate — shows a compact modal overlay for PIN entry.
  On success, either enters edit mode (if coming from app screen)
  or opens the full settings dashboard.
*/

// Extend the Settings object defined in settings.js
Object.assign(Settings, {

  showPinGate() {
    Settings._openModal(`
      <div class="pin-pad">
        <h2 style="color:var(--text-primary);margin-bottom:var(--space-sm)">Parent Settings</h2>
        <p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:var(--space-lg)">Enter your PIN to continue</p>
        <div class="pin-display" id="pin-display">
          <div class="pin-dot" id="pin-dot-0"></div>
          <div class="pin-dot" id="pin-dot-1"></div>
          <div class="pin-dot" id="pin-dot-2"></div>
          <div class="pin-dot" id="pin-dot-3"></div>
        </div>
        <div class="pin-grid" id="pin-grid"></div>
        <div class="pin-error" id="pin-error"></div>
        <button class="btn btn-ghost btn-small" id="pin-cancel" style="margin-top:var(--space-md)">Cancel</button>
      </div>
    `);

    Settings._pinBuffer = '';
    Settings._buildPinGrid();
    Settings._bindPinKeyboard();

    document.getElementById('pin-cancel').addEventListener('click', () => {
      Settings.closeModal();
      Router._history.pop();
    });
  },

  _buildPinGrid() {
    const grid = document.getElementById('pin-grid');
    const keys = ['1','2','3','4','5','6','7','8','9','⌫','0','✓'];

    keys.forEach(key => {
      const btn = Utils.el('button', 'pin-key', key);
      btn.addEventListener('click', () => Settings._pinKeyPress(key));
      grid.appendChild(btn);
    });
  },

  _pinKeyPress(key) {
    if (State.get('pinLockout')) return;

    if (key === '⌫') {
      Settings._pinBuffer = Settings._pinBuffer.slice(0, -1);
    } else if (key === '✓') {
      Settings._verifyPin();
      return;
    } else if (Settings._pinBuffer.length < 4) {
      Settings._pinBuffer += key;
    }

    if (Settings._pinBuffer.length === 4) {
      setTimeout(Settings._verifyPin, 200);
    }

    Settings._updatePinDisplay();
  },

  _updatePinDisplay() {
    for (let i = 0; i < 4; i++) {
      const dot = document.getElementById(`pin-dot-${i}`);
      dot?.classList.toggle('filled', i < Settings._pinBuffer.length);
    }
  },

  async _verifyPin() {
    const errorEl = document.getElementById('pin-error');
    try {
      const result = await Api.verifyPin(Settings._pinBuffer);

      if (result.valid) {
        Settings._attempts = 0;
        Settings._removePinKeyboard();
        State.set({ pinAttempts: 0, pinLockout: false });

        const prev = Router.previousScreen();
        Settings.closeModal();

        if (prev === 'app') {
          Dashboard.enterEditMode();
        } else {
          Settings.showDashboard();
        }

      } else {
        Settings._attempts++;
        State.set({ pinAttempts: Settings._attempts });
        Settings._pinBuffer = '';
        Settings._updatePinDisplay();

        const remaining = Settings._maxAttempts - Settings._attempts;

        if (Settings._attempts >= Settings._maxAttempts) {
          State.set({ pinLockout: true });
          Settings._removePinKeyboard();
          if (errorEl) errorEl.textContent = 'Too many attempts. Please wait 5 minutes.';
          setTimeout(() => {
            State.set({ pinLockout: false, pinAttempts: 0 });
            Settings._attempts = 0;
            Settings.closeModal();
            Router._history.pop();
          }, 5 * 60 * 1000);
        } else {
          if (errorEl) errorEl.textContent = `Incorrect PIN. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`;
        }
      }
    } catch (err) {
      if (errorEl) errorEl.textContent = 'Error checking PIN. Try again.';
    }
  },

});