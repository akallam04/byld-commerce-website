(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* capture mode for the README screenshots: ?capture=<section id> reveals
     everything instantly and shifts the page with a paint transform,
     because headless Chrome blanks out on fragments and scroll positions */
  const captureParams = new URLSearchParams(location.search);
  const captureId = captureParams.get('capture');
  if (captureId !== null) {
    document.documentElement.classList.add('is-capture');
    /* wait for the webfonts: measuring offsets before they land shifts the
       layout afterwards and the crop drifts off the section */
    const place = () => {
      const px = captureId.startsWith('px:')
        ? parseInt(captureId.slice(3), 10)
        : (document.getElementById(captureId) || {}).offsetTop;
      if (px) document.body.style.transform = `translateY(-${px}px)`;
      /* &state=N pins the story stage so a shot can show a chosen chapter */
      const stageState = captureParams.get('state');
      const visual = document.querySelector('.story__visual');
      if (stageState && visual) visual.dataset.state = stageState;
    };
    const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
    fonts.then(() => requestAnimationFrame(place));
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

  /* a screenshot pinning a chapter must not be overwritten by the observer */
  if (visual && steps.length && !captureParams.get('state')) {
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

  /* ---------- accordions (channels + faq) ---------- */

  /* scoped per .acc container so opening a FAQ item doesn't close the
     channels accordion (and vice versa) */
  document.querySelectorAll('.acc').forEach((acc) => {
    const accItems = acc.querySelectorAll('.acc__item');
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
  });

  /* ---------- results filters ---------- */

  /* categories mirror how the case studies index is grouped on the site */
  const filters = document.querySelectorAll('.rfilter');
  const rcards = document.querySelectorAll('.rcard');

  if (filters.length && rcards.length) {
    const strip = document.querySelector('.results__strip');
    filters.forEach((btn) => {
      btn.addEventListener('click', () => {
        const cat = btn.dataset.filter;
        filters.forEach((b) => b.classList.toggle('is-active', b === btn));
        rcards.forEach((card) => {
          card.classList.toggle('is-hidden', cat !== 'all' && card.dataset.cat !== cat);
        });
        if (strip) strip.scrollTo({ left: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    });
  }

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

    /* cards are links now: swallow the click if the pointer actually dragged */
    strip.addEventListener('click', (e) => {
      if (Math.abs(strip.scrollLeft - startScroll) > 6) {
        e.preventDefault();
        e.stopPropagation();
      }
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

  /* ---------- hero live system ---------- */

  /* Runs the pitch as a loop: an alert fires on a platform, the packet
     travels down the wire, the core absorbs it, the chip flips to handled.
     Once all four are clear the whole thing resets and starts over. */

  const sysRoot = document.querySelector('.hero__system');

  if (sysRoot) {
    const order = ['amz', 'meta', 'tik', 'wal'];
    const core = sysRoot.querySelector('[data-core]');
    const stateLabel = sysRoot.querySelector('[data-core-label]');
    const cap = sysRoot.querySelector('.hero__system-cap');
    const capText = sysRoot.querySelector('[data-core-cap]');
    const nodeFor = (k) => sysRoot.querySelector(`[data-node="${k}"]`);
    const wireFor = (k) => sysRoot.querySelector(`[data-wire="${k}"]`);

    if (reduceMotion) {
      /* no loop: show the resolved end state, which is the point anyway */
      order.forEach((k) => {
        nodeFor(k).classList.add('is-handled');
        wireFor(k).classList.add('is-clear');
      });
      if (capText) capText.textContent = 'Four platforms. Queue clear.';
      if (cap) cap.classList.add('is-clear');
    } else {
      let timers = [];
      const wait = (fn, ms) => timers.push(setTimeout(fn, ms));

      const clearAll = () => {
        timers.forEach(clearTimeout);
        timers = [];
      };

      const resetBoard = () => {
        order.forEach((k) => {
          nodeFor(k).classList.remove('is-firing', 'is-handled');
          const w = wireFor(k);
          w.classList.remove('is-sending', 'is-clear');
        });
        if (stateLabel) stateLabel.textContent = 'ON IT';
        if (capText) capText.textContent = 'Four platforms. One team clearing the queue.';
        if (cap) cap.classList.remove('is-clear');
      };

      const runOne = (k, done) => {
        const node = nodeFor(k);
        const wire = wireFor(k);
        node.classList.add('is-firing');

        wait(() => {
          /* restart the dash animation reliably */
          wire.classList.remove('is-sending');
          void wire.offsetWidth;
          wire.classList.add('is-sending');
        }, 380);

        /* packet lands in the core */
        wait(() => {
          core.classList.remove('is-hit');
          void core.offsetWidth;
          core.classList.add('is-hit');
          node.classList.remove('is-firing');
          node.classList.add('is-handled');
          wire.classList.add('is-clear');
          wire.classList.remove('is-sending');
          done();
        }, 1330);
      };

      const runCycle = () => {
        resetBoard();
        let i = 0;
        const next = () => {
          if (i >= order.length) {
            if (stateLabel) stateLabel.textContent = 'CLEAR';
            if (capText) capText.textContent = 'Four platforms. Queue clear.';
            if (cap) cap.classList.add('is-clear');
            wait(runCycle, 3200);
            return;
          }
          const k = order[i++];
          runOne(k, () => wait(next, 420));
        };
        wait(next, 700);
      };

      /* only run while the hero is on screen, and start after the wires draw */
      let running = false;
      const heroIO = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !running) {
            running = true;
            wait(runCycle, 900);
          } else if (!entry.isIntersecting && running) {
            running = false;
            clearAll();
          }
        });
      }, { threshold: 0.15 });

      heroIO.observe(sysRoot);
    }
  }

  /* ---------- count-up stats ---------- */

  /* animates only the leading number; prefixes ($) and suffixes (x, %, K...)
     stay as-is. Stats with no leading number are left alone. */
  const counters = document.querySelectorAll('.hero__proof-item b, .rcard__stat');

  /* capture mode leaves the final figures in place: a screenshot caught
     mid-count would publish a number the client never earned */
  if (counters.length && !reduceMotion && captureId === null) {
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const runCount = (node) => {
      const text = node.firstChild;
      if (!text || text.nodeType !== 3) return;
      const m = text.nodeValue.match(/^(\$?)([\d,]+(?:\.\d+)?)/);
      if (!m) return;
      const prefix = m[1];
      const target = parseFloat(m[2].replace(/,/g, ''));
      const decimals = (m[2].split('.')[1] || '').length;
      const rest = text.nodeValue.slice(m[0].length);
      const grouped = m[2].includes(',');
      const t0 = performance.now();
      const tick = (now) => {
        const k = ease(Math.min((now - t0) / 1100, 1));
        let v = (target * k).toFixed(decimals);
        if (grouped) v = Number(v).toLocaleString('en-US', { minimumFractionDigits: decimals });
        text.nodeValue = prefix + v + rest;
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const countIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          runCount(entry.target);
          countIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });

    counters.forEach((el) => countIO.observe(el));
  }

  /* ---------- contact form -> email ---------- */

  const form = document.querySelector('.contact__form');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = data.get('name') || '';
      const brand = data.get('brand') || '';
      const pain = data.get('pain') || '';
      const revenue = data.get('revenue') || '';
      const subject = encodeURIComponent(`Growth inquiry from ${brand}`);
      const body = encodeURIComponent(
        `Hi BYLD team,\n\nI'm ${name} from ${brand}. The thing eating my week right now: ${pain}. Monthly revenue, ballpark: ${revenue}.\n\nI'd love to talk about how you can help us grow.\n`
      );
      window.location.href = `mailto:support@byldcommerce.com?subject=${subject}&body=${body}`;
    });
  }
})();
