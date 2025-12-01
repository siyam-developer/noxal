/* type.js
   All interactivity for the single-file site:
   - Mobile nav toggle
   - Smooth scrolling for internal links
   - Reveal on scroll (IntersectionObserver)
   - Back-to-top button
   - Dark mode toggle (persisted)
   - Contact form validation / fake send
   - Testimonials slider
   - FAQ interactions (details used for semantic reasons)
*/

/* Utility helpers */
const qs = (s, ctx = document) => ctx.querySelector(s);
const qsa = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const hamburger = qs('#hamburger');
  const mobileNav = qs('#mobileNav');
  const mobileClose = qs('#mobileClose');
  const mobileLinks = qsa('.mobile-link');
  const mainLinks = qsa('.nav-link');
  const backTop = qs('#backTop');
  const darkToggle = qs('#darkToggle');
  const body = document.body;
  const yearEl = qs('#year');
  const contactForm = qs('#contactForm');
  const formResponse = qs('#formResponse');

  // Year
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* Mobile nav open/close */
  function openMobile() {
    if (!mobileNav || !hamburger) return;
    mobileNav.classList.add('open');
    mobileNav.setAttribute('aria-hidden', 'false');
    hamburger.setAttribute('aria-expanded', 'true');
  }
  function closeMobile() {
    if (!mobileNav || !hamburger) return;
    mobileNav.classList.remove('open');
    mobileNav.setAttribute('aria-hidden', 'true');
    hamburger.setAttribute('aria-expanded', 'false');
  }
  if (hamburger) hamburger.addEventListener('click', openMobile);
  if (mobileClose) mobileClose.addEventListener('click', closeMobile);
  mobileLinks.forEach(l => l.addEventListener('click', closeMobile));

  /* Nav links: smooth scroll to sections */
  const allScrollLinks = [...mainLinks, ...mobileLinks, ...qsa('a[href^="#"]')];
  allScrollLinks.forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // close mobile nav when clicking a nav item
        if (mobileNav && mobileNav.classList.contains('open')) closeMobile();
      }
    });
  });

  /* Reveal on scroll using IntersectionObserver */
  const observer = new IntersectionObserver((entries) => {
    for (const ent of entries) {
      if (ent.isIntersecting) {
        ent.target.classList.add('is-visible');
        observer.unobserve(ent.target);
      }
    }
  }, { threshold: 0.12 });
  qsa('[data-animate]').forEach(el => observer.observe(el));

  /* Back to top button */
  const showBackTop = () => {
    if (!backTop) return;
    backTop.style.display = (window.scrollY > 600) ? 'block' : 'none';
  };
  window.addEventListener('scroll', showBackTop);
  showBackTop();
  if (backTop) backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* Dark mode toggle with persistence */
  const themeKey = 'procorp-theme';
  const applyTheme = (mode) => {
    if (mode === 'dark') {
      body.classList.add('theme-dark');
      body.classList.remove('theme-light');
    } else {
      body.classList.add('theme-light');
      body.classList.remove('theme-dark');
    }
    try { localStorage.setItem(themeKey, mode); } catch (e) { /* ignore */ }
    // update icon
    if (darkToggle) darkToggle.innerHTML = mode === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
  };
  // init theme
  const stored = (() => { try { return localStorage.getItem(themeKey); } catch (e) { return null; } })();
  if (stored) applyTheme(stored);
  else {
    // system preference fallback
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  }
  if (darkToggle) darkToggle.addEventListener('click', () => {
    const isDark = body.classList.contains('theme-dark');
    applyTheme(isDark ? 'light' : 'dark');
  });

  /* Contact form validation and fake submit */
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!formResponse) return;
      formResponse.textContent = '';
      const form = e.target;
      const data = {
        name: (form.name && form.name.value) ? form.name.value.trim() : '',
        email: (form.email && form.email.value) ? form.email.value.trim() : '',
        message: (form.message && form.message.value) ? form.message.value.trim() : ''
      };
      // Basic validation
      if (!data.name) return showFormError('Please enter your name.');
      if (!validateEmail(data.email)) return showFormError('Please enter a valid email.');
      if (!data.message || data.message.length < 10) return showFormError('Message must be at least 10 characters.');

      // Fake send: simulate network delay
      formResponse.style.color = getComputedStyle(document.documentElement).getPropertyValue('--accent-600') || '#0b77d1';
      formResponse.textContent = 'Sending…';
      setTimeout(() => {
        formResponse.textContent = 'Thank you! Your message has been received. We will contact you shortly.';
        form.reset();
      }, 900);
    });
  }
  function showFormError(msg) {
    if (!formResponse) return;
    formResponse.style.color = '#d9534f';
    formResponse.textContent = msg;
  }
  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email || '').toLowerCase());
  }

  /* Testimonials slider (simple) */
  const track = qs('#tsTrack');
  const prevBtn = qs('#prevTest');
  const nextBtn = qs('#nextTest');
  if (track) {
    const items = qsa('.testimonial', track);
    let idx = 0;
    function showIdx(i) {
      if (!items.length) return;
      idx = (i + items.length) % items.length;
      const offset = -idx * 100;
      track.style.display = 'flex';
      track.style.gap = '1rem';
      track.style.transition = 'transform .5s';
      // set width so each item occupies 100% of track container
      items.forEach(it => it.style.minWidth = '100%');
      track.style.transform = `translateX(${offset}%)`;
    }
    if (prevBtn) prevBtn.addEventListener('click', () => showIdx(idx - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => showIdx(idx + 1));
    // autoplay
    let tsInterval = setInterval(() => showIdx(idx + 1), 5000);
    [prevBtn, nextBtn, track].forEach(el => el && el.addEventListener('mouseenter', () => clearInterval(tsInterval)));
    [prevBtn, nextBtn, track].forEach(el => el && el.addEventListener('mouseleave', () => tsInterval = setInterval(() => showIdx(idx + 1), 5000)));
    showIdx(0);
  }

  /* Accessibility: close mobile nav on escape */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (mobileNav && mobileNav.classList.contains('open')) closeMobile();
    }
  });

  /* Optional: enhance details/summary keyboard behaviour for FAQ */
  qsa('.faq-item summary').forEach(sum => {
    sum.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sum.parentElement.open = !sum.parentElement.open; }
    });
  });

  /* small performance: lazy load images using loading=lazy already present. */

}); // DOMContentLoaded end