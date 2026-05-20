/* =====================================================================
   CelesiumAI — Studio Site v2 — Interactions
   ===================================================================== */

(() => {
  'use strict';

  document.documentElement.classList.add('js');

  /* ---------- Scroll-triggered reveals ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  try {
    if ('IntersectionObserver' in window && revealEls.length) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.08, rootMargin: '0px' });
      revealEls.forEach((el, i) => {
        // Auto-stagger if no explicit delay set
        if (!el.style.getPropertyValue('--reveal-delay')) {
          const sib = el.parentElement && el.parentElement.querySelectorAll(':scope > .reveal');
          if (sib && sib.length > 1) {
            const idx = Array.from(sib).indexOf(el);
            el.style.setProperty('--reveal-delay', `${Math.min(idx * 80, 480)}ms`);
          }
        }
        io.observe(el);
      });
    } else {
      revealEls.forEach((el) => el.classList.add('is-in'));
    }
  } catch (err) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-in'));
  }

  setTimeout(() => {
    document.querySelectorAll('.reveal:not(.is-in)').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 1.5) el.classList.add('is-in');
    });
  }, 2500);

  /* ---------- Portfolio card hover gradient ---------- */
  document.querySelectorAll('.pcard').forEach((card) => {
    card.addEventListener('pointermove', (ev) => {
      const r = card.getBoundingClientRect();
      const x = ((ev.clientX - r.left) / r.width) * 100;
      const y = ((ev.clientY - r.top) / r.height) * 100;
      card.style.setProperty('--mx', `${x}%`);
      card.style.setProperty('--my', `${y}%`);
    });
  });

  /* ---------- Page transition (fake SPA feel on static pages) ---------- */
  let overlay = document.querySelector('.pt-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'pt-overlay';
    document.body.appendChild(overlay);
  }

  // Run page-in animation
  requestAnimationFrame(() => {
    overlay.classList.remove('is-active');
  });

  // Intercept internal nav clicks for smooth out-transition
  document.addEventListener('click', (ev) => {
    const a = ev.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href) return;
    // Only intercept same-origin html links
    if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    if (href.startsWith('#')) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;

    ev.preventDefault();
    overlay.classList.add('is-active');
    setTimeout(() => { window.location.href = href; }, 280);
  });

  /* ---------- Hide rail on scroll down, show on up ---------- */
  const rail = document.querySelector('.rail');
  if (rail) {
    let lastY = 0;
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const y = window.scrollY;
          if (y > 120 && y > lastY + 8) {
            rail.style.transform = 'translateY(-100%)';
          } else if (y < lastY - 8 || y < 80) {
            rail.style.transform = 'translateY(0)';
          }
          lastY = y;
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ---------- Network diagram pulses ---------- */
  const network = document.querySelector('.network');
  if (network) {
    const edges = network.querySelectorAll('.network__edge');
    if (edges.length) {
      const fire = () => {
        const i = Math.floor(Math.random() * edges.length);
        const edge = edges[i];
        edge.classList.remove('is-pulsing');
        // force reflow
        void edge.getBoundingClientRect();
        edge.classList.add('is-pulsing');
      };
      // Start firing once the network enters view
      const startObserver = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            fire();
            setInterval(fire, 1400);
            startObserver.disconnect();
          }
        });
      }, { threshold: 0.3 });
      startObserver.observe(network);
    }
  }

  /* ---------- Year stamp ---------- */
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Mobile nav (hamburger + full-screen overlay) ---------- */
  const navToggle = document.querySelector('.nav-toggle');
  const navOverlay = document.getElementById('primary-nav-overlay');
  if (navToggle && navOverlay) {
    const overlayLinks = navOverlay.querySelectorAll('.nav-overlay__link');
    const isOpen = () => navToggle.getAttribute('aria-expanded') === 'true';
    const openNav = () => {
      navToggle.setAttribute('aria-expanded', 'true');
      navToggle.setAttribute('aria-label', 'Close menu');
      navOverlay.hidden = false;
      document.body.classList.add('nav-open');
      if (overlayLinks[0]) overlayLinks[0].focus();
    };
    const closeNav = (restoreFocus) => {
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open menu');
      navOverlay.hidden = true;
      document.body.classList.remove('nav-open');
      if (restoreFocus) navToggle.focus();
    };
    navToggle.addEventListener('click', () => {
      if (isOpen()) closeNav(true); else openNav();
    });
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && isOpen()) closeNav(true);
    });
    navOverlay.addEventListener('click', (ev) => {
      if (ev.target === navOverlay) closeNav(true);
    });
    overlayLinks.forEach((link) => {
      link.addEventListener('click', () => closeNav(false));
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 720 && isOpen()) closeNav(false);
    });
  }
})();
