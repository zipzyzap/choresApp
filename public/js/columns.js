/*
  Column content — loads items for the selected column or the View All view.
  Handles tap-to-complete and edit mode interactions.
*/

const Columns = {

  // ── View All ──────────────────────────────────────────────────

  async loadViewAll() {
    State.set({ activeColumn: null });
    Dashboard.setActiveColumnBtn(null);

    const child   = State.get('activeChild');
    const columns = State.get('columns');
    const today   = Utils.today();

    try {
      const [allItemsByCol, completions] = await Promise.all([
        Promise.all(columns.map(col =>
          Api.getItems(col.id).then(items => ({ col, items }))
        )),
        Api.getCompletions(child.id, today),
      ]);

      State.set({ completions });

      const list = document.getElementById('items-list');
      Utils.clear(list);
      Utils.hide(document.getElementById('column-progress-wrap'));

      if (Dashboard.editMode) {
        Columns._renderViewAllEdit(allItemsByCol, list);
      } else {
        Columns._renderViewAllKid(allItemsByCol, completions, list);
      }

      await Dashboard.updateOverallProgress();
    } catch (err) {
      console.error('Failed to load View All:', err);
    }
  },

  // Kid view — grouped by column, incomplete first then completed
  _renderViewAllKid(allItemsByCol, completions, list) {
    allItemsByCol.forEach(({ col, items }) => {
      const dueItems = items.filter(Utils.isItemDueToday);
      if (dueItems.length === 0) return;

      const section = Columns._buildViewAllSection(col, dueItems, completions);
      list.appendChild(section);
    });
  },

  // Build a single column section for View All kid view
  _buildViewAllSection(col, dueItems, completions) {
    const requiredItems  = dueItems.filter(i => !i.optional);
    const completedCount = requiredItems.filter(i => completions.some(c => c.item_id === i.id)).length;

    const section = Utils.el('div', 'view-all-section');
    section.dataset.colId = col.id;

    const header  = Utils.el('div', 'view-all-section-header');
    const icon    = Utils.el('span', 'view-all-section-icon', col.icon);
    const name    = Utils.el('span', 'view-all-section-name', col.name);
    const count   = Utils.el('span', 'view-all-section-count',
      `${completedCount}/${requiredItems.length}`
    );

    header.appendChild(icon);
    header.appendChild(name);
    header.appendChild(count);
    section.appendChild(header);

    const incomplete = dueItems.filter(i => !completions.some(c => c.item_id === i.id));
    const completed  = dueItems.filter(i =>  completions.some(c => c.item_id === i.id));

    incomplete.forEach(item => section.appendChild(Columns.buildCard(item, completions)));

    if (completed.length > 0 && incomplete.length > 0) {
      section.appendChild(Utils.el('div', 'view-all-completed-divider'));
    }

    completed.forEach(item => section.appendChild(Columns.buildCard(item, completions)));

    return section;
  },

  // Re-render just one column's section in View All after a toggle
  // This avoids a full reload while keeping order correct instantly
  async _refreshViewAllSection(colId) {
    const child    = State.get('activeChild');
    const columns  = State.get('columns');
    const col      = columns.find(c => c.id === colId);
    if (!col) return;

    const [items, completions] = await Promise.all([
      Api.getItems(col.id),
      Api.getCompletions(child.id, Utils.today()),
    ]);

    State.set({ completions });

    const dueItems  = items.filter(Utils.isItemDueToday);
    const existing  = document.querySelector(`.view-all-section[data-col-id="${colId}"]`);
    if (!existing) return;

    const newSection = Columns._buildViewAllSection(col, dueItems, completions);
    existing.replaceWith(newSection);
  },

  // Edit view — grouped by column with + Add Item per column
  _renderViewAllEdit(allItemsByCol, list) {
    allItemsByCol.forEach(({ col, items }) => {
      const section = Utils.el('div', 'view-all-section');
      section.dataset.colId = col.id;

      // Section header with inline + Add Item button
      const header  = Utils.el('div', 'view-all-section-header');
      const icon    = Utils.el('span', 'view-all-section-icon', col.icon);
      const name    = Utils.el('span', 'view-all-section-name', col.name);
      const addBtn  = Utils.el('button', 'btn btn-ghost btn-small', '+ Add Item');

      addBtn.style.marginLeft = 'auto';
      addBtn.addEventListener('click', () => {
        // Set the active column to this section's column, open the modal
        State.set({ activeColumn: col });
        Columns.showItemModal(null);
      });

      header.appendChild(icon);
      header.appendChild(name);
      header.appendChild(addBtn);
      section.appendChild(header);

      if (items.length === 0) {
        const empty = Utils.el('p', null, 'No items yet');
        empty.style.color    = 'var(--text-muted)';
        empty.style.fontSize = '0.85rem';
        empty.style.padding  = 'var(--space-sm) 0';
        section.appendChild(empty);
      } else {
        items.forEach(item => section.appendChild(Columns.buildEditCard(item)));
      }

      list.appendChild(section);
    });
  },

  // ── Single column view ────────────────────────────────────────

  async load(column) {
    State.set({ activeColumn: column });
    Dashboard.setActiveColumnBtn(column.id);

    try {
      const [items, completions] = await Promise.all([
        Api.getItems(column.id),
        Api.getCompletions(State.get('activeChild').id, Utils.today()),
      ]);

      const dueToday = items.filter(Utils.isItemDueToday);
      State.set({ items: dueToday, completions });
      Columns.render(dueToday, completions);
      Columns.updateProgress();
      await Dashboard.updateOverallProgress();
    } catch (err) {
      console.error('Failed to load column items:', err);
    }
  },

  render(items, completions) {
    const list = document.getElementById('items-list');
    Utils.clear(list);

    if (Dashboard.editMode) {
      Api.getItems(State.get('activeColumn').id).then(allItems => {
        allItems.forEach(item => list.appendChild(Columns.buildEditCard(item)));
        const addBtn = Utils.el('button', 'btn btn-ghost add-item-btn', '+ Add Item');
        addBtn.addEventListener('click', () => Columns.showItemModal(null));
        list.appendChild(addBtn);
      });
      return;
    }

    if (items.length === 0) {
      const empty = Utils.el('p', null, 'Nothing due today in this column.');
      empty.style.color = 'var(--text-muted)';
      list.appendChild(empty);
      return;
    }

    const required = items.filter(i => !i.optional);
    const optional = items.filter(i =>  i.optional);
    [...required, ...optional].forEach(item => {
      list.appendChild(Columns.buildCard(item, completions));
    });
  },

  // ── Kid view card ─────────────────────────────────────────────

  buildCard(item, completions) {
    const isDone = completions.some(c => c.item_id === item.id);
    const child  = State.get('activeChild');

    const card     = Utils.el('div', `item-card${isDone ? ' completed' : ''}${item.optional ? ' optional' : ''}`);
    card.dataset.itemId = item.id;

    const checkbox = Utils.el('div', `item-checkbox${isDone ? ' checked' : ''}`);
    if (isDone) checkbox.textContent = '✓';

    const name = Utils.el('span', 'item-name', item.name);

    card.appendChild(checkbox);
    card.appendChild(name);

    if (child.rewards && item.points_value > 0) {
      card.appendChild(Utils.el('span', 'item-points', `+${item.points_value}`));
    }

    if (item.optional) {
      card.appendChild(Utils.el('span', 'item-optional-badge', 'optional'));
    }

    card.addEventListener('click', () => Columns.toggleItem(item, card, checkbox));
    return card;
  },

  // ── Edit mode card ────────────────────────────────────────────

  buildEditCard(item) {
    const card   = Utils.el('div', 'item-card item-card-edit');
    card.dataset.itemId = item.id;

    const name   = Utils.el('span', 'item-name', item.name);
    const freq   = Utils.el('span', 'item-optional-badge', Utils.formatFrequency(item));
    const editBtn = Utils.el('button', 'btn btn-ghost btn-small', '✏️ Edit');
    const delBtn  = Utils.el('button', 'btn btn-ghost btn-small item-delete-btn', '🗑️');

    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      Columns._openItemModalWithColumn(item);
    });

    delBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!confirm(`Delete "${item.name}"?`)) return;
      await Api.deleteItem(item.id);
      const col = State.get('activeColumn');
      if (col) Columns.load(col); else Columns.loadViewAll();
    });

    card.appendChild(name);
    card.appendChild(freq);
    card.appendChild(editBtn);
    card.appendChild(delBtn);
    card.addEventListener('click', () => Columns._openItemModalWithColumn(item));
    return card;
  },

  // Resolve the item's column before opening the modal.
  // In View All, activeColumn is null so we look it up from the columns list.
  async _openItemModalWithColumn(item) {
    let column  = State.get('activeColumn');
    const wasInViewAll = !column;

    if (!column) {
      const columns = State.get('columns');
      for (const col of columns) {
        const items = await Api.getItems(col.id);
        if (items.some(i => i.id === item.id)) {
          column = col;
          break;
        }
      }
    }

    if (!column) {
      console.error('Could not find column for item', item);
      return;
    }

    // Temporarily set activeColumn so showItemModal can use it
    State.set({ activeColumn: column });
    Columns.showItemModal(item);

    // After the modal resolves, restore View All if that's where we came from.
    // We do this by overriding the reload that showItemModal triggers.
    // The modal's save button calls Columns.load(col) or loadViewAll() based
    // on activeColumn at the time — so we reset it before the modal closes.
    if (wasInViewAll) {
      // Watch for the modal being removed and reload View All
      const modal = document.getElementById('item-modal');
      if (!modal) return;

      const observer = new MutationObserver(() => {
        if (!document.getElementById('item-modal')) {
          observer.disconnect();
          State.set({ activeColumn: null });
          Columns.loadViewAll();
        }
      });

      observer.observe(document.body, { childList: true });
    }
  },

  // ── Item modal ────────────────────────────────────────────────

  showItemModal(item) {
    const isNew  = !item;
    const column = State.get('activeColumn');
    const overlay = Utils.el('div', 'modal-overlay');
    overlay.id   = 'item-modal';

    const days        = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
    const checkedDays = item?.frequency === 'specific' && item?.frequency_day
      ? item.frequency_day.split(',').map(d => d.trim()) : [];

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

    const freq = item?.frequency || 'daily';

    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-title">${isNew ? 'Add Item' : `Edit "${item.name}"`}</div>
        <div class="form-group">
          <label class="form-label">Name</label>
          <input class="form-input" id="modal-item-name" value="${item?.name || ''}" placeholder="e.g. Make your bed">
        </div>
        <div class="form-group">
          <label class="form-label">Frequency</label>
          <select class="form-select" id="modal-item-frequency">
            <option value="daily"    ${freq === 'daily'    ? 'selected' : ''}>Every day</option>
            <option value="weekdays" ${freq === 'weekdays' ? 'selected' : ''}>Weekdays (Mon–Fri)</option>
            <option value="weekends" ${freq === 'weekends' ? 'selected' : ''}>Weekends (Sat–Sun)</option>
            <option value="specific" ${freq === 'specific' ? 'selected' : ''}>Specific days</option>
            <option value="weekly"   ${freq === 'weekly'   ? 'selected' : ''}>Once a week</option>
            <option value="monthly"  ${freq === 'monthly'  ? 'selected' : ''}>Monthly</option>
          </select>
        </div>
        <div class="form-group" id="modal-specific-days" style="${freq === 'specific' ? '' : 'display:none'}">
          <label class="form-label">Which days?</label>
          <div class="day-checkboxes">${dayCheckboxes}</div>
        </div>
        <div class="form-group" id="modal-weekly-day" style="${freq === 'weekly' ? '' : 'display:none'}">
          <label class="form-label">Which day?</label>
          <select class="form-select" id="modal-item-weekly-day">
            ${days.map(d => `
              <option value="${d}" ${item?.frequency === 'weekly' && item?.frequency_day === d ? 'selected' : ''}>
                ${d.charAt(0).toUpperCase() + d.slice(1)}
              </option>
            `).join('')}
          </select>
        </div>
        <div class="form-group" id="modal-monthly-day" style="${freq === 'monthly' ? '' : 'display:none'}">
          <label class="form-label">Which day of the month?</label>
          <select class="form-select" id="modal-item-monthly-day">${domOptions}</select>
        </div>
        <div class="form-group">
          <label class="form-label">Points value</label>
          <input class="form-input" type="number" id="modal-item-points" value="${item?.points_value || 1}" min="0" max="100">
        </div>
        <div class="form-group" style="flex-direction:row;align-items:center;gap:var(--space-md)">
          <label class="form-label" style="margin:0">Optional / bonus</label>
          <input type="checkbox" id="modal-item-optional" ${item?.optional ? 'checked' : ''}>
        </div>
        <div class="modal-actions">
          <button class="btn btn-ghost" id="modal-item-cancel">Cancel</button>
          ${!isNew ? `<button class="btn btn-danger" id="modal-item-delete">Delete</button>` : ''}
          <button class="btn btn-primary" id="modal-item-save">${isNew ? 'Add Item' : 'Save'}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    document.getElementById('modal-item-name').focus();

    document.getElementById('modal-item-frequency').addEventListener('change', (e) => {
      document.getElementById('modal-specific-days').style.display = e.target.value === 'specific' ? '' : 'none';
      document.getElementById('modal-weekly-day').style.display    = e.target.value === 'weekly'   ? '' : 'none';
      document.getElementById('modal-monthly-day').style.display   = e.target.value === 'monthly'  ? '' : 'none';
    });

    const keyHandler = (e) => {
      if (e.key === 'Enter' && e.target.tagName !== 'SELECT') {
        document.getElementById('modal-item-save').click();
        document.removeEventListener('keydown', keyHandler);
      } else if (e.key === 'Escape') {
        overlay.remove();
        document.removeEventListener('keydown', keyHandler);
      }
    };
    document.addEventListener('keydown', keyHandler);

    document.getElementById('modal-item-cancel').addEventListener('click', () => {
      document.removeEventListener('keydown', keyHandler);
      overlay.remove();
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.removeEventListener('keydown', keyHandler);
        overlay.remove();
      }
    });

    document.getElementById('modal-item-delete')?.addEventListener('click', async () => {
      if (!confirm(`Delete "${item.name}"?`)) return;
      await Api.deleteItem(item.id);
      document.removeEventListener('keydown', keyHandler);
      overlay.remove();
      const col = State.get('activeColumn');
      if (col) Columns.load(col); else Columns.loadViewAll();
    });

    document.getElementById('modal-item-save').addEventListener('click', async () => {
      const name      = document.getElementById('modal-item-name').value.trim();
      const frequency = document.getElementById('modal-item-frequency').value;

      if (!name) { document.getElementById('modal-item-name').focus(); return; }

      let frequency_day = null;
      if (frequency === 'specific') {
        const checked = [...document.querySelectorAll('.day-checkbox:checked')].map(cb => cb.value);
        if (checked.length === 0) return alert('Please select at least one day.');
        frequency_day = checked.join(',');
      } else if (frequency === 'weekly') {
        frequency_day = document.getElementById('modal-item-weekly-day').value;
      } else if (frequency === 'monthly') {
        frequency_day = document.getElementById('modal-item-monthly-day').value;
      }

      const data = {
        column_id:    column.id,
        name,
        frequency,
        frequency_day,
        points_value: Number(document.getElementById('modal-item-points').value),
        optional:     document.getElementById('modal-item-optional').checked ? 1 : 0,
      };

      if (isNew) {
        await Api.createItem(data);
      } else {
        await Api.updateItem(item.id, data);
      }

      document.removeEventListener('keydown', keyHandler);
      overlay.remove();
      const col = State.get('activeColumn');
      if (col) Columns.load(col); else Columns.loadViewAll();
    });
  },

  // ── Toggle completion ─────────────────────────────────────────

  async toggleItem(item, cardEl, checkboxEl) {
    if (Dashboard.editMode) return;

    const child    = State.get('activeChild');
    const isDone   = State.isCompleted(item.id);
    const today    = Utils.today();
    const inViewAll = !State.get('activeColumn');

    try {
      if (isDone) {
        await Api.uncompleteItem({ item_id: item.id, child_id: child.id, date: today });
        const completions = State.get('completions').filter(c => c.item_id !== item.id);
        State.set({ completions });

        if (inViewAll) {
          // Re-render just this column's section instantly
          const col = State.get('columns').find(c => {
            // Find which column this item belongs to by checking the section wrapper
            return cardEl.closest(`[data-col-id]`)?.dataset.colId == c.id;
          });
          if (col) await Columns._refreshViewAllSection(col.id);
        } else {
          // Remove animation class so full color is immediately restored
          cardEl.classList.remove('animate-item-complete');
          cardEl.classList.remove('completed');
          checkboxEl.classList.remove('checked');
          checkboxEl.textContent = '';
        }

      } else {
        await Api.completeItem({ item_id: item.id, child_id: child.id, date: today });
        const completions = [...State.get('completions'), { item_id: item.id }];
        State.set({ completions });

        if (inViewAll) {
          // Animate then re-render the section so the item moves to completed group
          cardEl.classList.add('completed');
          checkboxEl.classList.add('checked');
          checkboxEl.textContent = '✓';
          Animations.checkboxPop(checkboxEl);

          // Short delay so the animation plays before the section re-renders
          setTimeout(async () => {
            const colId = Number(cardEl.closest('[data-col-id]')?.dataset.colId);
            if (colId) await Columns._refreshViewAllSection(colId);
          }, 400);
        } else {
          cardEl.classList.add('completed');
          checkboxEl.classList.add('checked');
          checkboxEl.textContent = '✓';
          Animations.checkboxPop(checkboxEl);
          Animations.itemComplete(cardEl);
        }

        if (child.rewards && item.points_value > 0) {
          Animations.pointsFloat(cardEl, item.points_value);
        }

        await Dashboard.refreshHeaderStats();

        if (State.allRequiredDone()) {
          Animations.celebrate(State.get('activeChild').name);
        }
      }

      Columns.updateProgress();
      await Dashboard.updateOverallProgress();

    } catch (err) {
      console.error('Failed to toggle item:', err);
    }
  },

  // ── Progress bar for active single column ─────────────────────

  updateProgress() {
    const col = State.get('activeColumn');
    if (!col) return;

    const items       = State.get('items');
    const completions = State.get('completions');
    const required    = items.filter(i => !i.optional);
    const completed   = required.filter(i => completions.some(c => c.item_id === i.id));

    Dashboard.updateColumnProgress(completed.length, required.length);
  },

};