// Init AOS scroll animations
AOS.init({ duration: 800, once: true, easing: 'ease-out-cubic' });

// Mobile menu toggle
(() => {
  const btn = document.querySelector('.menu-btn');
  const nav = document.querySelector('header nav');
  if (!btn || !nav) return;
  btn.addEventListener('click', () => {
    const open = nav.classList.toggle('mobile-open');
    nav.classList.toggle('hidden', !open);
    btn.setAttribute('aria-expanded', String(open));
  });
  nav.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => {
      nav.classList.remove('mobile-open');
      nav.classList.add('hidden');
      btn.setAttribute('aria-expanded', 'false');
    })
  );
})();

// Footer year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
