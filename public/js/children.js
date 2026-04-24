/*
  Child selector screen — the Netflix-style profile picker shown on load.
  Also handles the child switcher dropdown in the header.
*/

const Children = {

  async init() {
    try {
      const children = await Api.getChildren();
      State.set({ children });
      Children.renderSelector(children);
      Children.renderSwitcher(children);
    } catch (err) {
      console.error('Failed to load children:', err);
    }
  },

  // Build the full-screen child picker
  renderSelector(children) {
    const list = document.getElementById('child-list');
    Utils.clear(list);

    if (children.length === 0) {
      const empty = Utils.el('p', null, 'No children yet — add one in Parent Settings.');
      empty.style.color = 'var(--text-muted)';
      list.appendChild(empty);
      return;
    }

    children.forEach(child => {
      const card = Utils.el('div', 'child-card');
      card.style.borderColor = child.accent || 'var(--border)';
      card.innerHTML = `
        <span class="child-card-avatar">${child.avatar}</span>
        <span class="child-card-name">${child.name}</span>
      `;
      card.addEventListener('click', () => Children.select(child));
      list.appendChild(card);
    });
  },

  // Build the header dropdown — child switcher + actions
  renderSwitcher(children) {
    const switcher = document.getElementById('child-switcher');
    Utils.clear(switcher);

    // Other children to switch to
    const activeId = State.get('activeChild')?.id;
    const others   = children.filter(c => c.id !== activeId);

    others.forEach(child => {
      const item = Utils.el('div', 'child-switcher-item');
      item.innerHTML = `<span>${child.avatar}</span><span>${child.name}</span>`;
      item.addEventListener('click', () => {
        Utils.hide(switcher);
        Children.select(child);
      });
      switcher.appendChild(item);
    });

    // Divider before actions
    const divider = Utils.el('div', 'child-switcher-divider');
    switcher.appendChild(divider);

    // Switch child — back to selector screen
    const switchItem = Utils.el('div', 'child-switcher-item child-switcher-action');
    switchItem.innerHTML = `<span>👤</span><span>Switch child</span>`;
    switchItem.addEventListener('click', () => {
      Utils.hide(switcher);
      if (Dashboard.editMode) Dashboard.exitEditMode();
      Router.show('selector');
      Themes.reset();
    });
    switcher.appendChild(switchItem);

    // Edit mode — triggers PIN then enters edit mode
    const editItem = Utils.el('div', 'child-switcher-item child-switcher-action');
    editItem.innerHTML = `<span>✏️</span><span>Edit chores</span>`;
    editItem.addEventListener('click', () => {
      Utils.hide(switcher);
      if (Dashboard.editMode) {
        Dashboard.exitEditMode();
      } else {
        Router.show('settings');
      }
    });
    switcher.appendChild(editItem);

    // Parent settings — full settings dashboard
    const settingsItem = Utils.el('div', 'child-switcher-item child-switcher-action');
    settingsItem.innerHTML = `<span>⚙️</span><span>Parent settings</span>`;
    settingsItem.addEventListener('click', () => {
      Utils.hide(switcher);
      // Force settings to go to dashboard regardless of current screen
      Router._history.push('selector');
      Router.show('settings');
    });
    switcher.appendChild(settingsItem);
  },

  // Select a child and load their dashboard
  async select(child) {
    State.set({ activeChild: child });
    Themes.apply(child.theme, child.accent);
    Dashboard.updateHeader(child);
    await Dashboard.loadColumns(child.id);
    Router.show('app');
  },

};