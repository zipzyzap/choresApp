/*
  Shared utility functions used across the app.
  No dependencies — this loads first.
*/

const Utils = {

  // Format today's date as YYYY-MM-DD for DB queries
  today() {
    return new Date().toISOString().slice(0, 10);
  },

  // Format a date string for display: "Wednesday, April 9"
  formatDate(dateStr) {
    const date = dateStr ? new Date(dateStr + 'T00:00:00') : new Date();
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  },

  // Get the day name for today: 'monday', 'tuesday', etc.
  todayName() {
    return new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  },

  // Get today's day-of-week number: 0 = Sunday, 6 = Saturday
  todayDow() {
    return new Date().getDay();
  },

  // Get today's day of the month: 1-31
  todayDom() {
    return new Date().getDate();
  },

  // Check if an item should appear today based on its frequency
  isItemDueToday(item) {
    const dow  = Utils.todayDow();
    const name = Utils.todayName();
    const dom  = Utils.todayDom();

    switch (item.frequency) {

      case 'daily':
        return true;

      case 'weekdays':
        return dow >= 1 && dow <= 5;

      case 'weekends':
        return dow === 0 || dow === 6;

      case 'weekly':
        // frequency_day holds a single day name: 'monday'
        return item.frequency_day === name;

      case 'specific': {
        // frequency_day holds a comma-separated list: 'monday,tuesday,friday'
        if (!item.frequency_day) return false;
        const days = item.frequency_day.split(',').map(d => d.trim());
        return days.includes(name);
      }

      case 'monthly': {
        // frequency_day holds a day of the month as a string: '1', '15', 'last'
        if (!item.frequency_day) return dom === 1;
        if (item.frequency_day === 'last') {
          // Check if today is the last day of the month
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          return tomorrow.getDate() === 1;
        }
        return dom === parseInt(item.frequency_day);
      }

      default:
        return true;
    }
  },

  // Create a DOM element with optional class and text
  el(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  },

  // Show an element (removes 'hidden')
  show(el) {
    el?.classList.remove('hidden');
  },

  // Hide an element (adds 'hidden')
  hide(el) {
    el?.classList.add('hidden');
  },

  // Toggle visibility
  toggle(el) {
    el?.classList.toggle('hidden');
  },

  // Remove all children from a DOM element
  clear(el) {
    while (el?.firstChild) el.removeChild(el.firstChild);
  },

  // Simple debounce — delays fn until ms have passed since last call
  debounce(fn, ms = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  },

  // Generate a random item from an array
  pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  },

  // Format a frequency + frequency_day into a readable string
  formatFrequency(item) {
    switch (item.frequency) {
      case 'daily':    return 'Every day';
      case 'weekdays': return 'Weekdays';
      case 'weekends': return 'Weekends';
      case 'weekly':   return item.frequency_day
        ? item.frequency_day.charAt(0).toUpperCase() + item.frequency_day.slice(1) + 's'
        : 'Weekly';
      case 'specific': return item.frequency_day
        ? item.frequency_day.split(',').map(d => d.trim().slice(0, 3).charAt(0).toUpperCase() + d.trim().slice(1, 3)).join(', ')
        : 'Specific days';
      case 'monthly':  return item.frequency_day === 'last'
        ? 'Last day of month'
        : `Monthly (${item.frequency_day ? Utils._ordinal(parseInt(item.frequency_day)) : '1st'})`;
      default:         return item.frequency;
    }
  },

  // Convert a number to an ordinal string: 1 → '1st', 2 → '2nd', etc.
  _ordinal(n) {
    const s = ['th','st','nd','rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  },

};