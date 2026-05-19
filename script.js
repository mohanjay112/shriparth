// ============================================================
//  SHRIPARTH PORTFOLIO  —  script.js  v4.0
//  Fixes: mobile cursor, scrolled header, active nav, Escape
//  modal, scroll progress, corner marks, real video embed,
//  filter buttons, stats counter, keyboard accessibility
// ============================================================

gsap.registerPlugin(ScrollTrigger, Flip);

// ── Reduced motion preference ─────────────────────────────
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Smooth scroll (Lenis) — DESKTOP ONLY ────────────────────
// On touch devices we skip Lenis entirely. Even with smoothTouch:false,
// Lenis attaches touchstart/touchmove listeners to the window that can
// interfere with native scroll. On a phone, native scrolling already
// feels smooth, so we just use the fallback shim instead.
const _isTouch = window.matchMedia('(pointer: coarse)').matches
              || ('ontouchstart' in window);

// Tiny fallback shim that exposes the same surface as Lenis but does nothing
const _lenisFallback = {
    on: (evt, cb) => {
        if (evt === 'scroll') {
            window.addEventListener('scroll', () => { cb({ scroll: window.scrollY }); }, { passive: true });
        }
    },
    scrollTo: (target, opts) => {
        const el = typeof target === 'string' ? document.querySelector(target) : null;
        if (target === 0) { window.scrollTo({ top: 0, behavior: 'smooth' }); }
        else if (el)      { el.scrollIntoView({ behavior: 'smooth' }); }
    },
    stop:  () => { document.body.style.overflow = 'hidden'; },
    start: () => { document.body.style.overflow = ''; },
    raf:   () => {},
};

let lenis;
if (_isTouch || typeof Lenis === 'undefined') {
    // Touch device OR Lenis library failed to load → no smooth-scroll lib
    if (_isTouch) console.info('Touch device: Lenis disabled, using native scroll.');
    else          console.warn('Lenis not available, using fallback.');
    lenis = _lenisFallback;
} else {
    try {
        lenis = new Lenis({
            duration: prefersReducedMotion ? 0 : 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smooth: !prefersReducedMotion,
            smoothTouch: false,
        });
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);
    } catch (e) {
        console.warn('Lenis init failed, using fallback.');
        lenis = _lenisFallback;
    }
}

// ── Scroll Top button (declared early so scroll handler can use it) ──
const scrollBtn = document.getElementById('scrollTopBtn');

// ── Scroll Progress Bar + Header state (single consolidated listener) ──
const progressBar = document.getElementById('scroll-progress');
const siteHeader = document.getElementById('siteHeader');

let _scrollMax = document.body.scrollHeight - window.innerHeight;
window.addEventListener('resize', () => { _scrollMax = document.body.scrollHeight - window.innerHeight; }, { passive: true });

lenis.on('scroll', (e) => {
    // Progress bar
    const pct = (_scrollMax > 0) ? (e.scroll / _scrollMax) * 100 : 0;
    if (progressBar) progressBar.style.width = Math.min(pct, 100) + '%';
    // Header scrolled state
    if (siteHeader) siteHeader.classList.toggle('scrolled', e.scroll > 60);
    // Scroll-to-top button visibility
    if (scrollBtn) scrollBtn.classList.toggle('is-visible', e.scroll > 500);
});

// ── Hamburger nav ────────────────────────────────────────
const navToggle  = document.getElementById('navToggle');
const siteNav    = document.getElementById('siteNav');

if (navToggle && siteHeader) {
    navToggle.addEventListener('click', () => {
        const isOpen = siteHeader.classList.toggle('nav-open');
        navToggle.setAttribute('aria-expanded', isOpen);
    });
    siteNav.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            siteHeader.classList.remove('nav-open');
            navToggle.setAttribute('aria-expanded', 'false');
        });
    });
    document.addEventListener('click', (e) => {
        if (!siteHeader.contains(e.target)) {
            siteHeader.classList.remove('nav-open');
            navToggle.setAttribute('aria-expanded', 'false');
        }
    });
}

// ── Header active nav highlight ──────────────────────────
const headerIndicator = document.querySelector('.header-indicator');
// Active nav via ScrollTrigger
const navSections = ['about', 'work', 'philosophy', 'contact'];
navSections.forEach(id => {
    const section = document.getElementById(id);
    if (!section) return;
    ScrollTrigger.create({
        trigger: section,
        start: 'top center',
        end: 'bottom center',
        onToggle: ({ isActive }) => {
            const link = document.querySelector(`.nav-link[href="#${id}"]`);
            if (link) link.classList.toggle('is-active', isActive);
            // Move header indicator to active link
            if (isActive && link && headerIndicator) {
                const rect = link.getBoundingClientRect();
                const headerRect = siteHeader.getBoundingClientRect();
                headerIndicator.style.left  = (rect.left - headerRect.left) + 'px';
                headerIndicator.style.width = rect.width + 'px';
            }
        },
    });
});

// ── Custom cursor (desktop only) ─────────────────────────
const cursorDot  = document.querySelector('.cursor-dot');
const cursorRing = document.querySelector('.cursor-ring');

if (window.innerWidth > 768 && cursorDot) {

    let mx = 0, my = 0, rx = 0, ry = 0;
    let rafId = null;

    document.addEventListener('mousemove', (e) => {
        mx = e.clientX; my = e.clientY;
        if (!rafId) rafId = requestAnimationFrame(tickCursor);
    }, { passive: true });

    function tickCursor() {
        rafId = null;
        // Dot: instant
        cursorDot.style.transform = `translate(${mx - 3}px, ${my - 3}px)`;
        // Ring: lerp toward mouse
        rx += (mx - rx) * 0.18;
        ry += (my - ry) * 0.18;
        cursorRing.style.transform = `translate(${rx - 16}px, ${ry - 16}px)`;
        if (Math.abs(mx - rx) > 0.3 || Math.abs(my - ry) > 0.3) {
            rafId = requestAnimationFrame(tickCursor);
        }
    }

    // Hide when cursor leaves window
    document.addEventListener('mouseleave', () => {
        cursorDot.classList.add('hidden');
        cursorRing.classList.add('hidden');
    }, { passive: true });
    document.addEventListener('mouseenter', () => {
        cursorDot.classList.remove('hidden');
        cursorRing.classList.remove('hidden');
    }, { passive: true });

    // Click animation
    document.addEventListener('mousedown', () => cursorRing.classList.add('clicking'), { passive: true });
    document.addEventListener('mouseup',   () => cursorRing.classList.remove('clicking'), { passive: true });

    // Hover on interactive elements
    const hoverTargets = 'a, button, .play-trigger, .proj-card, .highlight-card, .tool-card, .filter-btn, .social-tile, .vid-frame, .modal-close, .scroll-top, .nav-link';

    document.querySelectorAll(hoverTargets).forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursorDot.style.background = 'var(--yellow)';
            cursorDot.style.width = '10px';
            cursorDot.style.height = '10px';
            cursorRing.classList.add('hovered');
        });
        el.addEventListener('mouseleave', () => {
            cursorDot.style.background = 'var(--red)';
            cursorDot.style.width = '6px';
            cursorDot.style.height = '6px';
            cursorRing.classList.remove('hovered');
        });
    });
}

// ── Nav link hover flash ─────────────────────────────────
document.querySelectorAll('.nav-link').forEach(el => {
    el.addEventListener('mouseenter', function () {
        gsap.to(el, {
            opacity: 0.7, duration: 0.12, ease: 'power1.out',
            onComplete: () => gsap.to(el, { opacity: 1, duration: 0.18, ease: 'power1.in' }),
        });
    });
});

// ── Play btn hover scale ─────────────────────────────────
document.querySelectorAll('.play-btn').forEach(el => {
    el.addEventListener('mouseenter', () => gsap.to(el, { scale: 1.12, duration: 0.25, ease: 'power2.out' }));
    el.addEventListener('mouseleave', () => gsap.to(el, { scale: 1,    duration: 0.35, ease: 'elastic.out(1, 0.5)' }));
});

// ── Live timecode counter ────────────────────────────────
(function () {
    const tc = document.querySelector('.timecode');
    if (!tc) return;
    let frames = 0;
    setInterval(() => {
        frames++;
        const f = frames % 25;
        const s = Math.floor(frames / 25) % 60;
        const m = Math.floor(frames / (25 * 60)) % 60;
        const h = Math.floor(frames / (25 * 3600));
        tc.textContent =
            String(h).padStart(2,'0') + ':' +
            String(m).padStart(2,'0') + ':' +
            String(s).padStart(2,'0') + ':' +
            String(f).padStart(2,'0');
    }, 1000 / 25);
})();

// ── Corner marks on vid-frame ────────────────────────────
function injectCornerMarks(container) {
    ['tl','tr','bl','br'].forEach(pos => {
        const m = document.createElement('div');
        m.className = `corner-mark corner-${pos}`;
        container.appendChild(m);
    });
}
document.querySelectorAll('.vid-frame').forEach(injectCornerMarks);

// ── Stats counter animation ──────────────────────────────
function animateCounter(el) {
    const target = parseInt(el.dataset.count, 10);
    const obj = { val: 0 };
    gsap.to(obj, {
        val: target, duration: 1.8, ease: 'power2.out',
        onUpdate: () => { el.textContent = Math.round(obj.val); },
    });
}
const statObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounter(entry.target);
            statObs.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });
document.querySelectorAll('.stat-num[data-count]').forEach(el => statObs.observe(el));

// ══════════════════════════════════════════════════════════
// LOADER + HERO ENTRANCE — robust, never gets stuck
// ══════════════════════════════════════════════════════════

function dismissLoader() {
    const loader = document.getElementById('loader');
    if (!loader || loader.dataset.dismissed === 'true') return;
    loader.dataset.dismissed = 'true';

    // Pure CSS class dismissal — works even if GSAP failed
    loader.classList.add('loader-exit');

    // Also try GSAP if available
    if (typeof gsap !== 'undefined') {
        try {
            gsap.timeline()
                .to('.ls', { rotation: 360, scale: 1.4, stagger: 0.1, duration: 0.6, ease: 'power3.inOut' })
                .to('.loader-label',          { y: -30, opacity: 0, duration: 0.3 }, '-=0.2')
                .to('.loader-progress-track', { opacity: 0, duration: 0.15 }, '-=0.1')
                .to('#loader', { yPercent: -100, duration: 0.65, ease: 'power4.inOut',
                    onComplete: () => {
                        loader.style.display = 'none';
                        if (typeof initHero === 'function') initHero();
                    }
                });
        } catch(e) {
            loader.style.display = 'none';
            if (typeof initHero === 'function') try { initHero(); } catch(e2) {}
        }
    } else {
        // No GSAP — pure CSS already handles slide-up, just hide after transition
        setTimeout(() => {
            loader.style.display = 'none';
            if (typeof initHero === 'function') try { initHero(); } catch(e) {}
        }, 700);
    }
}

// Progress bar fill
const loaderFill = document.getElementById('loaderFill');
if (loaderFill) {
    let prog = 0;
    const fillInterval = setInterval(() => {
        prog = Math.min(prog + Math.random() * 18, 90);
        loaderFill.style.width = prog + '%';
    }, 100);
    const clearFill = () => { clearInterval(fillInterval); loaderFill.style.width = '100%'; };
    window.addEventListener('load', clearFill, { once: true });
    setTimeout(clearFill, 2000);
}

// Layer 1: window load event (ideal path)
window.addEventListener('load', () => setTimeout(dismissLoader, 200), { once: true });

// Layer 2: DOMContentLoaded safety (if load already fired)
if (document.readyState === 'complete') {
    setTimeout(dismissLoader, 400);
} else {
    document.addEventListener('DOMContentLoaded', () => setTimeout(dismissLoader, 600), { once: true });
}

// Layer 3: Hard timeout — pure JS, no GSAP dependency, fires at 2.5s no matter what
setTimeout(dismissLoader, 2500);

function initHero() {
    gsap.set('.monitor',        { y: 50, opacity: 0 });
    gsap.set('.hero-tagline',   { opacity: 0, x: -20 });
    gsap.set('.hero-btns',      { opacity: 0, y: 16 });
    gsap.set('.monitor-bottom', { opacity: 0 });
    gsap.set('.scroll-cue',     { opacity: 0 });

    const tl = gsap.timeline({
        onComplete: () => {
            gsap.set(['.monitor','.hero-tagline','.hero-btns','.monitor-bottom','.scroll-cue'], { clearProps: 'all' });
        },
    });

    tl.to('.monitor',        { y: 0, opacity: 1, duration: 1.0, ease: 'power3.out' })
      .to('.hero-tagline',   { opacity: 1, x: 0, duration: 0.6, ease: 'power2.out' }, '-=0.3')
      .to('.hero-btns',      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', clearProps: 'transform,y' }, '-=0.35')
      .to('.monitor-bottom', { opacity: 1, duration: 0.5, ease: 'power2.out' }, '-=0.3')
      .to('.scroll-cue',     { opacity: 1, duration: 0.5, ease: 'power2.out' }, '-=0.25');

    // Headline parallax (skip if reduced motion)
    if (!prefersReducedMotion) {
        gsap.to('#heroHeadline', {
            scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true },
            y: -50, ease: 'none',
        });

    // Ambient shape floats — paused when hero not visible
    const hs1Tween = gsap.to('.hs1', { y: -22, x: 10,  duration: 15, repeat: -1, yoyo: true, ease: 'sine.inOut', paused: true });
    const hs2Tween = gsap.to('.hs2', { y:  20, x: -9,  duration: 12, repeat: -1, yoyo: true, ease: 'sine.inOut', paused: true });
    const hs3Tween = gsap.to('.hs3', { y: -14, x:  6,  duration: 18, repeat: -1, yoyo: true, ease: 'sine.inOut', paused: true });
    ScrollTrigger.create({
        trigger: '#hero',
        start: 'top bottom', end: 'bottom top',
        onEnter:      () => { hs1Tween.play(); hs2Tween.play(); hs3Tween.play(); },
        onLeave:      () => { hs1Tween.pause(); hs2Tween.pause(); hs3Tween.pause(); },
        onEnterBack:  () => { hs1Tween.play(); hs2Tween.play(); hs3Tween.play(); },
        onLeaveBack:  () => { hs1Tween.pause(); hs2Tween.pause(); hs3Tween.pause(); },
    });
    }
}

// ══════════════════════════════════════════════════════════
// REVEAL-UP — IntersectionObserver
// ══════════════════════════════════════════════════════════
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal-up').forEach(el => revealObserver.observe(el));

// ══════════════════════════════════════════════════════════
// ABOUT — animations
// ══════════════════════════════════════════════════════════
try {
    const s = new SplitType('.about-h2', { types: 'words' });
    gsap.from(s.words, {
        scrollTrigger: { trigger: '.about-h2', start: 'top 83%' },
        y: 40, autoAlpha: 0, stagger: 0.06, duration: 0.9, ease: 'power3.out',
    });
} catch (e) {}

// ── YouTube section — coordinated entrance timeline ──────
(function () {
    // Set initial hidden state for all YT elements
    gsap.set('.yt-eyebrow', { autoAlpha: 0, y: 16 });
    gsap.set('.yt-sub',     { autoAlpha: 0, y: 16 });
    gsap.set('.yt-frame',   { autoAlpha: 0, y: 60, scale: 0.97 });
    gsap.set('.yt-subscribe-btn', { autoAlpha: 0, y: 20 });

    // Split title into words (not chars — smoother, less DOM nodes)
    let titleWords = null;
    try {
        const split = new SplitType('.yt-title', { types: 'words' });
        titleWords = split.words;
        gsap.set(titleWords, { autoAlpha: 0, y: 40 });
    } catch (e) {
        gsap.set('.yt-title', { autoAlpha: 0, y: 40 });
    }

    ScrollTrigger.create({
        trigger: '.yt-section',
        start: 'top 65%',
        once: true,
        onEnter: () => {
            const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

            // Eyebrow fades in
            tl.to('.yt-eyebrow', { autoAlpha: 1, y: 0, duration: 0.5 })
            // Title words stagger up
              .to(titleWords || '.yt-title', {
                  autoAlpha: 1, y: 0,
                  stagger: 0.08, duration: 0.75,
              }, '-=0.25')
            // Subtitle fades in
              .to('.yt-sub', { autoAlpha: 1, y: 0, duration: 0.5 }, '-=0.45')
            // Frame lifts into view — clean y + fade, no clipPath
              .to('.yt-frame', {
                  autoAlpha: 1, y: 0, scale: 1,
                  duration: 0.85, ease: 'power2.out',
              }, '-=0.2')
            // Subscribe button
              .to('.yt-subscribe-btn', { autoAlpha: 1, y: 0, duration: 0.45 }, '-=0.4');
        },
    });
})();

gsap.from('.stamp-tag', {
    scrollTrigger: { trigger: '.stamp-tag', start: 'top 88%' },
    x: -24, autoAlpha: 0, duration: 0.6, ease: 'power2.out',
});
gsap.from('.about-meta', {
    scrollTrigger: { trigger: '.about-meta', start: 'top 88%' },
    y: 16, autoAlpha: 0, duration: 0.55, ease: 'power2.out', delay: 0.1,
});
gsap.utils.toArray('.about-body p, .about-body blockquote').forEach((el, i) => {
    gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 90%' },
        y: 20, autoAlpha: 0, duration: 0.65, ease: 'power2.out', delay: i * 0.08,
    });
});
gsap.from('.about-img', {
    scrollTrigger: { trigger: '.about-right', start: 'top 80%' },
    clipPath: 'inset(0% 100% 0% 0%)',
    duration: 1.1, ease: 'expo.inOut',
});
gsap.from('.img-shadow', {
    scrollTrigger: { trigger: '.about-right', start: 'top 80%' },
    x: -20, y: -20, autoAlpha: 0, duration: 0.9, ease: 'power3.out', delay: 0.5,
});
gsap.from('.img-badge', {
    scrollTrigger: { trigger: '.about-right', start: 'top 75%' },
    scale: 0.6, autoAlpha: 0, duration: 0.5, ease: 'back.out(2)', delay: 0.8,
});
gsap.to('.ag-blue',   { scrollTrigger: { trigger: '#about', start: 'top bottom', end: 'bottom top', scrub: 2   }, y: 130,  ease: 'none' });
gsap.to('.ag-yellow', { scrollTrigger: { trigger: '#about', start: 'top bottom', end: 'bottom top', scrub: 1.5 }, y: -100, ease: 'none' });

// ══════════════════════════════════════════════════════════
// FEATURED WORK — animations
// ══════════════════════════════════════════════════════════
gsap.from('.featured-section .section-title', {
    scrollTrigger: { trigger: '.featured-section', start: 'top 82%' },
    x: -30, autoAlpha: 0, duration: 0.7, ease: 'power3.out',
});
gsap.from('.feat-vid-col .vid-frame', {
    scrollTrigger: { trigger: '.feat-grid', start: 'top 80%' },
    clipPath: 'inset(0% 100% 0% 0%)',
    duration: 1.1, ease: 'expo.inOut',
});
gsap.from('.vid-accent', {
    scrollTrigger: { trigger: '.feat-grid', start: 'top 80%' },
    x: 20, y: 20, autoAlpha: 0, duration: 0.7, ease: 'power3.out', delay: 0.7,
});
gsap.from('.feat-card', {
    scrollTrigger: { trigger: '.feat-grid', start: 'top 80%' },
    x: 40, autoAlpha: 0, duration: 0.85, ease: 'power3.out', delay: 0.2,
});

// Stats count up
gsap.utils.toArray('.fs-num').forEach(el => {
    const raw   = el.childNodes[0];
    const text  = raw ? raw.textContent.trim() : el.textContent.trim();
    const match = text.match(/^([\d.]+)([KkMm+]*)/);
    if (!match) return;
    const end    = parseFloat(match[1]);
    const suffix = match[2] || '';
    const obj    = { val: 0 };
    ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: () => {
            gsap.to(obj, {
                val: end, duration: 1.6, ease: 'power2.out',
                onUpdate: () => { raw.textContent = Math.round(obj.val) + suffix; },
            });
        },
    });
    gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 88%' },
        scale: 0.7, autoAlpha: 0, duration: 0.55, ease: 'back.out(2)',
    });
});

gsap.from('.ftag', {
    scrollTrigger: { trigger: '.feat-tags', start: 'top 90%' },
    y: 12, autoAlpha: 0, stagger: 0.1, duration: 0.4, ease: 'power2.out',
});
gsap.from('.featured-section .btn', {
    scrollTrigger: { trigger: '.featured-section .btn', start: 'top 92%' },
    y: 14, autoAlpha: 0, duration: 0.5, ease: 'power2.out',
});

// ── Philosophy ────────────────────────────────────────────
gsap.to('.philo-bg-word', {
    scrollTrigger: { trigger: '.philo-section', start: 'top bottom', end: 'bottom top', scrub: 1 },
    x: 360, ease: 'none',
});
try {
    const s = new SplitType('.philo-q', { types: 'words' });
    gsap.from(s.words, {
        scrollTrigger: { trigger: '.philo-q', start: 'top 86%' },
        y: 36, autoAlpha: 0, stagger: 0.04, duration: 0.85, ease: 'power3.out',
    });
} catch (e) {}

document.querySelectorAll('.philo-content p').forEach((p, i) => {
    gsap.from(p, {
        scrollTrigger: { trigger: p, start: 'top 90%', once: true },
        y: 16, autoAlpha: 0, duration: 0.6, ease: 'power2.out', delay: i * 0.07,
    });
});

gsap.utils.toArray('.mlist li, .purpose-word').forEach(el => {
    gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 90%', end: 'bottom 62%', scrub: 1 },
        x: -24, autoAlpha: 0,
    });
});

// ── Skills scattered cards ────────────────────────────────
if (window.innerWidth > 768) {
    document.querySelectorAll('.tool-card').forEach((card, i) => {
        const rotations = [-3.2, 2.8, 1.5, -2.4, -1.8, 3.5];
        const rot = rotations[i] || 0;
        gsap.from(card, {
            scrollTrigger: { trigger: '.tools-grid', start: 'top 85%' },
            y: 60 + i * 12, x: (i % 2 === 0 ? -30 : 30),
            autoAlpha: 0, rotation: rot * 2.5,
            duration: 0.9, ease: 'power3.out', delay: i * 0.09,
            onComplete: () => { gsap.set(card, { rotation: rot }); }
        });
    });
} else {
    document.querySelectorAll('.tool-card').forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: { trigger: card, start: 'top 92%' },
            y: 24, autoAlpha: 0, duration: 0.55, ease: 'power2.out', delay: i * 0.05,
        });
    });
}

// ── Project card data-num ─────────────────────────────────
document.querySelectorAll('.proj-card').forEach((card, i) => {
    card.setAttribute('data-num', String(i + 1).padStart(2, '0'));
});

// ══════════════════════════════════════════════════════════
// PROJECT SHOWCASE — cards animate in, with filter
// ══════════════════════════════════════════════════════════
const workTitle = document.querySelector('.work-section .section-title');
if (workTitle) {
    workTitle.classList.remove('reveal-up');
    gsap.fromTo(workTitle,
        { x: -30, autoAlpha: 0 },
        { x: 0, autoAlpha: 1, duration: 0.7, ease: 'power3.out',
          scrollTrigger: { trigger: workTitle, start: 'top 95%', once: true } }
    );
}

const projCards = Array.from(document.querySelectorAll('.proj-card'));
projCards.forEach(card => {
    card.classList.remove('reveal-up');
    gsap.set(card, { opacity: 0, y: 55, scale: 0.95 });
});

function animateRow(cards, startDelay = 0) {
    cards.forEach((card, col) => {
        const d = startDelay + col * 0.2;
        gsap.to(card, {
            opacity: 1, y: 0, scale: 1,
            duration: 0.72, ease: 'power3.out', delay: d,
            onComplete: () => gsap.set(card, { clearProps: 'transform' }),
        });
        const thumb = card.querySelector('.proj-thumb');
        if (thumb) gsap.from(thumb, { scale: 0.88, duration: 0.85, ease: 'power2.out', delay: d + 0.12 });
        const info = card.querySelector('.proj-info');
        if (info) gsap.fromTo(info,
            { y: 16, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.42, ease: 'power2.out', delay: d + 0.28 }
        );
    });
}

// Dynamic project card animation rows
const itemsPerRow = 3;
for (let i = 0; i < projCards.length; i += itemsPerRow) {
    const row = projCards.slice(i, i + itemsPerRow);
    if (row.length === 0) continue;
    
    ScrollTrigger.create({
        trigger: row[0],
        start: 'top 92%',
        once: true,
        onEnter: () => animateRow(row, 0)
    });
}

// ── Filter buttons ────────────────────────────────────────
const filterBtns = document.querySelectorAll('.filter-btn');
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        projCards.forEach(card => {
            const cat = card.dataset.category || 'all';
            const show = filter === 'all' || cat === filter;
            gsap.to(card, {
                opacity: show ? 1 : 0.25,
                scale: show ? 1 : 0.97,
                duration: 0.3, ease: 'power2.out',
            });
            card.style.pointerEvents = show ? '' : 'none';
        });
    });
});

// ── Real YouTube thumbnails on project cards + open in modal ──
// Each .proj-card currently has an inline iframe that auto-loads its video.
// We replace that iframe with a thumbnail + play button so the whole card is
// clickable and opens the cinematic side-by-side modal (video left, info right).
document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.proj-card[data-video-id]');
    if (!cards.length) return;

    cards.forEach(card => {
        const id   = card.dataset.videoId;
        const meta = (typeof videoMeta !== 'undefined') ? videoMeta[id] : null;
        if (!meta) return;

        const frame = card.querySelector('.proj-vid-frame');
        if (!frame) return;

        // Pick a thumbnail (drive videos get a gradient placeholder)
        let thumbUrl = '';
        if (meta.type === 'youtube' || meta.type === 'short') {
            thumbUrl = `https://img.youtube.com/vi/${meta.id}/maxresdefault.jpg`;
        }

        // Replace the iframe with thumbnail + play button overlay
        frame.innerHTML = `
            <div class="proj-thumb-bg" style="${thumbUrl ? `background-image:url('${thumbUrl}')` : ''}"></div>
            <div class="proj-thumb-overlay"></div>
            <button class="proj-play-btn" aria-label="Play ${meta.title}" tabindex="-1">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M8 5v14l11-7z"/>
                </svg>
            </button>
        `;

        // Fall back to hqdefault if maxresdefault is missing (returns 120x90 placeholder)
        if (thumbUrl) {
            const probe = new Image();
            probe.onload = () => {
                if (probe.naturalWidth < 200) {
                    const bg = frame.querySelector('.proj-thumb-bg');
                    if (bg) bg.style.backgroundImage = `url('https://img.youtube.com/vi/${meta.id}/hqdefault.jpg')`;
                }
            };
            probe.src = thumbUrl;
        }

        // Whole card opens the modal (cinematic player + info side-by-side)
        card.style.cursor = 'pointer';
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');

        const open = () => {
            if (typeof openModal === 'function') {
                openModal(id, card);
            }
        };
        card.addEventListener('click', (e) => {
            // Don't hijack clicks on real links inside the card
            if (e.target.closest('a')) return;
            open();
        });
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                open();
            }
        });
    });
});

// ══════════════════════════════════════════════════════════
// VIDEO MODAL — with real YouTube embed + Escape key
// ══════════════════════════════════════════════════════════
const modal      = document.getElementById('videoModal');
const modalClose = document.getElementById('modalClose');
const modalScreen= document.getElementById('modalScreen');
const modalTitle = document.getElementById('modalTitle');
const modalBox   = document.getElementById('modalBox');
let   activeThumb = null;
let   lastFocused = null;


//footer section animation
gsap.from('.social-tile', {
    scrollTrigger: { trigger: '.social-row', start: 'top 88%' },
    y: 30, autoAlpha: 0, stagger: 0.12,
    duration: 0.6, ease: 'power3.out',
});



// ── Video registry ────────────────────────────────────────
const videoMeta = {
    featured1: { id: '1NInV19MR3Q', type: 'youtube', title: 'Silence Between Frames',
                 tag: 'FEATURED PROJECT', desc: 'A cinematic deep-dive into the emotional power of negative space — exploring how the moments between cuts define a film\'s soul.',
                 meta: [['Views','50K+'],['Editing','90 hrs'],['Runtime','18 min']] },
    p1:        { id: 'GXsNEZdMbBc', type: 'youtube', title: 'When Good Taste Becomes a Curse',
                 tag: 'CINEMA ESSAY', desc: 'Exploring the power of silence and the space between frames in cinematic storytelling.',
                 meta: [['Type','Essay'],['Format','YouTube'],['Category','Cinema']] },
    p2:        { id: 'Jq9D1OiQO6c', type: 'youtube', title: "The Cost of Being Spider-Man (And Why Marvel Won't Pay It)",
                 tag: 'NARRATIVE', desc: 'A study in visual pacing and the rhythmic flow of cinematic imagery.',
                 meta: [['Type','Narrative'],['Tone','Dynamic'],['Color','Vibrant']] },
    p3:        { id: 'rds2D-koeRA', type: 'youtube', title: 'Chalchitra Gatha',
                 tag: 'DOCUMENTARY', desc: 'A raw, unfiltered look at life through the lens of documentary filmmaking.',
                 meta: [['Type','Documentary'],['Tools','Premiere Pro'],['Grade','DaVinci']] },
    p4:        { id: 'lYLvPzTBSVE', type: 'youtube', title: 'Vishwaayan 2023 | Fest After Movie',
                 tag: 'EVENT FILM', desc: 'A fast-paced narrative edit focusing on high-energy cinematic transitions.',
                 meta: [['Type','Event'],['Tools','After Effects'],['Grade','Lumetri']] },
    p5:        { id: '7rNf4TygTEw', type: 'youtube', title: "Meta Quest 3 Review: Why Isn't Anyone Talking About This VR Headset!? | Quest 3 | AevyTv Cohort 7",
                 tag: 'TECH REVIEW', desc: 'An analysis of revolutionary editing techniques that changed cinema forever.',
                 meta: [['Type','Review'],['Format','YouTube'],['Platform','AevyTv']] },
    p6:        { id: 'NIIqW-gSDLk', type: 'youtube', title: 'Sometimes its okay to do.... | Aevython | AevyTv Cohort 7',
                 tag: 'NARRATIVE', desc: 'High-end commercial storytelling for modern brands in motion.',
                 meta: [['Type','Narrative'],['Format','YouTube'],['Platform','AevyTv']] },
    p7:        { id: '_NA9OHg8RC0', type: 'youtube', title: 'KUMSS Promo',
                 tag: 'PROMO', desc: 'Spotlighting creative editing choices that elevate a narrative piece.',
                 meta: [['Type','Promo'],['Style','Creative'],['Mood','Energetic']] },
    p8:        { id: 'g8QpxHtQKbM', type: 'youtube', title: "When there's nothing to eat at home | Aevython Day 1 | AevyTv Cohort 7",
                 tag: 'NARRATIVE', desc: 'A short narrative exploration of character and environment.',
                 meta: [['Type','Narrative'],['Format','YouTube'],['Platform','AevyTv']] },
    short1:    { id: 'VaIK3nOEJhg', type: 'short', title: 'The Reveal',
                 tag: '⚡ YOUTUBE SHORT', desc: 'A single reveal moment stretched into 32 seconds of pure cinematic tension.',
                 meta: [['Duration','0:32'],['Format','9:16'],['Style','Tension']] },
    short2:    { id: 'biz9dt3WI-Q', type: 'short', title: 'After Midnight',
                 tag: '⚡ YOUTUBE SHORT', desc: 'Late-night aesthetics — moody color grading and minimal cuts create an atmosphere that lingers.',
                 meta: [['Duration','0:28'],['Format','9:16'],['Mood','Moody']] },
    short3:    { id: '0qDoA_gSulQ', type: 'short', title: 'One Take',
                 tag: '⚡ YOUTUBE SHORT', desc: 'No cuts. No edits. One continuous take that proves sometimes restraint is the best edit of all.',
                 meta: [['Duration','0:44'],['Format','9:16'],['Style','Minimal']] },
    short4:    { id: 'Rr7MueDRwDU', type: 'short', title: 'Motion Study',
                 tag: '⚡ YOUTUBE SHORT', desc: 'A study in movement — how camera motion and subject motion create a visual conversation.',
                 meta: [['Duration','0:38'],['Format','9:16'],['Focus','Motion']] },
    short5:    { id: 'EUEsxEKYs0I', type: 'short', title: 'Raw Cut',
                 tag: '⚡ YOUTUBE SHORT', desc: 'Unpolished, unfiltered, uncut. The beauty of chaos when every frame has something to say.',
                 meta: [['Duration','0:55'],['Format','9:16'],['Style','Raw']] },
    h1:        { id: 'E8WvVFB7klo', type: 'youtube', title: 'Visual Storytelling',
                 tag: 'CREATIVE SPOTLIGHT', desc: 'Exploring the depths of cinematic rhythm and emotional resonance through precise editing and sound design.',
                 meta: [['Type','Creative'],['Tone','Cinematic'],['Focus','Rhythm']] },
    h2:        { id: '5E8WE2xhMqU', type: 'youtube', title: 'Advanced Post-Production',
                 tag: 'TECHNICAL SHOWCASE', desc: 'A showcase of complex transitions, precise color grading, and advanced visual effects integration.',
                 meta: [['Type','Technical'],['Software','DaVinci'],['VFX','After Effects']] },
};

function addWatchButton(meta) {
    if (!modalScreen) return;
    // Don't add twice
    if (modalScreen.querySelector('.modal-watch-btn')) return;
    const watchURL = getYouTubeWatchURL(meta);
    const btn = document.createElement('a');
    btn.href      = watchURL;
    btn.target    = '_blank';
    btn.rel       = 'noopener';
    btn.className = 'modal-watch-btn';
    btn.textContent = '↗ WATCH ON YOUTUBE';
    modalScreen.appendChild(btn);
}

function getYouTubeWatchURL(meta) {
    if (meta.type === 'short') return `https://youtube.com/shorts/${meta.id}`;
    return `https://youtu.be/${meta.id}`;
}

function showEmbedFallback(meta) {
    if (!modalScreen) return;
    const watchURL = getYouTubeWatchURL(meta);
    modalScreen.innerHTML = `
        <div class="modal-fallback">
            <div class="mf-icon">▶</div>
            <p class="mf-msg">This video can't be played here<br><span>Embedding is disabled by the owner on YouTube</span></p>
            <a href="${watchURL}" target="_blank" rel="noopener" class="btn btn-hero-y mf-btn">WATCH ON YOUTUBE ↗</a>
            <p class="mf-fix">To fix: YouTube Studio → Content → Select video → Details → More options → Enable embedding</p>
        </div>`;
}

// ── YouTube IFrame API ready callback (global) ────────────
window.onYouTubeIframeAPIReady = function() { window._ytApiReady = true; };

function getThumb(id) {
    return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
}

function buildBlockedScreen(meta) {
    // Beautiful fallback shown when embedding is disabled on that video
    const isShort = meta.type === 'short';
    return `
    <div class="modal-blocked" style="background-image:url('${getThumb(meta.id)}')">
        <div class="mb-vignette"></div>
        <div class="mb-body">
            <span class="mb-tag">${isShort ? '⚡ SHORT' : '▶ VIDEO'}</span>
            <h3 class="mb-title">${meta.title}</h3>
            <div class="mb-steps">
                <p class="mb-head">Enable in-page playback in 3 steps:</p>
                <ol class="mb-list">
                    <li>Open <strong>YouTube Studio</strong></li>
                    <li>Content → select this video → Details → More options</li>
                    <li>Tick <strong>✅ Allow embedding</strong> → Save</li>
                </ol>
            </div>
        </div>
    </div>`;
}

function openModal(id, trigger) {
    const meta = videoMeta[id];
    if (!meta) return;
    lastFocused = document.activeElement;
    activeThumb = trigger;

    const isShort  = meta.type === 'short';
    
    // Check for inline play (Featured Section & Shorts)
    if (trigger && trigger.dataset.playInline === 'true') {
        const iframeHost = trigger.querySelector('.short-iframe-host') || 
                           trigger.querySelector('.feat-iframe-host') ||
                           document.getElementById('featuredIframeHost');
        
        if (iframeHost && !trigger.classList.contains('video-active')) {
            trigger.classList.add('video-active');
            let params = `autoplay=1&rel=0&modestbranding=1&controls=1&showinfo=0&iv_load_policy=3&enablejsapi=1`;
            if (isShort) params += `&loop=1&playlist=${meta.id}`;
            
            const uniqueId = `loader-${Math.floor(Math.random() * 10000)}`;

            iframeHost.innerHTML = `
                <div class="short-loader" id="${uniqueId}"><div class="myw-spinner"></div></div>
                <iframe src="https://www.youtube.com/embed/${meta.id}?${params}" 
                    title="${meta.title}" frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    allowfullscreen
                    onload="document.getElementById('${uniqueId}').style.display='none'"></iframe>`;
            trigger.style.cursor = 'default';
            return;
        } else if (trigger && trigger.classList.contains('video-active')) {
            return;
        }
    }

    const thumb    = meta.type !== 'drive'
        ? `https://img.youtube.com/vi/${meta.id}/maxresdefault.jpg`
        : '';

    // ── Hero background ────────────────────────────────────
    const heroBg = document.getElementById('modalHeroBg');
    if (heroBg && thumb) {
        heroBg.style.backgroundImage = `url('${thumb}')`;
    }

    // ── Info panel ─────────────────────────────────────────
    const infoTag   = document.getElementById('modalInfoTag');
    const infoTitle = document.getElementById('modalInfoTitle');
    const infoDesc  = document.getElementById('modalInfoDesc');
    const infoMeta  = document.getElementById('modalInfoMeta');

    if (infoTag)   infoTag.textContent   = meta.tag   || 'PROJECT';
    if (infoTitle) infoTitle.textContent = meta.title || '—';
    if (infoDesc)  infoDesc.textContent  = meta.desc  || '';
    if (infoMeta && meta.meta) {
        infoMeta.innerHTML = meta.meta.map(([lbl, val]) =>
            `<div class="mim-item"><span class="mim-lbl">${lbl}</span><span class="mim-val">${val}</span></div>`
        ).join('');
    }

    // ── Short format: narrow player ────────────────────────
    const playerFrame = document.getElementById('modalScreen');
    if (playerFrame) {
        playerFrame.classList.toggle('is-short', isShort);
    }

    // ── Bottom title bar ───────────────────────────────────
    if (modalTitle) modalTitle.textContent = meta.title;

    // ── Video embed ────────────────────────────────────────
    if (modalScreen) {
        if (meta.type === 'drive') {
            modalScreen.innerHTML = `
                <iframe src="https://drive.google.com/file/d/${meta.id}/preview"
                    title="${meta.title}" frameborder="0"
                    allow="autoplay" allowfullscreen
                    style="width:100%;height:100%;border:none;"></iframe>`;
        } else {
            const iframeId = 'yt-iframe-' + Date.now();
            const src = `https://www.youtube.com/embed/${meta.id}?autoplay=1&mute=0&rel=0&modestbranding=1&controls=1&showinfo=0&origin=${window.location.origin}`;
            
            modalScreen.innerHTML = `
                <div class="modal-yt-wrap" style="background-image:url('${thumb}')">
                    <div class="myw-vignette"></div>
                    <div class="myw-loader" id="modalLoader"><div class="myw-spinner"></div></div>
                    <iframe id="${iframeId}" 
                        src="${src}" 
                        title="${meta.title}" 
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                        allowfullscreen
                        style="position:absolute;inset:0;width:100%;height:100%;border:none;z-index:10;pointer-events:all;">
                    </iframe>
                </div>`;

            const iframe = document.getElementById(iframeId);
            if (iframe) {
                iframe.onload = () => {
                    const loader = document.getElementById('modalLoader');
                    if (loader) loader.style.display = 'none';
                };
                // Fallback for loader if onload doesn't fire (rare)
                setTimeout(() => {
                    const loader = document.getElementById('modalLoader');
                    if (loader) loader.style.display = 'none';
                }, 3500);
            }
        }
    }

    // ── Open modal ─────────────────────────────────────────
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    lenis.stop();

    if (typeof gsap !== 'undefined') {
        gsap.fromTo('#modalBox',
            { y: 40, opacity: 0 },
            { y: 0,  opacity: 1, duration: 0.5, ease: 'power3.out' }
        );
        gsap.fromTo('.modal-hero-bg',
            { scale: 1.08 },
            { scale: 1, duration: 0.8, ease: 'power2.out' }
        );
        gsap.fromTo('#modalInfoCol',
            { x: 30, opacity: 0 },
            { x: 0,  opacity: 1, duration: 0.55, ease: 'power3.out', delay: 0.15 }
        );
    }

    setTimeout(() => { if (modalClose) modalClose.focus(); }, 100);
}

function closeModal() {
    if (!modal.classList.contains('active')) return;

    const iframe = modalScreen && modalScreen.querySelector('iframe');
    if (iframe && iframe._cleanupMsg) iframe._cleanupMsg();

    if (typeof gsap !== 'undefined') {
        gsap.to('#modalBox', {
            y: 30, opacity: 0, duration: 0.28, ease: 'power3.in',
            onComplete: finishClose,
        });
    } else { finishClose(); }

    function finishClose() {
        modal.classList.remove('active');
        if (modalScreen) {
            modalScreen.innerHTML = `<div class="modal-placeholder"><div class="mp-icon">▶</div><p>Select a project to watch</p></div>`;
            modalScreen.classList.remove('is-short');
        }
        const heroBg = document.getElementById('modalHeroBg');
        if (heroBg) heroBg.style.backgroundImage = '';
        if (modalTitle) modalTitle.textContent = '—';
        const infoTitle = document.getElementById('modalInfoTitle');
        if (infoTitle) infoTitle.textContent = '—';
        document.body.style.overflow = '';
        document.body.classList.remove('modal-open');
        lenis.start();
        if (lastFocused) lastFocused.focus();
        activeThumb = null;
    }
}

// ── Play trigger — event delegation (robust, works regardless of GSAP state) ──
// ── Unified Video Handler (Inline vs Modal) ────────────────
document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.play-trigger');
    if (!trigger) return;
    
    const videoKey = trigger.dataset.videoId;
    if (!videoKey) return;

    // Check for inline play
    if (trigger.dataset.playInline === 'true') {
        const section = trigger.closest('section');
        const triggerEl = section ? section.querySelector('.featured-inline-trigger') : null;
        const iframeHost = section ? section.querySelector('.feat-iframe-host') : null;
        
        if (triggerEl && iframeHost && !triggerEl.classList.contains('video-active')) {
            const meta = videoMeta[videoKey];
            const videoId = meta ? meta.id : videoKey;
            
            triggerEl.classList.add('video-active');
            iframeHost.innerHTML = `
                <iframe 
                    src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&controls=1&showinfo=0&iv_load_policy=3&enablejsapi=1" 
                    title="YouTube video player" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    allowfullscreen>
                </iframe>`;
            triggerEl.style.cursor = 'default';
            return;
        } else if (triggerEl && triggerEl.classList.contains('video-active')) {
            return;
        }
    }

    // Default: Open in Modal
    openModal(videoKey, trigger);
});

document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const trigger = e.target.closest('.play-trigger');
    if (!trigger) return;
    e.preventDefault();
    trigger.click(); 
});

// ESCAPE key to close modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

// Close button click — this was missing before
if (modalClose) {
    modalClose.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
    });
}

// Click on the dark backdrop (outside the modal box) closes too
if (modal) {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

// ── Nav smooth scroll ─────────────────────────────────────
document.querySelectorAll('.nav-link[href^="#"]').forEach(a => {
    a.addEventListener('click', function (e) {
        e.preventDefault();
        lenis.scrollTo(this.getAttribute('href'), {
            offset: -70, duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        });
    });
});

// ── Scroll top (handler — button declared at top) ────────
if (scrollBtn) {
    scrollBtn.addEventListener('click', () => {
        lenis.scrollTo(0, { duration: 1.4, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    });
}

// ── Footer heading data-text ──────────────────────────────
const fh = document.querySelector('.footer-h');
if (fh && !fh.dataset.text) fh.setAttribute('data-text', fh.textContent);

// ── Magnetic button effect (hero CTAs) ───────────────────
if (window.innerWidth > 768) {
    document.querySelectorAll('.btn.magnetic').forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const cx = rect.left + rect.width  / 2;
            const cy = rect.top  + rect.height / 2;
            const dx = (e.clientX - cx) * 0.22;
            const dy = (e.clientY - cy) * 0.22;
            gsap.to(btn, { x: dx, y: dy, duration: 0.35, ease: 'power2.out' });
        });
        btn.addEventListener('mouseleave', () => {
            gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
        });
    });
}
// ── Shorts strip — Native scroll-snap (rock-solid on mobile) ──
(function () {
    const wrap  = document.querySelector('.shorts-track-wrap');
    const track = document.querySelector('.shorts-track');
    if (!wrap || !track) return;

    const cards   = Array.from(track.querySelectorAll('.short-card'));
    const prevBtn = document.querySelector('.shorts-prev');
    const nextBtn = document.querySelector('.shorts-next');
    const perfL   = document.querySelector('.film-perf-l');
    const perfR   = document.querySelector('.film-perf-r');
    if (!cards.length) return;

    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches
                       || ('ontouchstart' in window);

    // ── Inject transparent touch shields over each iframe ─────
    // Mobile browsers can still let cross-origin iframes capture touch
    // events even with pointer-events:none. A transparent overlay on top
    // of the iframe takes the touch instead, allowing the page to scroll
    // vertically. The shield is removed when the user activates the card.
    cards.forEach(card => {
        if (card.querySelector('.touch-shield')) return;
        const shield = document.createElement('div');
        shield.className = 'touch-shield';
        card.appendChild(shield);
    });

    let activeIndex   = 0;
    let interactTimer = null;
    let suppressObsUntil = 0; // ignore observer immediately after a programmatic snap

    // ── Move the carousel programmatically ──────────────────────
    function snapTo(index) {
        const i = Math.max(0, Math.min(cards.length - 1, index));
        activeIndex = i;
        suppressObsUntil = Date.now() + 600;

        // Compute target scrollLeft directly — never use scrollIntoView,
        // which also scrolls the page vertically/horizontally when needed.
        const card     = cards[i];
        const isMobile = window.matchMedia('(max-width: 768px)').matches;

        let targetScroll;
        if (isMobile) {
            // Center the card in the viewport (mobile snap-align: center)
            targetScroll = card.offsetLeft + card.offsetWidth / 2 - wrap.clientWidth / 2;
        } else {
            // Align card to the start with 32px scroll padding (desktop)
            targetScroll = card.offsetLeft - 32;
        }

        // Clamp to valid scroll range
        const maxScroll = wrap.scrollWidth - wrap.clientWidth;
        targetScroll = Math.max(0, Math.min(maxScroll, targetScroll));

        wrap.scrollTo({ left: targetScroll, behavior: 'smooth' });
        updateActive();
    }

    // ── Visual state of the active card ─────────────────────────
    function updateActive() {
        cards.forEach((card, i) => {
            const iframe = card.querySelector('iframe');
            if (i === activeIndex) {
                card.classList.add('video-active');
            } else {
                card.classList.remove('video-active');
                card.classList.remove('is-interacting');
                // Pause non-active YouTube embeds
                if (iframe && iframe.contentWindow) {
                    try {
                        iframe.contentWindow.postMessage(
                            '{"event":"command","func":"pauseVideo","args":""}', '*'
                        );
                    } catch (_) {}
                }
            }
        });

        // ALWAYS re-query buttons from the DOM. The inline "bulletproof"
        // script in index.html replaces them via cloneNode, so the original
        // prevBtn/nextBtn refs become orphans. We also avoid the .disabled
        // attribute (which cloneNode preserves) and use classes instead so
        // clicks always fire — snapTo clamps to the boundary anyway.
        const prevLive = document.querySelector('.shorts-prev');
        const nextLive = document.querySelector('.shorts-next');
        if (prevLive) {
            prevLive.classList.toggle('is-at-start', activeIndex === 0);
            prevLive.removeAttribute('disabled');
        }
        if (nextLive) {
            nextLive.classList.toggle('is-at-end', activeIndex === cards.length - 1);
            nextLive.removeAttribute('disabled');
        }
    }

    // ── Detect which card is centered via IntersectionObserver ──
    // The user can finger-swipe naturally; we just listen for the result.
    const observer = new IntersectionObserver((entries) => {
        if (Date.now() < suppressObsUntil) return;
        // Find the entry with the highest intersection ratio (most centered)
        let bestIdx   = activeIndex;
        let bestRatio = 0;
        entries.forEach(entry => {
            if (entry.intersectionRatio > bestRatio) {
                bestRatio = entry.intersectionRatio;
                bestIdx   = cards.indexOf(entry.target);
            }
        });
        if (bestIdx !== -1 && bestIdx !== activeIndex && bestRatio > 0.6) {
            activeIndex = bestIdx;
            updateActive();
        }
    }, {
        root:       wrap,
        threshold:  [0.5, 0.7, 0.85, 1.0]
    });
    cards.forEach(card => observer.observe(card));

    // ── Buttons ─────────────────────────────────────────────────
    if (prevBtn) prevBtn.addEventListener('click', e => { e.preventDefault(); snapTo(activeIndex - 1); });
    if (nextBtn) nextBtn.addEventListener('click', e => { e.preventDefault(); snapTo(activeIndex + 1); });

    // Delegated click (survives the button cloning done by the inline script)
    wrap.addEventListener('click', (e) => {
        if (e.target.closest('.shorts-prev')) { e.preventDefault(); snapTo(activeIndex - 1); return; }
        if (e.target.closest('.shorts-next')) { e.preventDefault(); snapTo(activeIndex + 1); return; }
    });

    if (perfL) { perfL.style.cursor = 'pointer'; perfL.addEventListener('click', () => snapTo(activeIndex - 1)); }
    if (perfR) { perfR.style.cursor = 'pointer'; perfR.addEventListener('click', () => snapTo(activeIndex + 1)); }

    // ── Tap-to-interact on the active card (touch only) ─────────
    // On touch devices the iframe is pointer-events:none by default so swipe
    // always works. When the user TAPS the active card we briefly enable the
    // iframe so they can use YouTube/Vimeo controls.
    cards.forEach((card, i) => {
        let sx = 0, sy = 0, st = 0;
        card.addEventListener('touchstart', (e) => {
            const t = e.touches[0];
            sx = t.clientX; sy = t.clientY; st = Date.now();
        }, { passive: true });

        card.addEventListener('touchend', (e) => {
            if (!e.changedTouches.length) return;
            const t  = e.changedTouches[0];
            const dx = Math.abs(t.clientX - sx);
            const dy = Math.abs(t.clientY - sy);
            const dt = Date.now() - st;
            // True tap: small motion AND quick
            if (dx < 12 && dy < 12 && dt < 350) {
                if (i !== activeIndex) {
                    snapTo(i);
                } else if (isTouchDevice) {
                    // Enable iframe interaction briefly
                    card.classList.add('is-interacting');
                    if (interactTimer) clearTimeout(interactTimer);
                    interactTimer = setTimeout(() => {
                        card.classList.remove('is-interacting');
                        interactTimer = null;
                    }, 6000);
                }
            }
        }, { passive: true });

        // Desktop: clicking a non-active card centers it; clicking the
        // active card enables iframe interaction (so user can play it).
        card.addEventListener('click', (e) => {
            if (isTouchDevice) return; // touch handled above
            if (i !== activeIndex) {
                snapTo(i);
                return;
            }
            // Active card clicked → enable iframe for 6s
            card.classList.add('is-interacting');
            if (interactTimer) clearTimeout(interactTimer);
            interactTimer = setTimeout(() => {
                card.classList.remove('is-interacting');
                interactTimer = null;
            }, 6000);
        });
    });

    // ── Pause videos when section is offscreen ──────────────────
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                cards.forEach(card => {
                    const iframe = card.querySelector('iframe');
                    if (iframe && iframe.contentWindow) {
                        try {
                            iframe.contentWindow.postMessage(
                                '{"event":"command","func":"pauseVideo","args":""}', '*'
                            );
                        } catch (_) {}
                    }
                });
            }
        });
    }, { threshold: 0.1 });
    const section = document.querySelector('.shorts-section');
    if (section) sectionObserver.observe(section);

    // ── Expose API for the inline button override ───────────────
    window.__shortsCarousel = {
        snapTo:         (i) => snapTo(i),
        next:           ()  => snapTo(activeIndex + 1),
        prev:           ()  => snapTo(activeIndex - 1),
        getActiveIndex: ()  => activeIndex,
        getCount:       ()  => cards.length
    };

    // ── Initial state ───────────────────────────────────────────
    // Scroll the first card into starting position on load
    requestAnimationFrame(() => {
        wrap.scrollLeft = 0;
        updateActive();
    });
})();

// ── Click/Tap-to-interact for AI Shorts & Real Estate carousels ──
// On every device, iframes are pointer-events: none by default so scrolling
// (mouse wheel or finger) over the carousel passes through to the page.
// A click/tap on a card enables iframe interaction for 6 seconds so the
// user can play the video.
(function () {
    const targets = document.querySelectorAll('.yts-card, .yt-short-card');
    if (!targets.length) return;

    // Inject transparent touch shields over each iframe so mobile browsers
    // can't let the iframe trap vertical thumb swipes.
    targets.forEach(card => {
        if (card.querySelector('.touch-shield')) return;
        // Make sure card is the positioning context
        if (getComputedStyle(card).position === 'static') {
            card.style.position = 'relative';
        }
        const shield = document.createElement('div');
        shield.className = 'touch-shield';
        card.appendChild(shield);
    });

    const timers = new WeakMap();

    function activateCard(card) {
        // Clear other cards' interact state
        targets.forEach(c => {
            if (c !== card) c.classList.remove('is-interacting');
        });
        card.classList.add('is-interacting');
        if (timers.has(card)) clearTimeout(timers.get(card));
        timers.set(card, setTimeout(() => {
            card.classList.remove('is-interacting');
            timers.delete(card);
        }, 6000));
    }

    targets.forEach(card => {
        let sx = 0, sy = 0, st = 0;

        // Touch (mobile)
        card.addEventListener('touchstart', (e) => {
            const t = e.touches[0];
            sx = t.clientX; sy = t.clientY; st = Date.now();
        }, { passive: true });

        card.addEventListener('touchend', (e) => {
            if (!e.changedTouches.length) return;
            const t  = e.changedTouches[0];
            const dx = Math.abs(t.clientX - sx);
            const dy = Math.abs(t.clientY - sy);
            const dt = Date.now() - st;
            // True tap: small motion AND quick
            if (dx < 12 && dy < 12 && dt < 350) {
                activateCard(card);
            }
        }, { passive: true });

        // Mouse click (desktop)
        card.addEventListener('click', () => {
            activateCard(card);
        });
    });
})();

// ── LAST-RESORT: force vertical page scroll on touch over carousels ──
// On mobile, even with shields + pointer-events:none + no-Lenis, some
// browsers still refuse to let vertical thumb drags scroll the page when
// the touch starts over a carousel card. This listener explicitly steps
// in: on touchmove, if motion is mostly vertical, it manually scrolls
// the window using window.scrollBy(). preventDefault stops the carousel
// from grabbing horizontal-look-alike scroll attempts mid-gesture.
(function () {
    const isTouch = window.matchMedia('(pointer: coarse)').matches
                 || ('ontouchstart' in window);
    if (!isTouch) return;

    const SELECTOR = '.short-card, .yts-card, .yt-short-card, .touch-shield';
    let active = false;
    let startY = 0, startX = 0;
    let lastY  = 0;
    let direction = null; // 'v' or 'h' once locked

    document.addEventListener('touchstart', (e) => {
        if (!e.target.closest(SELECTOR)) { active = false; return; }
        if (e.target.closest('.is-interacting')) { active = false; return; }
        active = true;
        direction = null;
        startY = lastY = e.touches[0].clientY;
        startX = e.touches[0].clientX;
    }, { passive: true, capture: true });

    document.addEventListener('touchmove', (e) => {
        if (!active) return;
        const t  = e.touches[0];
        const dy = t.clientY - startY;
        const dx = t.clientX - startX;

        // Lock direction once enough motion accumulated
        if (direction === null) {
            if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
            direction = Math.abs(dy) > Math.abs(dx) ? 'v' : 'h';
        }

        if (direction === 'v') {
            // Force the page to scroll, regardless of what the browser
            // would have decided. Block default to ensure no surprise.
            e.preventDefault();
            const step = lastY - t.clientY; // positive = scroll down
            window.scrollBy(0, step);
            lastY = t.clientY;
        }
        // Horizontal motion: let native handle (carousel scrolls naturally)
    }, { passive: false, capture: true });

    document.addEventListener('touchend', () => {
        active = false;
        direction = null;
    }, { passive: true, capture: true });

    document.addEventListener('touchcancel', () => {
        active = false;
        direction = null;
    }, { passive: true, capture: true });
})();

// ── Contact Form Interaction ──────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const philoForm = document.getElementById('contact-form');
    if (philoForm) {
        philoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = philoForm.querySelector('.form-submit');
            const originalText = btn.textContent;
            
            console.log('Form submission started...');
            
            // Visual feedback for loading state
            btn.textContent = 'Sending...';
            btn.style.opacity = '0.7';
            btn.disabled = true;

            const formData = new FormData(philoForm);

            try {
                const response = await fetch(philoForm.getAttribute('action'), {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                console.log('Server response:', result);

                if (result.success) {
                    // Success state
                    btn.textContent = 'Message Sent!';
                    btn.style.background = 'var(--green)';
                    btn.style.opacity = '1';
                    philoForm.reset();
                    
                    setTimeout(() => {
                        btn.textContent = originalText;
                        btn.style.background = '';
                        btn.disabled = false;
                    }, 4000);
                } else {
                    // Error state from server
                    throw new Error(result.message || 'Something went wrong.');
                }
            } catch (error) {
                console.error('Submission Error:', error);
                btn.textContent = 'Error! Try Again';
                btn.style.background = 'var(--red)';
                btn.style.opacity = '1';
                
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = '';
                    btn.disabled = false;
                }, 4000);
                
                alert('Oops! ' + error.message);
            }
        });
    }
});

// ── Drive poster click-to-load ───────────────────────
document.querySelectorAll('.drive-poster').forEach(btn => {
    btn.addEventListener('click', () => {
        const src = btn.dataset.src;
        if (!src) return;
        const iframe = document.createElement('iframe');
        iframe.src = src;
        iframe.allow = 'autoplay; encrypted-media';
        iframe.allowFullscreen = true;
        iframe.setAttribute('frameborder', '0');
        btn.replaceWith(iframe);
    });
});