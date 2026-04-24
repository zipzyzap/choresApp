/*
  Main app shell — header, sidebar, edit mode, and progress tracking.
*/

const Dashboard = {

  editMode: false,

  init() {
    Dashboard.bindHeaderChildTap();
    Dashboard.bindSettingsButton();
  },

  // ── Header ────────────────────────────────────────────────────

  updateHeader(child) {
    document.getElementById('header-avatar').textContent = child.avatar;
    document.getElementById('header-name').textContent   = child.name;
    document.getElementById('header-date').textContent   = Utils.formatDate();

    const streakEl = document.getElementById('header-streak');
    streakEl.textContent = child.streak > 0 ? `🔥 ${child.streak}` : '';

    const pointsEl = document.getElementById('header-points');
    if (child.rewards) {
      pointsEl.textContent = `⭐ ${child.points}`;
      Utils.show(pointsEl);
    } else {
      Utils.hide(pointsEl);
    }

    // Re-render switcher with updated active child
    Children.renderSwitcher(State.get('children'));
  },

  // Refresh header stats after a completion
  async refreshHeaderStats() {
    const child = State.get('activeChild');
    if (!child) return;
    const updated = await Api.getChild(child.id);
    State.set({ activeChild: updated });
    Dashboard.updateHeader(updated);
  },

  // ── Overall progress (header bar + fraction) ──────────────────

  // Called after any completion change — tallies across ALL columns
  async updateOverallProgress() {
    const child   = State.get('activeChild');
    const columns = State.get('columns');
    if (!child || !columns.length) return;

    const today = Utils.today();
    let totalRequired  = 0;
    let totalCompleted = 0;

    // Fetch all items and completions across all columns
    await Promise.all(columns.map(async col => {
      const items       = await Api.getItems(col.id);
      const completions = await Api.getCompletions(child.id, today);
      const due         = items.filter(i => !i.optional && Utils.isItemDueToday(i));

      totalRequired  += due.length;
      totalCompleted += due.filter(i => completions.some(c => c.item_id === i.id)).length;
    }));

    const pct      = totalRequired > 0 ? Math.round((totalCompleted / totalRequired) * 100) : 0;
    const complete = totalCompleted >= totalRequired && totalRequired > 0;

    // Update header fraction
    const fraction = document.getElementById('header-progress-fraction');
    if (fraction) fraction.textContent = `${totalCompleted} of ${totalRequired} done`;

    // Update header bar
    const bar = document.getElementById('header-progress-bar');
    if (bar) {
      bar.style.width = `${pct}%`;
      bar.classList.toggle('complete', complete);
    }
  },

  // ── Child switcher dropdown ───────────────────────────────────

  bindHeaderChildTap() {
    const childEl  = document.getElementById('header-child');
    const switcher = document.getElementById('child-switcher');

    childEl.addEventListener('click', (e) => {
      e.stopPropagation();
      Utils.toggle(switcher);
    });

    document.addEventListener('click', () => Utils.hide(switcher));
  },

  // ── Settings button (now only used from selector screen) ──────

  bindSettingsButton() {
    document.getElementById('btn-parent-login')?.addEventListener('click', () => {
      Router.show('settings');
    });
  },

  // ── Edit mode ─────────────────────────────────────────────────

  enterEditMode() {
    Dashboard.editMode = true;
    Dashboard.showEditBanner();

    // Reload whichever view is currently active
    const col = State.get('activeColumn');
    if (col) Columns.load(col); else Columns.loadViewAll();

    Dashboard.renderSidebar(State.get('columns'));
    Children.renderSwitcher(State.get('children'));
  },

  exitEditMode() {
    Dashboard.editMode = false;
    Dashboard.hideEditBanner();

    // Reload whichever view is currently active
    const col = State.get('activeColumn');
    if (col) Columns.load(col); else Columns.loadViewAll();

    Dashboard.renderSidebar(State.get('columns'));
    Children.renderSwitcher(State.get('children'));
  },

  showEditBanner() {
    Dashboard.hideEditBanner();
    const banner = Utils.el('div', 'edit-mode-banner');
    banner.id = 'edit-mode-banner';
    banner.innerHTML = `
      <span>✏️ Edit Mode — tap items to edit, use + to add</span>
      <button class="edit-mode-done" id="btn-edit-done">Done</button>
    `;
    const main = document.getElementById('main-content');
    main.insertBefore(banner, main.firstChild);
    document.getElementById('btn-edit-done').addEventListener('click', () => Dashboard.exitEditMode());
  },

  hideEditBanner() {
    document.getElementById('edit-mode-banner')?.remove();
  },

  // ── Sidebar ───────────────────────────────────────────────────

  async loadColumns(childId) {
    try {
      const columns = await Api.getColumns(childId);
      State.set({ columns, activeColumn: null });
      Dashboard.renderSidebar(columns);

      // Always load View All first
      await Columns.loadViewAll();
    } catch (err) {
      console.error('Failed to load columns:', err);
    }
  },

  renderSidebar(columns) {
    const container = document.getElementById('sidebar-columns');
    Utils.clear(container);

    // View All button — always first, above a divider
    const viewAllBtn = Utils.el('button', 'sidebar-view-all-btn');
    viewAllBtn.dataset.viewAll = 'true';
    viewAllBtn.innerHTML = `
      <span class="sidebar-col-icon">📋</span>
      <span class="sidebar-col-label">All</span>
    `;

    if (!State.get('activeColumn')) viewAllBtn.classList.add('active');
    viewAllBtn.addEventListener('click', () => Columns.loadViewAll());
    container.appendChild(viewAllBtn);

    // Parent-defined columns
    columns.forEach(col => {
      const btn = Utils.el('button', 'sidebar-col-btn');
      btn.dataset.columnId = col.id;
      btn.innerHTML = `
        <span class="sidebar-col-icon">${col.icon}</span>
        <span class="sidebar-col-label">${col.name}</span>
      `;

      if (State.get('activeColumn')?.id === col.id) btn.classList.add('active');
      btn.addEventListener('click', () => Columns.load(col));
      container.appendChild(btn);
    });

    // + Add Column button in edit mode
    if (Dashboard.editMode) {
      const addBtn = Utils.el('button', 'sidebar-add-col-btn', '+ Col');
      addBtn.title = 'Add Column';
      addBtn.addEventListener('click', () => Dashboard.showAddColumnModal());
      container.appendChild(addBtn);
    }
  },

  setActiveColumnBtn(columnId) {
    // Clear all active states
    document.querySelectorAll('.sidebar-col-btn, .sidebar-view-all-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    if (columnId === null) {
      // Activate the View All button
      document.querySelector('.sidebar-view-all-btn')?.classList.add('active');
    } else {
      document.querySelectorAll('.sidebar-col-btn').forEach(btn => {
        btn.classList.toggle('active', Number(btn.dataset.columnId) === columnId);
      });
    }
  },

  // ── Column progress bar (above item list) ─────────────────────

  updateColumnProgress(completed, total) {
    const wrap     = document.getElementById('column-progress-wrap');
    const fraction = document.getElementById('column-progress-fraction');
    const fill     = document.getElementById('column-progress-fill');

    if (!wrap || !fraction || !fill) return;

    if (total === 0) {
      Utils.hide(wrap);
      return;
    }

    Utils.show(wrap);
    const pct      = Math.round((completed / total) * 100);
    const complete = completed >= total;

    fraction.textContent = `${completed} of ${total}`;
    fill.style.width     = `${pct}%`;
    fill.classList.toggle('complete', complete);
  },

  // ── Add column modal ──────────────────────────────────────────

  showAddColumnModal() {
    const overlay = Utils.el('div', 'modal-overlay');
    overlay.id = 'add-col-modal';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-title">Add Column</div>
        <div class="form-group">
          <label class="form-label">Name</label>
          <input class="form-input" id="modal-col-name" placeholder="e.g. Chores">
        </div>
        <div class="form-group">
          <label class="form-label">Icon (emoji)</label>
          <input class="form-input" id="modal-col-icon" value="📋" style="font-size:1.2rem">
        </div>
        <div class="form-group" style="flex-direction:row;align-items:center;gap:var(--space-md)">
          <label class="form-label" style="margin:0">Points eligible</label>
          <input type="checkbox" id="modal-col-points">
        </div>
        <div class="modal-actions">
          <button class="btn btn-ghost" id="modal-col-cancel">Cancel</button>
          <button class="btn btn-primary" id="modal-col-save">Add Column</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    const nameInput = document.getElementById('modal-col-name');
    nameInput.focus();

    const keyHandler = (e) => {
      if (e.key === 'Enter') {
        document.getElementById('modal-col-save').click();
        document.removeEventListener('keydown', keyHandler);
      } else if (e.key === 'Escape') {
        overlay.remove();
        document.removeEventListener('keydown', keyHandler);
      }
    };
    document.addEventListener('keydown', keyHandler);

    document.getElementById('modal-col-cancel').addEventListener('click', () => {
      document.removeEventListener('keydown', keyHandler);
      overlay.remove();
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.removeEventListener('keydown', keyHandler);
        overlay.remove();
      }
    });

    document.getElementById('modal-col-save').addEventListener('click', async () => {
      const name = document.getElementById('modal-col-name').value.trim();
      const icon = document.getElementById('modal-col-icon').value.trim();
      const pts  = document.getElementById('modal-col-points').checked ? 1 : 0;

      if (!name) { nameInput.focus(); return; }

      const child  = State.get('activeChild');
      const newCol = await Api.createColumn({
        child_id: child.id, name, icon: icon || '📋', points_eligible: pts,
      });

      document.removeEventListener('keydown', keyHandler);
      overlay.remove();

      const columns = await Api.getColumns(child.id);
      State.set({ columns });
      Dashboard.renderSidebar(columns);
      await Columns.load(newCol);
    });
  },

};