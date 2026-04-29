/* =====================================================================
   CelesiumAI — Studio Site v2 — Interactions
   ===================================================================== */

(() => {
  'use strict';

  /* ---------- Scroll-triggered reveals ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
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
})();
