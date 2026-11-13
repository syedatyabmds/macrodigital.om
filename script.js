(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$('[data-reveal], [data-lines]');
  $$('.steps, .rows').forEach((group) => {
    $$(':scope > [data-reveal]', group).forEach((el, i) => el.style.setProperty('--d', `${i * 0.08}s`));
  });

  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- Statement: words light up with scroll ---------- */
  const statement = $('[data-words]');
  const words = [];
  if (statement) {
    const text = statement.textContent.trim().split(/\s+/);
    statement.setAttribute('aria-label', text.join(' '));
    statement.textContent = '';
    text.forEach((word, i) => {
      const span = document.createElement('span');
      span.className = 'w';
      span.setAttribute('aria-hidden', 'true');
      span.textContent = word;
      statement.append(span, i < text.length - 1 ? ' ' : '');
      words.push(span);
    });
    if (reduceMotion) words.forEach((w) => w.classList.add('is-on'));
  }
  const updateWords = () => {
    if (!statement || reduceMotion) return;
    const r = statement.getBoundingClientRect();
    const vh = window.innerHeight;
    const progress = (vh * 0.85 - r.top) / (r.height + vh * 0.35);
    const lit = Math.round(clamp(progress, 0, 1) * words.length);
    words.forEach((w, i) => w.classList.toggle('is-on', i < lit));
  };

  /* ---------- Showcase rail: drifts on its own, pushed by scroll ---------- */
  const rail = $('[data-rail]');
  const track = $('[data-rail-track]');
  let railX = 0;
  let railVel = 0;
  let railHalf = 0;
  if (rail && track) {
    // Duplicate the screens once so the loop is seamless
    $$(':scope > *', track).forEach((node) => track.append(node.cloneNode(true)));
    const measure = () => {
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      railHalf = (track.scrollWidth + gap) / 2;
    };
    measure();
    window.addEventListener('resize', measure);
    if (reduceMotion) {
      track.style.transform = 'translateX(-4rem)';
    } else {
      let visible = true;
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(rail);
      let last = performance.now();
      const frame = (now) => {
        const dt = Math.min(50, now - last);
        last = now;
        if (visible && railHalf) {
          railX -= (0.045 + railVel * 0.02) * dt;
          railVel *= 0.92;
          railX = ((railX % railHalf) - railHalf) % railHalf;
          track.style.transform = `translate3d(${railX.toFixed(2)}px, 0, 0) skewX(${clamp(railVel * -0.08, -6, 6).toFixed(2)}deg)`;
        }
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    }
  }

  /* ---------- Header + scroll-linked bits ---------- */
  const header = $('[data-header]');
  const ticks = $('[data-ticks]');
  let lastY = window.scrollY;
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      const dy = y - lastY;
      if (header && !document.body.classList.contains('menu-open')) {
        if (y < 120 || dy < -2) header.classList.remove('is-hidden');
        else if (dy > 2) header.classList.add('is-hidden');
      }
      railVel = clamp(railVel + dy * 0.6, -60, 60);
      if (ticks && !reduceMotion) ticks.style.setProperty('--spin', `${(y * 0.03).toFixed(2)}deg`);
      updateWords();
      lastY = y;
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Menu ---------- */
  const menuBtn = $('[data-menu-btn]');
  const menu = $('[data-menu]');
  const menuLabel = $('[data-menu-label]');
  if (menuBtn && menu) {
    let timer;
    const setMenu = (open) => {
      clearTimeout(timer);
      menuBtn.setAttribute('aria-expanded', String(open));
      if (menuLabel) menuLabel.textContent = open ? 'Close' : 'Menu';
      if (open) {
        menu.hidden = false;
        requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('menu-open')));
      } else {
        document.body.classList.remove('menu-open');
        timer = setTimeout(() => { menu.hidden = true; }, reduceMotion ? 0 : 700);
      }
    };
    const isOpen = () => menuBtn.getAttribute('aria-expanded') === 'true';
    menuBtn.addEventListener('click', () => setMenu(!isOpen()));
    $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen()) { setMenu(false); menuBtn.focus(); } });
    document.addEventListener('click', (e) => { if (isOpen() && header && !header.contains(e.target)) setMenu(false); });
  }

  /* ---------- Service tabs ---------- */
  const tabsEl = $('[data-tabs]');
  if (tabsEl) {
    const tabs = $$('[role="tab"]', tabsEl);
    const pill = $('[data-tab-pill]', tabsEl);
    const movePill = (tab) => {
      if (!pill) return;
      pill.style.width = `${tab.offsetWidth}px`;
      pill.style.height = `${tab.offsetHeight}px`;
      pill.style.transform = `translate(${tab.offsetLeft}px, ${tab.offsetTop}px)`;
    };
    const select = (tab, focus) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) { panel.hidden = !on; panel.classList.toggle('is-active', on); }
      });
      movePill(tab);
      if (focus) tab.focus();
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', (e) => {
        const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!dir) return;
        e.preventDefault();
        select(tabs[(i + dir + tabs.length) % tabs.length], true);
      });
    });
    const current = () => tabs.find((t) => t.classList.contains('is-active')) || tabs[0];
    movePill(current());
    window.addEventListener('resize', () => movePill(current()));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => movePill(current()));
  }

  /* ---------- Pointer effects (desktop only) ---------- */
  if (finePointer && !reduceMotion) {
    $$('[data-magnetic]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.22;
        const y = (e.clientY - r.top - r.height / 2) * 0.32;
        el.style.transition = 'transform 0.15s ease-out, color 0.5s, background 0.4s';
        el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      });
      el.addEventListener('pointerleave', () => {
        el.style.transition = 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1), color 0.5s, background 0.4s';
        el.style.transform = '';
      });
    });

    $$('[data-tilt]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transition = 'transform 0.15s ease-out, background 0.4s';
        el.style.transform = `perspective(900px) rotateX(${(-py * 7).toFixed(2)}deg) rotateY(${(px * 7).toFixed(2)}deg)`;
      });
      el.addEventListener('pointerleave', () => {
        el.style.transition = 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), background 0.4s';
        el.style.transform = '';
      });
    });
  }

  /* ---------- Muscat clock + footer year ---------- */
  const clock = $('[data-clock]');
  if (clock) {
    const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Muscat' });
    const tick = () => { clock.textContent = fmt.format(new Date()); };
    tick();
    setInterval(tick, 15000);
  }
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
