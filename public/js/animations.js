/*
  Animation triggers — called by other modules when things happen.
  Keeps animation logic out of business logic.
*/

const Animations = {

  // Pop the checkbox when an item is completed
  checkboxPop(checkboxEl) {
    checkboxEl.classList.remove('animate-checkbox-pop');
    // Force reflow so the animation restarts if triggered again
    void checkboxEl.offsetWidth;
    checkboxEl.classList.add('animate-checkbox-pop');
  },

  // Slide/fade the item card when completed
  itemComplete(cardEl) {
    cardEl.classList.add('animate-item-complete');
  },

  // Bump the streak counter in the header
  streakBump() {
    const el = document.getElementById('header-streak');
    if (!el) return;
    el.classList.remove('animate-streak-bump');
    void el.offsetWidth;
    el.classList.add('animate-streak-bump');
  },

  // Float a +N points indicator above an element
  pointsFloat(anchorEl, points) {
    if (!anchorEl || points <= 0) return;
    const floater = Utils.el('div', 'points-float', `+${points}`);
    const rect    = anchorEl.getBoundingClientRect();
    floater.style.left = `${rect.left + rect.width / 2}px`;
    floater.style.top  = `${rect.top}px`;
    document.body.appendChild(floater);
    floater.addEventListener('animationend', () => floater.remove());
  },

  // Full-screen celebration when all required chores are done
  celebrate(childName) {
    const overlay = document.getElementById('celebration');
    if (!overlay) return;

    const messages = [
      `Amazing job, ${childName}! 🎉`,
      `All done! You crushed it! ⭐`,
      `${childName} is a superstar! 🌟`,
      `Everything's done! Way to go! 🏆`,
    ];

    overlay.innerHTML = `
      <div class="celebration-emoji">🎉</div>
      <div class="celebration-text">${Utils.pick(messages)}</div>
    `;

    Utils.show(overlay);
    Animations._launchConfetti();

    // Auto-dismiss after 3.5 seconds
    setTimeout(() => {
      Utils.hide(overlay);
      Utils.clear(overlay);
    }, 3500);
  },

  // Create and animate confetti pieces
  _launchConfetti() {
    const colors = ['#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#ff922b','#cc5de8'];
    const count  = 60;

    for (let i = 0; i < count; i++) {
      const piece = Utils.el('div', 'confetti-piece');
      piece.style.left            = `${Math.random() * 100}vw`;
      piece.style.top             = `-20px`;
      piece.style.background      = Utils.pick(colors);
      piece.style.animationDuration = `${1.5 + Math.random() * 2}s`;
      piece.style.animationDelay  = `${Math.random() * 0.8}s`;
      document.body.appendChild(piece);
      piece.addEventListener('animationend', () => piece.remove());
    }
  },

};