/*
  Theme management — applies a child's theme and accent color to the page.
*/

const Themes = {

  AVAILABLE: [
    { id: 'default',   label: 'Default',   emoji: '🌙' },
    { id: 'space',     label: 'Space',     emoji: '🚀' },
    { id: 'ocean',     label: 'Ocean',     emoji: '🌊' },
    { id: 'adventure', label: 'Adventure', emoji: '🌲' },
    { id: 'sunset',    label: 'Sunset',    emoji: '🌅' },
    { id: 'minimal',   label: 'Minimal',   emoji: '⬜' },
  ],

  // Apply a theme + accent color for the active child
  apply(theme, accent) {
    document.body.dataset.theme = theme || 'default';

    if (accent) {
      document.documentElement.style.setProperty('--accent', accent);
      // Derive lighter/darker shades from the accent
      document.documentElement.style.setProperty('--accent-light', Themes._lighten(accent, 30));
      document.documentElement.style.setProperty('--accent-dark',  Themes._darken(accent, 20));
    }
  },

  // Reset to defaults (used when returning to child selector)
  reset() {
    document.body.dataset.theme = 'default';
    document.documentElement.style.removeProperty('--accent');
    document.documentElement.style.removeProperty('--accent-light');
    document.documentElement.style.removeProperty('--accent-dark');
  },

  // Lighten a hex color by a percentage
  _lighten(hex, pct) {
    return Themes._adjustBrightness(hex, pct);
  },

  // Darken a hex color by a percentage
  _darken(hex, pct) {
    return Themes._adjustBrightness(hex, -pct);
  },

  _adjustBrightness(hex, pct) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r   = Math.min(255, Math.max(0, (num >> 16) + Math.round(255 * pct / 100)));
    const g   = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + Math.round(255 * pct / 100)));
    const b   = Math.min(255, Math.max(0, (num & 0xff) + Math.round(255 * pct / 100)));
    return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
  },

};