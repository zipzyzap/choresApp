/*
  Item editor — create, edit, and delete items within a column.
  Also renders the item list inside the column editor.
*/

Object.assign(Settings, {

  async _renderItemsList(child, column) {
    const items = await Api.getItems(column.id);
    const list  = document.getElementById('col-items-list');
    if (!list) return;
    Utils.clear(list);

    items.forEach(item => {
      const row = Utils.el('div');
      row.style.cssText = 'display:flex;align-items:center;gap:var(--space-md);padding:var(--space-sm) 0;border-bottom:1px solid var(--border)';
      row.innerHTML = `
        <span style="flex:1">${item.name} <small style="color:var(--text-muted)">(${Utils.formatFrequency(item)})</small></span>
        <button class="btn btn-ghost btn-small" data-item-edit="${item.id}">Edit</button>
      `;
      row.querySelector('[data-item-edit]').addEventListener('click', () => Settings.showItemEditor(child, column, item));
      list.appendChild(row);
    });
  },

  showItemEditor(child, column, item) {
    const isNew = !item;
    Settings.showSettingsScreen();
    const content = document.getElementById('settings-content');
    const days    = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
    const freq    = item?.frequency || 'daily';

    const checkedDays = item?.frequency === 'specific' && item?.frequency_day
      ? item.frequency_day.split(',').map(d => d.trim())
      : [];

    const dayCheckboxes = days.map(d => `
      <label class="day-checkbox-label">
        <input type="checkbox" class="day-checkbox" value="${d}" ${checkedDays.includes(d) ? 'checked' : ''}>
        <span>${d.slice(0,1).toUpperCase() + d.slice(1,3)}</span>
      </label>
    `).join('');

    const domOptions = [...Array(31)].map((_, i) => {
      const n = i + 1;
      return `<option value="${n}" ${item?.frequency === 'monthly' && item?.frequency_day === String(n) ? 'selected' : ''}>${Utils._ordinal(n)}</option>`;
    }).join('') + `<option value="last" ${item?.frequency === 'monthly' && item?.frequency_day === 'last' ? 'selected' : ''}>Last day</option>`;

    content.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-xl)">
        <h2 style="color:var(--text-primary)">${isNew ? 'Add Item' : `Edit "${item.name}"`}</h2>
        <button class="btn btn-ghost btn-small" id="item-editor-back">← Back</button>
      </div>

      <div class="form-group">
        <label class="form-label">Name</label>
        <input class="form-input" id="item-name" value="${item?.name || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Frequency</label>
        <select class="form-select" id="item-frequency">
          <option value="daily"    ${freq === 'daily'    ? 'selected' : ''}>Every day</option>
          <option value="weekdays" ${freq === 'weekdays' ? 'selected' : ''}>Weekdays (Mon–Fri)</option>
          <option value="weekends" ${freq === 'weekends' ? 'selected' : ''}>Weekends (Sat–Sun)</option>
          <option value="specific" ${freq === 'specific' ? 'selected' : ''}>Specific days</option>
          <option value="weekly"   ${freq === 'weekly'   ? 'selected' : ''}>Once a week</option>
          <option value="monthly"  ${freq === 'monthly'  ? 'selected' : ''}>Monthly</option>
        </select>
      </div>
      <div class="form-group" id="specific-days-group" style="${freq === 'specific' ? '' : 'display:none'}">
        <label class="form-label">Which days?</label>
        <div class="day-checkboxes">${dayCheckboxes}</div>
      </div>
      <div class="form-group" id="weekly-day-group" style="${freq === 'weekly' ? '' : 'display:none'}">
        <label class="form-label">Which day?</label>
        <select class="form-select" id="item-weekly-day">
          ${days.map(d => `
            <option value="${d}" ${item?.frequency === 'weekly' && item?.frequency_day === d ? 'selected' : ''}>
              ${d.charAt(0).toUpperCase() + d.slice(1)}
            </option>
          `).join('')}
        </select>
      </div>
      <div class="form-group" id="monthly-day-group" style="${freq === 'monthly' ? '' : 'display:none'}">
        <label class="form-label">Which day of the month?</label>
        <select class="form-select" id="item-monthly-day">${domOptions}</select>
      </div>
      <div class="form-group">
        <label class="form-label">Points value</label>
        <input class="form-input" type="number" id="item-points" value="${item?.points_value || 1}" min="0" max="100">
      </div>
      <div class="form-group" style="flex-direction:row;align-items:center;gap:var(--space-md)">
        <label class="form-label" style="margin:0">Optional / bonus item</label>
        <input type="checkbox" id="item-optional" ${item?.optional ? 'checked' : ''}>
      </div>

      <div style="display:flex;gap:var(--space-md);margin-top:var(--space-lg)">
        <button class="btn btn-primary" id="btn-save-item">Save</button>
        ${!isNew ? `<button class="btn btn-danger" id="btn-delete-item">Delete</button>` : ''}
      </div>
    `;

    // Show/hide sub-pickers when frequency changes
    document.getElementById('item-frequency').addEventListener('change', (e) => {
      document.getElementById('specific-days-group').style.display = e.target.value === 'specific' ? '' : 'none';
      document.getElementById('weekly-day-group').style.display    = e.target.value === 'weekly'   ? '' : 'none';
      document.getElementById('monthly-day-group').style.display   = e.target.value === 'monthly'  ? '' : 'none';
    });

    const keyHandler = Settings.bindFormKeys('btn-save-item', () => {
      Settings.removeFormKeys(keyHandler);
      Settings.showColumnEditor(child, column);
    });

    document.getElementById('item-editor-back').addEventListener('click', () => {
      Settings.removeFormKeys(keyHandler);
      Settings.showColumnEditor(child, column);
    });

    document.getElementById('btn-save-item').addEventListener('click', async () => {
      const name      = document.getElementById('item-name').value.trim();
      const frequency = document.getElementById('item-frequency').value;

      if (!name) return alert('Item name is required');

      let frequency_day = null;

      if (frequency === 'specific') {
        const checked = [...document.querySelectorAll('.day-checkbox:checked')].map(cb => cb.value);
        if (checked.length === 0) return alert('Please select at least one day.');
        frequency_day = checked.join(',');
      } else if (frequency === 'weekly') {
        frequency_day = document.getElementById('item-weekly-day').value;
      } else if (frequency === 'monthly') {
        frequency_day = document.getElementById('item-monthly-day').value;
      }

      const data = {
        column_id:     column.id,
        name,
        frequency,
        frequency_day,
        points_value:  Number(document.getElementById('item-points').value),
        optional:      document.getElementById('item-optional').checked ? 1 : 0,
      };

      if (isNew) {
        await Api.createItem(data);
      } else {
        await Api.updateItem(item.id, data);
      }

      Settings.removeFormKeys(keyHandler);
      Settings.showColumnEditor(child, column);
    });

    document.getElementById('btn-delete-item')?.addEventListener('click', async () => {
      if (!confirm(`Delete "${item.name}"?`)) return;
      await Api.deleteItem(item.id);
      Settings.removeFormKeys(keyHandler);
      Settings.showColumnEditor(child, column);
    });
  },

});