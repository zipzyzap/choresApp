/*
  Screen router — shows and hides the three main screens.
  Screens: 'selector' | 'app' | 'settings'
  This is the last script to load and kicks everything off.
*/

const Router = {

  _history: [],

  // Returns the screen we were on before the current one
  previousScreen() {
    return Router._history[Router._history.length - 2] || 'selector';
  },

  // Show a screen by name
  show(screen) {
    // Settings is now a modal overlay — doesn't hide the current screen
    if (screen === 'settings') {
      Router._history.push('settings');
      Settings.showPinGate();
      Router._startSettingsTimeout();
      return;
    }

    // For all other screens, hide everything and show the target
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    Router._history.push(screen);

    switch (screen) {
      case 'selector':
        document.getElementById('screen-selector').classList.add('active');
        Children.init();
        break;

      case 'app':
        document.getElementById('screen-app').classList.add('active');
        break;
    }
  },

  // Go back to the previous screen
  back() {
    // Close any open settings modal first
    Settings.closeModal();
    Router._history.pop();
    const prev = Router._history[Router._history.length - 1] || 'selector';

    // Don't push to history again — just activate the screen
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

    if (prev === 'selector') {
      document.getElementById('screen-selector').classList.add('active');
      Children.init();
    } else if (prev === 'app') {
      document.getElementById('screen-app').classList.add('active');
    }
  },

  // Auto-exit settings after 5 minutes of inactivity
  _settingsTimer: null,

  _startSettingsTimeout() {
    Router._clearSettingsTimeout();
    Router._settingsTimer = setTimeout(() => {
      Settings.closeModal();
      Router._history.pop();
    }, 5 * 60 * 1000);
  },

  _clearSettingsTimeout() {
    if (Router._settingsTimer) {
      clearTimeout(Router._settingsTimer);
      Router._settingsTimer = null;
    }
  },

};

// ── Boot the app ──────────────────────────────────────────────────

(function init() {
  Dashboard.init();
  Settings.init();
  Router.show('selector');
})();