const API_BASE = '/api';

async function fetchData(endpoint) {
    try {
        const res = await fetch(`${API_BASE}/${endpoint}`);
        if (!res.ok) throw new Error(`Failed to fetch ${endpoint}`);
        return await res.json();
    } catch (err) {
        console.error(err);
        return null;
    }
}

function renderHero(data) {
    if (!data) return;
    document.getElementById('heroBadge').textContent = data.badge;
    document.getElementById('heroSubtitle').textContent = data.subtitle;

    const titleLines = document.querySelectorAll('#heroTitle .line span');
    const dataLines = data.title.split('\n');
    titleLines.forEach((span, i) => {
        if (dataLines[i]) span.textContent = dataLines[i];
    });

    const magneticBtns = document.querySelectorAll('[data-magnetic]');
    if (magneticBtns[0]) {
        const sp = magneticBtns[0].querySelector('span');
        if (sp && data.btn1Text) sp.textContent = data.btn1Text;
    }
    if (magneticBtns[1]) {
        const sp = magneticBtns[1].querySelector('span');
        if (sp && data.btn2Text) sp.textContent = data.btn2Text;
    }

    const statsContainer = document.getElementById('heroStats');
    statsContainer.innerHTML = '';
    data.stats.forEach((stat) => {
        const div = document.createElement('div');
        div.className = 'stat';
        div.innerHTML = `
            <span class="stat-number" data-target="${stat.value}">0</span>
            <span class="stat-label">${stat.label}</span>
        `;
        statsContainer.appendChild(div);
    });

    const statsObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    if (typeof window.animateCounters === 'function') {
                        window.animateCounters();
                    }
                    statsObserver.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.5 }
    );
    statsObserver.observe(statsContainer);
}

function renderAbout(data) {
    if (!data) return;
    document.getElementById('aboutTag').textContent = data.tag;
    document.getElementById('aboutTitle').innerHTML = data.title;
    const grid = document.getElementById('aboutGrid');
    grid.innerHTML = '';
    data.cards.forEach((card) => {
        const div = document.createElement('div');
        div.className = 'about-card';
        div.innerHTML = `
            <i class="${card.icon} about-icon"></i>
            <h3>${card.title}</h3>
            <p>${card.description}</p>
        `;
        grid.appendChild(div);
    });
}

function renderSkills(data) {
    if (!data) return;
    document.getElementById('skillsTag').textContent = data.tag;
    document.getElementById('skillsTitle').innerHTML = data.title;
    const grid = document.getElementById('skillsGrid');
    grid.innerHTML = '';
    data.categories.forEach((cat) => {
        const div = document.createElement('div');
        div.className = 'skill-category';
        div.innerHTML = `
            <h3 class="skill-cat-title"><i class="${cat.icon}"></i> ${cat.name}</h3>
            <div class="skill-tags">
                ${cat.items.map((s) => `<span class="skill-tag">${s}</span>`).join('')}
            </div>
        `;
        grid.appendChild(div);
    });
}

function renderExperience(data) {
    if (!data) return;
    document.getElementById('expTag').textContent = data.tag;
    document.getElementById('expTitle').innerHTML = data.title;
    const timeline = document.getElementById('timeline');
    timeline.innerHTML = '';
    data.items.forEach((item) => {
        const div = document.createElement('div');
        div.className = 'timeline-item';
        div.innerHTML = `
            <div class="timeline-dot"></div>
            <div class="timeline-date">${item.date}</div>
            <div class="timeline-content">
                <h3>${item.role}</h3>
                <h4>${item.company}</h4>
                <p>${item.description}</p>
            </div>
        `;
        timeline.appendChild(div);
    });
}

function renderProjects(data) {
    if (!data) return;
    document.getElementById('projectsTag').textContent = data.tag;
    document.getElementById('projectsTitle').innerHTML = data.title;
    const grid = document.getElementById('projectsGrid');
    grid.innerHTML = '';
    data.items.forEach((proj) => {
        const div = document.createElement('div');
        div.className = 'project-card';
        const previewStyle = proj.image
            ? `background: ${proj.previewBg}; background-image: url('${proj.image}'); background-size: cover; background-position: center;`
            : `background: ${proj.previewBg};`;
        div.innerHTML = `
            <div class="project-preview" style="${previewStyle}">
                ${proj.image ? `<img src="${proj.image}" alt="${proj.title}" style="display:none;" />` : ''}
                <i class="${proj.icon} project-preview-icon"></i>
            </div>
            <div class="project-body">
                <div class="project-tags">
                    ${proj.tags.map((t) => `<span>${t}</span>`).join('')}
                </div>
                <h3>${proj.title}</h3>
                <p>${proj.description}</p>
                <div class="project-links">
                    ${proj.links.map((l) => `<a href="${l.url}" class="project-link"><i class="${l.icon}"></i> ${l.label}</a>`).join('')}
                </div>
            </div>
        `;
        grid.appendChild(div);
    });
}

function renderContact(data) {
    if (!data) return;
    document.getElementById('contactTag').textContent = data.tag;
    document.getElementById('contactTitle').innerHTML = data.title;
    const info = document.getElementById('contactInfo');
    info.innerHTML = '';
    data.items.forEach((item) => {
        const div = document.createElement('div');
        div.className = 'contact-item';
        div.innerHTML = `
            <i class="${item.icon}"></i>
            <div>
                <h4>${item.label}</h4>
                <p>${item.value}</p>
            </div>
        `;
        info.appendChild(div);
    });
}

function renderFooter(data) {
    if (!data) return;
    document.getElementById('footerLogo').innerHTML = data.logo;
    document.getElementById('footerTagline').textContent = data.tagline;
    document.getElementById('footerCopyright').textContent = data.copyright;

    const links = document.getElementById('footerLinks');
    links.innerHTML = '';
    data.links.forEach((l) => {
        const a = document.createElement('a');
        a.href = l.url;
        a.textContent = l.label;
        links.appendChild(a);
    });

    const social = document.getElementById('footerSocial');
    social.innerHTML = '';
    data.social.forEach((s) => {
        const a = document.createElement('a');
        a.href = s.url;
        a.className = 'social-link';
        a.innerHTML = `<i class="${s.icon}"></i>`;
        a.target = '_blank';
        social.appendChild(a);
    });
}

function initTimelineObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.timeline-item').forEach((item) => {
        observer.observe(item);
    });
}

async function loadAll() {
    const sections = [
        'hero',
        'about',
        'skills',
        'experience',
        'projects',
        'contact',
        'footer',
    ];
    const results = await Promise.all(sections.map(fetchData));
    const [hero, about, skills, experience, projects, contact, footer] = results;

    renderHero(hero);
    renderAbout(about);
    renderSkills(skills);
    renderExperience(experience);
    renderProjects(projects);
    renderContact(contact);
    renderFooter(footer);

    initTimelineObserver();

    if (typeof window.__setupRevealAnimations === 'function') {
        window.__setupRevealAnimations();
    }

    const loader = document.getElementById('loading-screen');
    if (loader) setTimeout(() => loader.classList.add('hidden'), 400);
}

document.addEventListener('DOMContentLoaded', loadAll);
