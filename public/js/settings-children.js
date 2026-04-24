/*
  Child profile editor — name, avatar, theme, rewards toggle,
  and the Manage panel (streak, points, vacation mode).
*/

Object.assign(Settings, {

  showChildEditor(child) {
    const isNew = !child;
    Settings.showSettingsScreen();
    const content = document.getElementById('settings-content');

    content.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-xl)">
        <h2 style="color:var(--text-primary)">${isNew ? 'Add Child' : `Edit ${child.name}`}</h2>
        <button class="btn btn-ghost btn-small" id="child-editor-back">← Back</button>
      </div>

      <div class="form-group">
        <label class="form-label">Name</label>
        <input class="form-input" id="child-name" value="${child?.name || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Avatar (emoji)</label>
        <input class="form-input" id="child-avatar" value="${child?.avatar || '😊'}" style="font-size:1.4rem">
      </div>
      <div class="form-group">
        <label class="form-label">Accent color</label>
        <input type="color" id="child-accent" value="${child?.accent || '#4A90D9'}">
      </div>
      <div class="form-group">
        <label class="form-label">Theme</label>
        <select class="form-select" id="child-theme">
          ${Themes.AVAILABLE.map(t => `
            <option value="${t.id}" ${child?.theme === t.id ? 'selected' : ''}>${t.emoji} ${t.label}</option>
          `).join('')}
        </select>
      </div>
      <div class="form-group" style="flex-direction:row;align-items:center;gap:var(--space-md)">
        <label class="form-label" style="margin:0">Enable rewards/points</label>
        <input type="checkbox" id="child-rewards" ${child?.rewards ? 'checked' : ''}>
      </div>

      <div style="display:flex;gap:var(--space-md);margin-top:var(--space-lg)">
        <button class="btn btn-primary" id="btn-save-child">Save</button>
        ${!isNew ? `<button class="btn btn-danger" id="btn-delete-child">Delete Child</button>` : ''}
      </div>

      ${!isNew ? `
        <hr style="margin:var(--space-xl) 0;border-color:var(--border)">
        <h3 style="color:var(--text-secondary);margin-bottom:var(--space-md)">Manage ${child.name}</h3>

        <div class="manage-panel">
          <div class="manage-row">
            <div class="manage-row-label">
              <span class="manage-row-icon">🔥</span>
              <div>
                <div class="manage-row-title">Streak</div>
                <div class="manage-row-value" id="streak-display">${child.streak} day${child.streak !== 1 ? 's' : ''}</div>
              </div>
            </div>
            <div class="manage-row-actions">
              <button class="btn btn-ghost btn-small" id="btn-edit-streak">Edit</button>
              <button class="btn btn-ghost btn-small" id="btn-reset-streak">Reset</button>
            </div>
          </div>

          <div class="manage-row">
            <div class="manage-row-label">
              <span class="manage-row-icon">⭐</span>
              <div>
                <div class="manage-row-title">Points</div>
                <div class="manage-row-value" id="points-display">${child.points} pts</div>
              </div>
            </div>
            <div class="manage-row-actions">
              <button class="btn btn-ghost btn-small" id="btn-award-points">+ Award</button>
              <button class="btn btn-ghost btn-small" id="btn-deduct-points">− Deduct</button>
            </div>
          </div>

          <div class="manage-row">
            <div class="manage-row-label">
              <span class="manage-row-icon">🏖️</span>
              <div>
                <div class="manage-row-title">Vacation Mode</div>
                <div class="manage-row-value">${child.vacation ? 'Active — chores paused' : 'Off'}</div>
              </div>
            </div>
            <div class="manage-row-actions">
              <button class="btn ${child.vacation ? 'btn-primary' : 'btn-ghost'} btn-small" id="btn-vacation-toggle">
                ${child.vacation ? 'End Vacation' : 'Start Vacation'}
              </button>
            </div>
          </div>
        </div>

        <div id="streak-editor" class="inline-editor hidden">
          <input class="form-input" type="number" id="streak-input" min="0" value="${child.streak}" style="width:100px">
          <button class="btn btn-primary btn-small" id="btn-save-streak">Save</button>
          <button class="btn btn-ghost btn-small" id="btn-cancel-streak">Cancel</button>
        </div>

        <div id="points-editor" class="inline-editor hidden">
          <input class="form-input" type="number" id="points-input" min="1" value="5" style="width:100px">
          <input class="form-input" id="points-note" placeholder="Reason (optional)" style="flex:1">
          <button class="btn btn-primary btn-small" id="btn-save-points">Save</button>
          <button class="btn btn-ghost btn-small" id="btn-cancel-points">Cancel</button>
        </div>

        <hr style="margin:var(--space-xl) 0;border-color:var(--border)">
        <h3 style="color:var(--text-secondary);margin-bottom:var(--space-md)">Columns</h3>
        <div id="child-columns-list"></div>
        <button class="btn btn-ghost btn-small" id="btn-add-column" style="margin-top:var(--space-md)">+ Add Column</button>
      ` : ''}
    `;

    const keyHandler = Settings.bindFormKeys('btn-save-child', () => {
      Settings.removeFormKeys(keyHandler);
      Settings.showDashboard();
    });

    document.getElementById('child-editor-back').addEventListener('click', () => {
      Settings.removeFormKeys(keyHandler);
      Settings.showDashboard();
    });

    document.getElementById('btn-save-child').addEventListener('click', async () => {
      const data = {
        name:    document.getElementById('child-name').value.trim(),
        avatar:  document.getElementById('child-avatar').value.trim(),
        accent:  document.getElementById('child-accent').value,
        theme:   document.getElementById('child-theme').value,
        rewards: document.getElementById('child-rewards').checked ? 1 : 0,
      };

      if (!data.name) return alert('Name is required');

      if (isNew) {
        await Api.createChild(data);
      } else {
        await Api.updateChild(child.id, data);
      }

      Settings.removeFormKeys(keyHandler);
      const children = await Api.getChildren();
      State.set({ children });
      Settings.showDashboard();
    });

    if (!isNew) {
      document.getElementById('btn-delete-child')?.addEventListener('click', async () => {
        if (!confirm(`Delete ${child.name} and all their data?`)) return;
        await Api.deleteChild(child.id);
        Settings.removeFormKeys(keyHandler);
        const children = await Api.getChildren();
        State.set({ children });
        Settings.showDashboard();
      });

      Settings._bindStreakControls(child);
      Settings._bindPointsControls(child);

      document.getElementById('btn-vacation-toggle').addEventListener('click', async () => {
        const newState = child.vacation ? 0 : 1;
        await Api.updateChild(child.id, { vacation: newState });
        child.vacation = newState;
        Settings.removeFormKeys(keyHandler);
        Settings.showChildEditor(child);
      });

      Settings._renderColumnsList(child);

      document.getElementById('btn-add-column').addEventListener('click', () => {
        Settings.removeFormKeys(keyHandler);
        Settings.showColumnEditor(child, null);
      });
    }
  },

  // ── Streak controls ───────────────────────────────────────────

  _bindStreakControls(child) {
    document.getElementById('btn-edit-streak').addEventListener('click', () => {
      Utils.show(document.getElementById('streak-editor'));
      document.getElementById('streak-input').focus();
    });

    document.getElementById('btn-reset-streak').addEventListener('click', async () => {
      if (!confirm(`Reset ${child.name}'s streak to 0?`)) return;
      await Api.updateChild(child.id, { streak: 0 });
      document.getElementById('streak-display').textContent = '0 days';
      child.streak = 0;
    });

    document.getElementById('btn-save-streak').addEventListener('click', async () => {
      const val = parseInt(document.getElementById('streak-input').value);
      if (isNaN(val) || val < 0) return alert('Enter a valid number');
      await Api.updateChild(child.id, { streak: val });
      document.getElementById('streak-display').textContent = `${val} day${val !== 1 ? 's' : ''}`;
      child.streak = val;
      Utils.hide(document.getElementById('streak-editor'));
    });

    document.getElementById('btn-cancel-streak').addEventListener('click', () => {
      Utils.hide(document.getElementById('streak-editor'));
    });

    document.getElementById('streak-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter')  document.getElementById('btn-save-streak').click();
      if (e.key === 'Escape') Utils.hide(document.getElementById('streak-editor'));
    });
  },

  // ── Points controls ───────────────────────────────────────────

  _bindPointsControls(child) {
    let _direction = 1;

    document.getElementById('btn-award-points').addEventListener('click', () => {
      _direction = 1;
      document.getElementById('points-input').value = 5;
      Utils.show(document.getElementById('points-editor'));
      document.getElementById('points-input').focus();
    });

    document.getElementById('btn-deduct-points').addEventListener('click', () => {
      _direction = -1;
      document.getElementById('points-input').value = 5;
      Utils.show(document.getElementById('points-editor'));
      document.getElementById('points-input').focus();
    });

    document.getElementById('btn-save-points').addEventListener('click', async () => {
      const amount = parseInt(document.getElementById('points-input').value);
      const note   = document.getElementById('points-note').value.trim();
      if (isNaN(amount) || amount <= 0) return alert('Enter a valid amount');

      const result = await Api.adjustPoints({
        child_id: child.id,
        amount:   amount * _direction,
        note:     note || null,
      });

      document.getElementById('points-display').textContent = `${result.points} pts`;
      child.points = result.points;
      Utils.hide(document.getElementById('points-editor'));
    });

    document.getElementById('btn-cancel-points').addEventListener('click', () => {
      Utils.hide(document.getElementById('points-editor'));
    });

    ['points-input', 'points-note'].forEach(id => {
      document.getElementById(id)?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter')  document.getElementById('btn-save-points').click();
        if (e.key === 'Escape') Utils.hide(document.getElementById('points-editor'));
      });
    });
  },

});