/*
  Central app state — single source of truth.
  Nothing mutates state directly; everything goes through State.set().
  This makes it easy to track what changed and why.
*/

const State = {

  // ── Current state ─────────────────────────────────────────────

  data: {
    children:      [],      // all child profiles
    activeChild:   null,    // currently selected child object
    columns:       [],      // columns for the active child
    activeColumn:  null,    // currently selected column object
    items:         [],      // items in the active column
    completions:   [],      // completions for today
    settings:      {},      // app settings key/value
    pinLockout:    false,   // true when PIN is locked out
    pinAttempts:   0,       // failed PIN attempts this session
  },

  // ── Listeners ─────────────────────────────────────────────────

  _listeners: {},

  // Subscribe to state changes: State.on('activeChild', fn)
  on(key, fn) {
    if (!this._listeners[key]) this._listeners[key] = [];
    this._listeners[key].push(fn);
  },

  // Trigger all listeners for a key
  _emit(key, value) {
    (this._listeners[key] || []).forEach(fn => fn(value));
  },

  // ── Mutations ─────────────────────────────────────────────────

  // Update one or more keys and notify listeners
  set(updates) {
    for (const [key, value] of Object.entries(updates)) {
      this.data[key] = value;
      this._emit(key, value);
    }
  },

  // Shorthand getters
  get(key) {
    return this.data[key];
  },

  // Check if an item is completed today
  isCompleted(itemId) {
    return this.data.completions.some(c => c.item_id === itemId);
  },

  // Count completed required items for today (used for streak + celebration)
  completedRequiredCount() {
    const required = this.data.items.filter(i => !i.optional && Utils.isItemDueToday(i));
    return required.filter(i => this.isCompleted(i.id)).length;
  },

  requiredCount() {
    return this.data.items.filter(i => !i.optional && Utils.isItemDueToday(i)).length;
  },

  // True when all required items for the active column are done
  allRequiredDone() {
    return this.requiredCount() > 0 &&
           this.completedRequiredCount() >= this.requiredCount();
  },

};