(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$('[data-reveal], [data-lines]');

  // Stagger siblings that reveal together (cards, list rows)
  $$('.services, .steps, .facts, .hero-foot').forEach((group) => {
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

  /* ---------- Statement: words light up as you scroll ---------- */
  const statement = document.querySelector('[data-words]');
  let words = [];
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
    const rect = statement.getBoundingClientRect();
    const vh = window.innerHeight;
    // 0 when the block's top hits 85% of the viewport, 1 when its bottom hits 45%
    const progress = (vh * 0.85 - rect.top) / (rect.height + vh * 0.4);
    const lit = Math.round(Math.min(1, Math.max(0, progress)) * words.length);
    words.forEach((w, i) => w.classList.toggle('is-on', i < lit));
  };

  /* ---------- Header: hide on scroll down, show on scroll up ---------- */
  const header = document.querySelector('[data-header]');
  let lastY = window.scrollY;
  const updateHeader = () => {
    if (!header) return;
    const y = window.scrollY;
    const menuOpen = document.body.classList.contains('menu-open');
    header.classList.toggle('is-hidden', !menuOpen && y > lastY && y > 200);
    lastY = y;
  };

  /* ---------- Active nav link ---------- */
  const navLinks = $$('.nav-pill a');
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);
  const updateNav = () => {
    const mid = window.innerHeight * 0.4;
    let current = null;
    sections.forEach((s) => {
      const r = s.getBoundingClientRect();
      if (r.top <= mid && r.bottom > mid) current = s.id;
    });
    navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${current}`));
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateHeader();
      updateNav();
      updateWords();
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Mobile menu ---------- */
  const menuBtn = document.querySelector('[data-menu-btn]');
  const menu = document.querySelector('[data-menu]');
  if (menuBtn && menu) {
    let closeTimer;
    const setMenu = (open) => {
      clearTimeout(closeTimer);
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      if (open) {
        menu.hidden = false;
        // Next frame so the clip-path transition runs
        requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('menu-open')));
      } else {
        document.body.classList.remove('menu-open');
        closeTimer = setTimeout(() => { menu.hidden = true; }, reduceMotion ? 0 : 800);
      }
    };
    menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
    $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
    window.matchMedia('(min-width: 821px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });
  }

  /* ---------- Pointer effects (desktop only) ---------- */
  if (finePointer && !reduceMotion) {
    // Magnetic buttons
    $$('[data-magnetic]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.25;
        const y = (e.clientY - r.top - r.height / 2) * 0.35;
        el.style.transition = 'transform 0.15s ease-out, color 0.5s, border-color 0.5s';
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener('pointerleave', () => {
        el.style.transition = 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1), color 0.5s, border-color 0.5s';
        el.style.transform = '';
      });
    });

    // Tilting cards
    $$('[data-tilt]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transition = 'transform 0.15s ease-out, background 0.5s, border-color 0.5s';
        el.style.transform = `perspective(900px) rotateX(${(-py * 6).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg)`;
      });
      el.addEventListener('pointerleave', () => {
        el.style.transition = 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), background 0.5s, border-color 0.5s';
        el.style.transform = '';
      });
    });

    // Hero stage parallax
    const stage = document.querySelector('[data-stage]');
    if (stage) {
      stage.addEventListener('pointermove', (e) => {
        const r = stage.getBoundingClientRect();
        stage.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
        stage.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
      });
      stage.addEventListener('pointerleave', () => {
        stage.style.setProperty('--mx', 0);
        stage.style.setProperty('--my', 0);
      });
    }
  }

  /* ---------- Muscat clock + footer year ---------- */
  const clock = document.querySelector('[data-clock]');
  if (clock) {
    const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Muscat' });
    const tick = () => { clock.textContent = fmt.format(new Date()); };
    tick();
    setInterval(tick, 15000);
  }

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
