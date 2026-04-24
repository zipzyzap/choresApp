/*
  Column editor — create, edit, and delete columns for a child.
  Also renders the column list inside the child editor.
*/

Object.assign(Settings, {

  async _renderColumnsList(child) {
    const columns = await Api.getColumns(child.id);
    const list    = document.getElementById('child-columns-list');
    if (!list) return;
    Utils.clear(list);

    columns.forEach(col => {
      const row = Utils.el('div');
      row.style.cssText = 'display:flex;align-items:center;gap:var(--space-md);padding:var(--space-sm) 0;border-bottom:1px solid var(--border)';
      row.innerHTML = `
        <span style="font-size:1.2rem">${col.icon}</span>
        <span style="flex:1">${col.name}</span>
        <button class="btn btn-ghost btn-small" data-col-edit="${col.id}">Edit</button>
      `;
      row.querySelector('[data-col-edit]').addEventListener('click', () => Settings.showColumnEditor(child, col));
      list.appendChild(row);
    });
  },

  showColumnEditor(child, column) {
    const isNew = !column;
    Settings.showSettingsScreen();
    const content = document.getElementById('settings-content');

    content.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-xl)">
        <h2 style="color:var(--text-primary)">${isNew ? 'Add Column' : `Edit "${column.name}"`}</h2>
        <button class="btn btn-ghost btn-small" id="col-editor-back">← Back</button>
      </div>

      <div class="form-group">
        <label class="form-label">Column name</label>
        <input class="form-input" id="col-name" value="${column?.name || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Icon (emoji)</label>
        <input class="form-input" id="col-icon" value="${column?.icon || '📋'}" style="font-size:1.2rem">
      </div>
      <div class="form-group" style="flex-direction:row;align-items:center;gap:var(--space-md)">
        <label class="form-label" style="margin:0">Points eligible</label>
        <input type="checkbox" id="col-points" ${column?.points_eligible ? 'checked' : ''}>
      </div>

      <div style="display:flex;gap:var(--space-md);margin-top:var(--space-lg)">
        <button class="btn btn-primary" id="btn-save-col">Save</button>
        ${!isNew ? `<button class="btn btn-danger" id="btn-delete-col">Delete Column</button>` : ''}
      </div>

      ${!isNew ? `
        <hr style="margin:var(--space-xl) 0;border-color:var(--border)">
        <h3 style="color:var(--text-secondary);margin-bottom:var(--space-md)">Items</h3>
        <div id="col-items-list"></div>
        <button class="btn btn-ghost btn-small" id="btn-add-item" style="margin-top:var(--space-md)">+ Add Item</button>
      ` : ''}
    `;

    const keyHandler = Settings.bindFormKeys('btn-save-col', () => {
      Settings.removeFormKeys(keyHandler);
      Settings.showChildEditor(child);
    });

    document.getElementById('col-editor-back').addEventListener('click', () => {
      Settings.removeFormKeys(keyHandler);
      Settings.showChildEditor(child);
    });

    document.getElementById('btn-save-col').addEventListener('click', async () => {
      const data = {
        child_id:        child.id,
        name:            document.getElementById('col-name').value.trim(),
        icon:            document.getElementById('col-icon').value.trim(),
        points_eligible: document.getElementById('col-points').checked ? 1 : 0,
      };

      if (!data.name) return alert('Column name is required');

      if (isNew) {
        await Api.createColumn(data);
      } else {
        await Api.updateColumn(column.id, data);
      }

      Settings.removeFormKeys(keyHandler);
      Settings.showChildEditor(child);
    });

    if (!isNew) {
      document.getElementById('btn-delete-col')?.addEventListener('click', async () => {
        if (!confirm(`Delete column "${column.name}" and all its items?`)) return;
        await Api.deleteColumn(column.id);
        Settings.removeFormKeys(keyHandler);
        Settings.showChildEditor(child);
      });

      Settings._renderItemsList(child, column);

      document.getElementById('btn-add-item').addEventListener('click', () => {
        Settings.removeFormKeys(keyHandler);
        Settings.showItemEditor(child, column, null);
      });
    }
  },

});