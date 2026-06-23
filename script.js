// ===== LENIS SMOOTH SCROLL =====
(function initLenis() {
    if (typeof Lenis === 'undefined') {
        document.documentElement.style.scrollBehavior = 'smooth';
        return;
    }

    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.5,
    });

    const progressBar = document.getElementById('scroll-progress');
    const backToTopBtn = document.getElementById('back-to-top');
    const navbar = document.querySelector('.navbar');
    const sections = document.querySelectorAll('.section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    lenis.on('scroll', (e) => {
        const s = e.scroll;
        const pct = e.progress * 100;

        if (progressBar) progressBar.style.width = Math.min(pct, 100) + '%';
        if (backToTopBtn) backToTopBtn.classList.toggle('visible', s > 500);
        if (navbar) navbar.classList.toggle('scrolled', s > 50);

        if (sections.length && navLinks.length) {
            let current = '';
            sections.forEach((sec) => {
                if (s >= sec.offsetTop - 200) current = sec.id;
            });
            navLinks.forEach((l) => {
                l.classList.toggle('active', l.getAttribute('href') === '#' + current);
            });
        }
    });

    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => lenis.scrollTo(0, { duration: 1.5 }));
    }

    navLinks.forEach((link) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(link.getAttribute('href'));
            if (target) lenis.scrollTo(target, { duration: 1.2, offset: -70 });

            const hamburger = document.getElementById('hamburger');
            const navContainer = document.getElementById('navLinks');
            if (hamburger && navContainer) {
                hamburger.classList.remove('active');
                navContainer.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);
    } else {
        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
    }

    window.lenis = lenis;
})();

// ===== LOADING SCREEN =====
window.addEventListener('load', () => {
    const loader = document.getElementById('loading-screen');
    if (loader) setTimeout(() => loader.classList.add('hidden'), 500);
});

// ===== CUSTOM CURSOR =====
(function initCursor() {
    const dot = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    if (!dot || !ring) return;

    let mx = 0, my = 0, rx = 0, ry = 0;

    document.addEventListener('mousemove', (e) => {
        mx = e.clientX; my = e.clientY;
        dot.style.left = mx + 'px';
        dot.style.top = my + 'px';
    });

    function animateRing() {
        rx += (mx - rx) * 0.12;
        ry += (my - ry) * 0.12;
        ring.style.left = rx + 'px';
        ring.style.top = ry + 'px';
        requestAnimationFrame(animateRing);
    }
    animateRing();

    document.querySelectorAll('a, button, .btn, .project-card, .about-card, .skill-category, .social-link, .contact-item, .nav-link').forEach(el => {
        el.addEventListener('mouseenter', () => ring.classList.add('hovered'));
        el.addEventListener('mouseleave', () => ring.classList.remove('hovered'));
    });
})();

// ===== MOBILE NAV =====
(function initMobileNav() {
    const hamburger = document.getElementById('hamburger');
    const navContainer = document.getElementById('navLinks');
    if (!hamburger || !navContainer) return;

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navContainer.classList.toggle('active');
        document.body.style.overflow = navContainer.classList.contains('active') ? 'hidden' : '';
    });
})();

// ===== COUNTER =====
window.animateCounters = function () {
    document.querySelectorAll('.stat-number').forEach(counter => {
        const target = parseInt(counter.dataset.target);
        if (isNaN(target)) return;
        const increment = target / 60;
        let current = 0;
        const update = () => {
            current += increment;
            if (current < target) {
                counter.textContent = Math.ceil(current) + '+';
                requestAnimationFrame(update);
            } else {
                counter.textContent = target + '+';
            }
        };
        update();
    });
};

// ===== CONTACT FORM =====
(function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('.btn');
        const original = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        btn.disabled = true;

        const data = {
            name: document.getElementById('formName')?.value || '',
            email: document.getElementById('formEmail')?.value || '',
            subject: document.getElementById('formSubject')?.value || '',
            message: document.getElementById('formMessage')?.value || '',
        };

        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = await res.json();
            if (res.ok) {
                btn.innerHTML = '<i class="fas fa-check"></i> Message Sent!';
                btn.style.background = 'linear-gradient(135deg, #7c5cfc, #d4a25a)';
                form.reset();
            } else {
                btn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> ' + (result.error || 'Error');
                btn.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
            }
        } catch {
            btn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Network Error';
            btn.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
        }

        setTimeout(() => {
            btn.innerHTML = original;
            btn.style.background = '';
            btn.disabled = false;
        }, 4000);
    });
})();

// ===== GSAP SCROLLTRIGGER ANIMATIONS =====
(function initGSAP() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        fallbackAnimations();
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const isMobile = window.innerWidth < 768;

    // Hero entrance (animates static HTML elements)
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    heroTl
        .from('.hero-badge', { y: 40, opacity: 0, duration: 0.8 })
        .from('.hero-title .line span', { y: 60, opacity: 0, duration: 0.8, stagger: 0.1 }, '-=0.4')
        .from('.hero-subtitle', { y: 40, opacity: 0, duration: 0.8 }, '-=0.4')
        .from('.hero-actions', { y: 30, opacity: 0, duration: 0.6 }, '-=0.3')
        .from('.hero-stats .stat', { y: 30, opacity: 0, stagger: 0.1, duration: 0.5 }, '-=0.2');

    // Parallax effects (need ScrollTrigger, not dependent on api-loader content)
    gsap.to('#particles-canvas', {
        scrollTrigger: {
            trigger: '#hero',
            start: 'top top',
            end: 'bottom top',
            scrub: true,
        },
        opacity: 0.3,
        scale: 0.95,
        ease: 'none',
    });

    gsap.from('.hero-title .line', {
        scrollTrigger: {
            trigger: '#hero',
            start: 'top top',
            end: 'center top',
            scrub: true,
        },
        opacity: 0.2,
        ease: 'none',
    });

    // Deferred section reveal — called after api-loader populates content
    window.__setupRevealAnimations = function () {
        const isMobile = window.innerWidth < 768;

        function createScrollTrigger(selector, extra) {
            const el = document.querySelector(selector);
            if (!el) return;
            gsap.from(el, {
                scrollTrigger: {
                    trigger: el,
                    start: isMobile ? 'top 90%' : 'top 85%',
                    toggleActions: 'play none none none',
                    once: true,
                },
                y: 50,
                opacity: 0,
                duration: 0.9,
                ease: 'power3.out',
                ...extra,
            });
        }

        function staggerChildren(containerSelector, childSelector, opts) {
            const parent = document.querySelector(containerSelector);
            if (!parent) return;
            const items = parent.querySelectorAll(childSelector);
            if (!items.length) return;

            gsap.from(items, {
                scrollTrigger: {
                    trigger: parent,
                    start: isMobile ? 'top 92%' : 'top 88%',
                    toggleActions: 'play none none none',
                    once: true,
                },
                y: 40,
                opacity: 0,
                stagger: 0.08,
                duration: 0.7,
                ease: 'back.out(1.4)',
                ...opts,
            });
        }

        staggerChildren('.about-grid', '.about-card');
        staggerChildren('.skills-grid', '.skill-category');
        staggerChildren('.timeline', '.timeline-item', { x: -40, ease: 'power3.out' });
        staggerChildren('.timeline', '.timeline-dot', { scale: 0, duration: 0.5, ease: 'back.out(2)' });
        staggerChildren('.projects-grid', '.project-card');
        staggerChildren('.contact-info', '.contact-item', { x: -30, ease: 'power3.out' });

        createScrollTrigger('.contact-form', { x: 40 });
        createScrollTrigger('.footer-content > div', { stagger: 0.1 });

        ScrollTrigger.refresh();
    };

    // Called from api-loader.js after content is populated
})();

// ===== FALLBACK =====
function fallbackAnimations() {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );

    document.querySelectorAll('.section-header, .about-card, .skill-category, .timeline-item, .project-card, .contact-item, .contact-form, .footer-content > div').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.7s cubic-bezier(0.4, 0, 0.2, 1)';
        observer.observe(el);
    });
}

// ===== 3D TILT =====
(function initTilt() {
    document.querySelectorAll('.about-card, .project-card, .skill-category').forEach(card => {
        card.style.transition = 'transform 0.3s ease';

        const glare = document.createElement('div');
        glare.style.cssText = 'position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:0;transition:opacity 0.3s;z-index:1;';
        card.style.position = 'relative';
        card.appendChild(glare);

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            const tiltX = (y - 0.5) * -12;
            const tiltY = (x - 0.5) * 12;

            card.style.transform = `perspective(1200px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-6px)`;
            glare.style.background = `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.06), transparent 60%)`;
            glare.style.opacity = '1';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) translateY(0)';
            glare.style.opacity = '0';
        });
    });
})();

// ===== MAGNETIC BUTTONS =====
(function initMagnetic() {
    document.querySelectorAll('[data-magnetic]').forEach(btn => {
        let ticking = false;

        btn.addEventListener('mousemove', (e) => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const rect = btn.getBoundingClientRect();
                    const x = e.clientX - rect.left - rect.width / 2;
                    const y = e.clientY - rect.top - rect.height / 2;
                    btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
                    ticking = false;
                });
                ticking = true;
            }
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
        });
    });
})();

// ===== REFRESH SCROLLTRIGGER ON RESIZE =====
if (typeof ScrollTrigger !== 'undefined') {
    window.addEventListener('resize', () => ScrollTrigger.refresh());
}
