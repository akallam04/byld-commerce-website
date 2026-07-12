(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* capture mode for automated screenshots: reveal everything instantly.
     ?capture=<id> shifts the page to that section with a paint transform,
     because headless Chrome screenshots blank out on fragments and scrolls */
  const captureId = new URLSearchParams(location.search).get('capture');
  if (captureId !== null) {
    document.documentElement.classList.add('is-capture');
    const captureTarget = document.getElementById(captureId);
    if (captureTarget) {
      document.body.style.transform = `translateY(-${captureTarget.offsetTop}px)`;
    }
  }

  /* Hosts like Squarespace wrap code blocks in positioned containers that
     can trap or clip fixed overlays. Re-parent them to <body> so they
     always live in the root stacking context. No-op on the plain site. */
  ['.grain', '.header', '.byld-header', '.menu', '.preloader'].forEach((sel) => {
    const el = document.querySelector(sel);
    if (el && el.parentElement !== document.body) document.body.appendChild(el);
  });

  /* ---------- preloader ---------- */

  const preloader = document.querySelector('.preloader');
  if (preloader && !reduceMotion) {
    document.body.classList.add('is-locked');
    preloader.addEventListener('animationend', (e) => {
      if (e.target === preloader) {
        preloader.remove();
        document.body.classList.remove('is-locked');
      }
    });
    setTimeout(() => {
      if (document.body.contains(preloader)) {
        preloader.remove();
        document.body.classList.remove('is-locked');
      }
    }, 3200);
  } else if (preloader) {
    preloader.remove();
  }

  /* ---------- header scroll state ---------- */

  /* every feature below guards for missing elements, so a page holding
     only some sections (e.g. a partial Squarespace build) still works */
  const header = document.querySelector('.header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- mobile menu ---------- */

  const burger = document.querySelector('.burger');
  const menu = document.querySelector('.menu');

  if (burger && menu) {
    const setMenu = (open) => {
      burger.classList.toggle('is-open', open);
      menu.classList.toggle('is-open', open);
      if (header) header.classList.toggle('is-menu-open', open);
      burger.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-hidden', String(!open));
      document.body.classList.toggle('is-locked', open);
    };

    /* delegated so the tap works no matter how the host wraps the block */
    document.addEventListener('click', (e) => {
      if (e.target.closest('.burger')) setMenu(!menu.classList.contains('is-open'));
    });
    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  }

  /* ---------- reveal on scroll ---------- */

  const revealables = document.querySelectorAll('[data-reveal], [data-reveal-line]');

  if (reduceMotion) {
    revealables.forEach((el) => el.classList.add('is-in'));
  } else {
    const groups = new Map();
    revealables.forEach((el) => {
      const parent = el.parentElement.closest('section, footer, form, .hero__inner') || document.body;
      if (!groups.has(parent)) groups.set(parent, 0);
      const i = groups.get(parent);
      el.style.transitionDelay = `${Math.min(i * 0.09, 0.55)}s`;
      groups.set(parent, i + 1);
    });

    /* Clipped elements (inside overflow:hidden .line wrappers) never report
       as intersecting, so observe the unclipped wrapper instead. */
    const targetFor = (el) => (el.hasAttribute('data-reveal-line') ? el.parentElement : el);
    const targets = new Map();
    revealables.forEach((el) => {
      const t = targetFor(el);
      if (!targets.has(t)) targets.set(t, []);
      targets.get(t).push(el);
    });

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          (targets.get(entry.target) || []).forEach((el) => el.classList.add('is-in'));
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    targets.forEach((_, t) => io.observe(t));
  }

  /* ---------- story scrollytelling ---------- */

  const visual = document.querySelector('.story__visual');
  const steps = document.querySelectorAll('.step');

  if (visual && steps.length) {
    const stepIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const n = entry.target.dataset.step;
          visual.dataset.state = n;
          steps.forEach((s) => s.classList.toggle('is-active', s === entry.target));
        }
      });
    }, { rootMargin: '-42% 0px -42% 0px' });

    steps.forEach((s) => stepIO.observe(s));
  }

  /* ---------- channels accordion ---------- */

  const accItems = document.querySelectorAll('.acc__item');

  accItems.forEach((item) => {
    const btn = item.querySelector('.acc__btn');
    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      accItems.forEach((other) => {
        other.classList.remove('is-open');
        other.querySelector('.acc__btn').setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ---------- drag to scroll (results strip) ---------- */

  const strip = document.querySelector('[data-drag]');

  if (strip) {
    let isDown = false;
    let startX = 0;
    let startScroll = 0;

    strip.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') return;
      isDown = true;
      startX = e.clientX;
      startScroll = strip.scrollLeft;
      strip.classList.add('is-dragging');
    });

    window.addEventListener('pointermove', (e) => {
      if (!isDown) return;
      strip.scrollLeft = startScroll - (e.clientX - startX);
    });

    window.addEventListener('pointerup', () => {
      isDown = false;
      strip.classList.remove('is-dragging');
    });

    strip.addEventListener('click', (e) => {
      if (Math.abs(strip.scrollLeft - startScroll) > 6) e.preventDefault();
    }, true);
  }

  /* ---------- magnetic buttons ---------- */

  if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('[data-magnetic]').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.18}px, ${y * 0.3}px)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
      });
    });
  }

  /* ---------- smooth anchor scrolling ---------- */

  /* script-driven so anchors keep working inside hosts that intercept
     hash navigation (e.g. the Squarespace editor preview frame) */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      const target = id && document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      try { history.replaceState(null, '', '#' + id); } catch (err) { /* sandboxed frame */ }
    });
  });

  /* ---------- contact form -> email ---------- */

  const form = document.querySelector('.contact__form');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = data.get('name') || '';
      const brand = data.get('brand') || '';
      const pain = data.get('pain') || '';
      const subject = encodeURIComponent(`Growth inquiry from ${brand}`);
      const body = encodeURIComponent(
        `Hi BYLD team,\n\nI'm ${name} from ${brand}. The thing eating my week right now: ${pain}.\n\nI'd love to talk about how you can help us grow.\n`
      );
      window.location.href = `mailto:support@byldcommerce.com?subject=${subject}&body=${body}`;
    });
  }
})();
