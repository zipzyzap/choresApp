/*
  Main settings dashboard — app config, PIN change, danger zone.
  Shown after PIN is verified when coming from the selector screen.
*/

Object.assign(Settings, {

  async showDashboard() {
    Settings.showSettingsScreen();

    const content  = document.getElementById('settings-content');
    const children = State.get('children');
    const settings = await Api.getSettings();
    State.set({ settings });

    content.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-xl)">
        <h2 style="color:var(--text-primary);font-size:1.4rem">⚙️ Parent Settings</h2>
        <button class="btn btn-ghost btn-small" id="settings-back">← Back</button>
      </div>

      <section style="margin-bottom:var(--space-xl)">
        <h3 style="color:var(--text-secondary);margin-bottom:var(--space-md)">Children</h3>
        <div id="settings-children-list"></div>
        <button class="btn btn-ghost btn-small" id="btn-add-child" style="margin-top:var(--space-md)">+ Add Child</button>
      </section>

      <section style="margin-bottom:var(--space-xl)">
        <h3 style="color:var(--text-secondary);margin-bottom:var(--space-md)">App Settings</h3>
        <div class="form-group">
          <label class="form-label">Day resets at</label>
          <input class="form-input" type="time" id="setting-reset-time" value="${settings.reset_time || '06:00'}">
        </div>
        <div class="form-group">
          <label class="form-label">Change PIN</label>
          <input class="form-input" type="password" id="setting-new-pin" placeholder="New 4-digit PIN" maxlength="4">
        </div>
        <button class="btn btn-primary" id="btn-save-settings">Save Settings</button>
      </section>

      <section>
        <h3 style="color:var(--color-danger);margin-bottom:var(--space-md)">Danger Zone</h3>
        <button class="btn btn-danger btn-small" id="btn-reset-db">Reset All Data</button>
      </section>
    `;

    Settings._renderChildrenList(children);
    Settings._bindDashboardActions();

    document.getElementById('settings-back').addEventListener('click', () => {
      Settings.returnToPreviousScreen();
    });
  },

  _renderChildrenList(children) {
    const list = document.getElementById('settings-children-list');
    Utils.clear(list);

    children.forEach(child => {
      const row = Utils.el('div');
      row.style.cssText = 'display:flex;align-items:center;gap:var(--space-md);padding:var(--space-sm) 0;border-bottom:1px solid var(--border)';
      row.innerHTML = `
        <span style="font-size:1.4rem">${child.avatar}</span>
        <span style="flex:1;font-weight:600">${child.name}</span>
        <button class="btn btn-ghost btn-small" data-edit="${child.id}">Edit</button>
      `;
      row.querySelector('[data-edit]').addEventListener('click', () => Settings.showChildEditor(child));
      list.appendChild(row);
    });
  },

  _bindDashboardActions() {
    document.getElementById('btn-add-child').addEventListener('click', () => {
      Settings.showChildEditor(null);
    });

    document.getElementById('btn-save-settings').addEventListener('click', async () => {
      const resetTime = document.getElementById('setting-reset-time').value;
      const newPin    = document.getElementById('setting-new-pin').value;

      const updates = { reset_time: resetTime };
      if (newPin && newPin.length === 4) updates.pin = newPin;

      await Api.updateSettings(updates);
      alert('Settings saved!');
    });

    document.getElementById('btn-reset-db').addEventListener('click', async () => {
      if (!confirm('This will delete ALL data. Are you sure?')) return;
      const pin = prompt('Enter your PIN to confirm reset:');
      if (!pin) return;
      try {
        await Api.resetDatabase(pin);
        alert('Database reset. Reloading...');
        window.location.reload();
      } catch {
        alert('Incorrect PIN or reset failed.');
      }
    });
  },

});