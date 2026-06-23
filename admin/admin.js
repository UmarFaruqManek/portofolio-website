const API_BASE = '/api';
let authToken = '';
let currentSection = 'hero';
let currentData = null;
let allData = null;
let _itemId = 1000;
function nextItemId() { return _itemId++; }

function getAuthHeader() {
    return { 'Authorization': 'Basic ' + authToken, 'Content-Type': 'application/json' };
}

async function apiGet(endpoint) {
    const res = await fetch(`${API_BASE}/${endpoint}`, {
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' }
    });
    if (res.status === 401) { logout(); return null; }
    return res.json();
}

async function apiPut(endpoint, body) {
    const res = await fetch(`${API_BASE}/${endpoint}`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify(body)
    });
    if (res.status === 401) { logout(); return null; }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Save failed');
    return data;
}

async function apiPost(endpoint, body) {
    const res = await fetch(`${API_BASE}/${endpoint}`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(body)
    });
    if (res.status === 401) { logout(); return null; }
    return res.json();
}

async function apiDelete(endpoint) {
    const res = await fetch(`${API_BASE}/${endpoint}`, {
        method: 'DELETE',
        headers: getAuthHeader()
    });
    if (res.status === 401) { logout(); return null; }
    return res.json();
}

// Login
document.getElementById('loginBtn').addEventListener('click', async () => {
    const user = document.getElementById('loginUser').value;
    const pass = document.getElementById('loginPass').value;
    const token = btoa(`${user}:${pass}`);
    authToken = token;

    try {
        const res = await fetch(`${API_BASE}/hero`, {
            headers: { 'Authorization': 'Basic ' + token }
        });
        if (res.status === 401) {
            document.getElementById('loginError').textContent = 'Invalid credentials';
            return;
        }
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'flex';
        initDashboard();
    } catch (err) {
        document.getElementById('loginError').textContent = 'Connection error. Is the server running?';
    }
});

document.getElementById('loginPass').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('loginBtn').click();
});

function logout() {
    authToken = '';
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('loginError').textContent = 'Session expired. Please login again.';
}

document.getElementById('logoutBtn').addEventListener('click', logout);

// Dashboard Init
async function initDashboard() {
    allData = await apiGet('');
    if (!allData) return;
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            loadSection(item.dataset.section);
        });
    });

    loadSection('hero');
}

async function loadSection(section) {
    currentSection = section;
    currentData = allData[section];
    if (!currentData) {
        document.getElementById('contentBody').innerHTML = '<div class="loading">Section not found</div>';
        return;
    }

    const titles = {
        hero: 'Hero Section',
        about: 'About Section',
        skills: 'Skills & Technologies',
        experience: 'Experience Timeline',
        projects: 'Featured Projects',
        contact: 'Contact Information',
        footer: 'Footer Settings'
    };

    document.getElementById('sectionTitle').textContent = titles[section] || section;
    document.getElementById('sectionStatus').textContent = 'Editing';
    document.getElementById('saveMessage').textContent = '';

    _itemId = allData[section]?.items?.length || allData[section]?.cards?.length || allData[section]?.categories?.length || allData[section]?.stats?.length || allData[section]?.links?.length || allData[section]?.social?.length || 0;

    const renderFn = renderers[section];
    if (renderFn) {
        document.getElementById('contentBody').innerHTML = renderFn(currentData);
        bindFormEvents(section);
    } else {
        document.getElementById('contentBody').innerHTML = '<div class="loading">No editor available</div>';
    }
}

// Save
document.getElementById('saveBtn').addEventListener('click', async () => {
    const form = document.getElementById('sectionForm');
    if (!form) return;

    const msg = document.getElementById('saveMessage');
    msg.textContent = 'Saving...';
    msg.className = 'save-message';

    try {
        const data = collectFormData(currentSection);
        const result = await apiPut(currentSection, data);
        if (result) {
            allData[currentSection] = result.data;
            msg.textContent = '✓ Saved successfully!';
            msg.className = 'save-message';
            setTimeout(() => { msg.textContent = ''; }, 3000);
        }
    } catch (err) {
        msg.textContent = '✗ Error: ' + err.message;
        msg.className = 'save-message error';
    }
});

// ====== RENDERERS ======

const renderers = {};

renderers.hero = (data) => `
<form id="sectionForm">
    <div class="form-section">
        <h3><i class="fas fa-tag"></i> Main Content</h3>
        <div class="form-group">
            <label>Badge</label>
            <input type="text" name="badge" value="${esc(data.badge)}" />
        </div>
        <div class="form-group">
            <label>Title (use \\n for line break)</label>
            <textarea name="title" rows="3">${esc(data.title)}</textarea>
        </div>
        <div class="form-group">
            <label>Subtitle</label>
            <textarea name="subtitle" rows="3">${esc(data.subtitle)}</textarea>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Button 1 Text</label>
                <input type="text" name="btn1Text" value="${esc(data.btn1Text)}" />
            </div>
            <div class="form-group">
                <label>Button 2 Text</label>
                <input type="text" name="btn2Text" value="${esc(data.btn2Text)}" />
            </div>
        </div>
    </div>
    <div class="form-section">
        <h3><i class="fas fa-chart-bar"></i> Statistics</h3>
        <div class="stats-editor" id="statsEditor">
            ${data.stats.map((s, i) => `
                <div class="stat-item" data-index="${i}">
                    <input type="text" name="statLabel_${i}" value="${esc(s.label)}" placeholder="Label" />
                    <input type="number" name="statValue_${i}" value="${s.value}" placeholder="Value" />
                    <button type="button" class="btn btn-danger btn-sm" onclick="deleteStat(${i})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('')}
        </div>
        <button type="button" class="add-item-btn" onclick="addStat()">
            <i class="fas fa-plus"></i> Add Statistic
        </button>
    </div>
</form>`;

renderers.about = (data) => `
<form id="sectionForm">
    <div class="form-section">
        <h3><i class="fas fa-tag"></i> Section Header</h3>
        <div class="form-row">
            <div class="form-group">
                <label>Tag</label>
                <input type="text" name="tag" value="${esc(data.tag)}" />
            </div>
            <div class="form-group">
                <label>Title (HTML allowed)</label>
                <input type="text" name="title" value="${esc(data.title)}" />
            </div>
        </div>
    </div>
    <div class="form-section">
        <h3><i class="fas fa-layer-group"></i> Cards</h3>
        <div class="array-items" id="aboutCards">
            ${data.cards.map((card, i) => `
                <div class="array-item" data-index="${i}">
                    <div class="array-item-header">
                        <h4>${esc(card.title)}</h4>
                        <div class="array-item-actions">
                            <button type="button" class="toggle-btn" onclick="toggleItem(this)"><i class="fas fa-chevron-up"></i></button>
                            <button type="button" class="delete-btn" onclick="deleteItem('about', ${i})"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    <div class="array-item-body">
                        <div class="form-group">
                            <label>Icon (Font Awesome class)</label>
                            <input type="text" name="aboutIcon_${i}" value="${esc(card.icon)}" />
                        </div>
                        <div class="form-group">
                            <label>Title</label>
                            <input type="text" name="aboutTitle_${i}" value="${esc(card.title)}" />
                        </div>
                        <div class="form-group">
                            <label>Description</label>
                            <textarea name="aboutDesc_${i}" rows="3">${esc(card.description)}</textarea>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        <button type="button" class="add-item-btn" onclick="addAboutCard()">
            <i class="fas fa-plus"></i> Add Card
        </button>
    </div>
</form>`;

renderers.skills = (data) => `
<form id="sectionForm">
    <div class="form-section">
        <h3><i class="fas fa-tag"></i> Section Header</h3>
        <div class="form-row">
            <div class="form-group">
                <label>Tag</label>
                <input type="text" name="tag" value="${esc(data.tag)}" />
            </div>
            <div class="form-group">
                <label>Title (HTML allowed)</label>
                <input type="text" name="title" value="${esc(data.title)}" />
            </div>
        </div>
    </div>
    <div class="form-section">
        <h3><i class="fas fa-list"></i> Categories</h3>
        <div class="array-items" id="skillCategories">
            ${data.categories.map((cat, i) => `
                <div class="array-item" data-index="${i}">
                    <div class="array-item-header">
                        <h4>${esc(cat.name)}</h4>
                        <div class="array-item-actions">
                            <button type="button" class="toggle-btn" onclick="toggleItem(this)"><i class="fas fa-chevron-up"></i></button>
                            <button type="button" class="delete-btn" onclick="deleteItem('skills', ${i})"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    <div class="array-item-body">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Category Name</label>
                                <input type="text" name="skillCatName_${i}" value="${esc(cat.name)}" />
                            </div>
                            <div class="form-group">
                                <label>Icon</label>
                                <input type="text" name="skillCatIcon_${i}" value="${esc(cat.icon)}" />
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Skills (comma separated)</label>
                            <input type="text" name="skillCatItems_${i}" value="${esc(cat.items.join(', '))}" />
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        <button type="button" class="add-item-btn" onclick="addSkillCategory()">
            <i class="fas fa-plus"></i> Add Category
        </button>
    </div>
</form>`;

renderers.experience = (data) => `
<form id="sectionForm">
    <div class="form-section">
        <h3><i class="fas fa-tag"></i> Section Header</h3>
        <div class="form-row">
            <div class="form-group">
                <label>Tag</label>
                <input type="text" name="tag" value="${esc(data.tag)}" />
            </div>
            <div class="form-group">
                <label>Title (HTML allowed)</label>
                <input type="text" name="title" value="${esc(data.title)}" />
            </div>
        </div>
    </div>
    <div class="form-section">
        <h3><i class="fas fa-briefcase"></i> Timeline Items</h3>
        <div class="array-items" id="expItems">
            ${data.items.map((item, i) => `
                <div class="array-item" data-index="${i}">
                    <div class="array-item-header">
                        <h4>${esc(item.role)} @ ${esc(item.company)}</h4>
                        <div class="array-item-actions">
                            <button type="button" class="toggle-btn" onclick="toggleItem(this)"><i class="fas fa-chevron-up"></i></button>
                            <button type="button" class="delete-btn" onclick="deleteItem('experience', ${i})"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    <div class="array-item-body">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Date</label>
                                <input type="text" name="expDate_${i}" value="${esc(item.date)}" />
                            </div>
                            <div class="form-group">
                                <label>Role</label>
                                <input type="text" name="expRole_${i}" value="${esc(item.role)}" />
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Company</label>
                            <input type="text" name="expCompany_${i}" value="${esc(item.company)}" />
                        </div>
                        <div class="form-group">
                            <label>Description</label>
                            <textarea name="expDesc_${i}" rows="3">${esc(item.description)}</textarea>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        <button type="button" class="add-item-btn" onclick="addExperience()">
            <i class="fas fa-plus"></i> Add Experience
        </button>
    </div>
</form>`;

renderers.projects = (data) => `
<form id="sectionForm">
    <div class="form-section">
        <h3><i class="fas fa-tag"></i> Section Header</h3>
        <div class="form-row">
            <div class="form-group">
                <label>Tag</label>
                <input type="text" name="tag" value="${esc(data.tag)}" />
            </div>
            <div class="form-group">
                <label>Title (HTML allowed)</label>
                <input type="text" name="title" value="${esc(data.title)}" />
            </div>
        </div>
    </div>
    <div class="form-section">
        <h3><i class="fas fa-project-diagram"></i> Projects</h3>
        <div class="array-items" id="projItems">
            ${data.items.map((proj, i) => `
                <div class="array-item" data-index="${i}">
                    <div class="array-item-header">
                        <h4>${esc(proj.title)}</h4>
                        <div class="array-item-actions">
                            <button type="button" class="toggle-btn" onclick="toggleItem(this)"><i class="fas fa-chevron-up"></i></button>
                            <button type="button" class="delete-btn" onclick="deleteItem('projects', ${i})"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    <div class="array-item-body">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Title</label>
                                <input type="text" name="projTitle_${i}" value="${esc(proj.title)}" />
                            </div>
                            <div class="form-group">
                                <label>Icon</label>
                                <input type="text" name="projIcon_${i}" value="${esc(proj.icon)}" />
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Description</label>
                            <textarea name="projDesc_${i}" rows="3">${esc(proj.description)}</textarea>
                        </div>
                        <div class="form-group">
                            <label>Preview Background (CSS gradient)</label>
                            <input type="text" name="projBg_${i}" value="${esc(proj.previewBg)}" />
                        </div>
                        <div class="form-group">
                            <label>Tags (comma separated)</label>
                            <input type="text" name="projTags_${i}" value="${esc(proj.tags.join(', '))}" />
                        </div>
                        <div class="form-group">
                            <label>Links (format: icon|label|url per line)</label>
                            <textarea name="projLinks_${i}" rows="3">${esc(proj.links.map(l => `${l.icon}|${l.label}|${l.url}`).join('\n'))}</textarea>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        <button type="button" class="add-item-btn" onclick="addProject()">
            <i class="fas fa-plus"></i> Add Project
        </button>
    </div>
</form>`;

renderers.contact = (data) => `
<form id="sectionForm">
    <div class="form-section">
        <h3><i class="fas fa-tag"></i> Section Header</h3>
        <div class="form-row">
            <div class="form-group">
                <label>Tag</label>
                <input type="text" name="tag" value="${esc(data.tag)}" />
            </div>
            <div class="form-group">
                <label>Title (HTML allowed)</label>
                <input type="text" name="title" value="${esc(data.title)}" />
            </div>
        </div>
    </div>
    <div class="form-section">
        <h3><i class="fas fa-address-card"></i> Contact Items</h3>
        <div class="array-items" id="contactItems">
            ${data.items.map((item, i) => `
                <div class="array-item" data-index="${i}">
                    <div class="array-item-header">
                        <h4>${esc(item.label)}</h4>
                        <div class="array-item-actions">
                            <button type="button" class="toggle-btn" onclick="toggleItem(this)"><i class="fas fa-chevron-up"></i></button>
                            <button type="button" class="delete-btn" onclick="deleteItem('contact', ${i})"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    <div class="array-item-body">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Icon</label>
                                <input type="text" name="contactIcon_${i}" value="${esc(item.icon)}" />
                            </div>
                            <div class="form-group">
                                <label>Label</label>
                                <input type="text" name="contactLabel_${i}" value="${esc(item.label)}" />
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Value</label>
                            <input type="text" name="contactValue_${i}" value="${esc(item.value)}" />
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        <button type="button" class="add-item-btn" onclick="addContactItem()">
            <i class="fas fa-plus"></i> Add Contact Item
        </button>
    </div>
</form>`;

renderers.footer = (data) => `
<form id="sectionForm">
    <div class="form-section">
        <h3><i class="fas fa-cog"></i> Footer Settings</h3>
        <div class="form-group">
            <label>Logo (HTML allowed)</label>
            <input type="text" name="logo" value="${esc(data.logo)}" />
        </div>
        <div class="form-group">
            <label>Tagline</label>
            <input type="text" name="tagline" value="${esc(data.tagline)}" />
        </div>
        <div class="form-group">
            <label>Copyright</label>
            <input type="text" name="copyright" value="${esc(data.copyright)}" />
        </div>
    </div>
    <div class="form-section">
        <h3><i class="fas fa-link"></i> Navigation Links</h3>
        <div class="array-items" id="footerLinks">
            ${data.links.map((l, i) => `
                <div class="array-item" data-index="${i}">
                    <div class="array-item-header">
                        <h4>${esc(l.label)}</h4>
                        <div class="array-item-actions">
                            <button type="button" class="delete-btn" onclick="deleteFooterLink(${i})"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    <div class="array-item-body">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Label</label>
                                <input type="text" name="footerLinkLabel_${i}" value="${esc(l.label)}" />
                            </div>
                            <div class="form-group">
                                <label>URL</label>
                                <input type="text" name="footerLinkUrl_${i}" value="${esc(l.url)}" />
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        <button type="button" class="add-item-btn" onclick="addFooterLink()">
            <i class="fas fa-plus"></i> Add Link
        </button>
    </div>
    <div class="form-section">
        <h3><i class="fas fa-share-alt"></i> Social Links</h3>
        <div class="array-items" id="footerSocial">
            ${data.social.map((s, i) => `
                <div class="array-item" data-index="${i}">
                    <div class="array-item-header">
                        <h4>${esc(s.icon)}</h4>
                        <div class="array-item-actions">
                            <button type="button" class="delete-btn" onclick="deleteFooterSocial(${i})"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    <div class="array-item-body">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Icon</label>
                                <input type="text" name="footerSocialIcon_${i}" value="${esc(s.icon)}" />
                            </div>
                            <div class="form-group">
                                <label>URL</label>
                                <input type="text" name="footerSocialUrl_${i}" value="${esc(s.url)}" />
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        <button type="button" class="add-item-btn" onclick="addFooterSocial()">
            <i class="fas fa-plus"></i> Add Social Link
        </button>
    </div>
</form>`;

// ====== HELPERS ======

function esc(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function toggleItem(btn) {
    const body = btn.closest('.array-item').querySelector('.array-item-body');
    body.classList.toggle('hidden');
    btn.querySelector('i').classList.toggle('fa-chevron-up');
    btn.querySelector('i').classList.toggle('fa-chevron-down');
}

// ====== COLLECT FORM DATA ======

function collectFormData(section) {
    switch (section) {
        case 'hero': return collectHero();
        case 'about': return collectAbout();
        case 'skills': return collectSkills();
        case 'experience': return collectExperience();
        case 'projects': return collectProjects();
        case 'contact': return collectContact();
        case 'footer': return collectFooter();
        default: return {};
    }
}

function collectHero() {
    const form = document.getElementById('sectionForm');
    const fd = new FormData(form);
    const stats = [];
    const statEls = document.querySelectorAll('.stat-item');
    statEls.forEach(el => {
        const label = el.querySelector('input[type="text"]').value;
        const value = parseInt(el.querySelector('input[type="number"]').value) || 0;
        if (label) stats.push({ label, value });
    });
    return {
        badge: fd.get('badge'),
        title: fd.get('title'),
        subtitle: fd.get('subtitle'),
        btn1Text: fd.get('btn1Text'),
        btn2Text: fd.get('btn2Text'),
        stats
    };
}

function collectAbout() {
    const form = document.getElementById('sectionForm');
    const fd = new FormData(form);
    const cards = [];
    const items = document.querySelectorAll('#aboutCards .array-item');
    items.forEach(item => {
        const idx = item.dataset.index;
        cards.push({
            icon: fd.get(`aboutIcon_${idx}`),
            title: fd.get(`aboutTitle_${idx}`),
            description: fd.get(`aboutDesc_${idx}`)
        });
    });
    return { tag: fd.get('tag'), title: fd.get('title'), cards };
}

function collectSkills() {
    const form = document.getElementById('sectionForm');
    const fd = new FormData(form);
    const categories = [];
    const items = document.querySelectorAll('#skillCategories .array-item');
    items.forEach(item => {
        const idx = item.dataset.index;
        const names = fd.get(`skillCatItems_${idx}`) || '';
        categories.push({
            name: fd.get(`skillCatName_${idx}`),
            icon: fd.get(`skillCatIcon_${idx}`),
            items: names.split(',').map(s => s.trim()).filter(Boolean)
        });
    });
    return { tag: fd.get('tag'), title: fd.get('title'), categories };
}

function collectExperience() {
    const form = document.getElementById('sectionForm');
    const fd = new FormData(form);
    const items = [];
    const expItems = document.querySelectorAll('#expItems .array-item');
    expItems.forEach(item => {
        const idx = item.dataset.index;
        items.push({
            date: fd.get(`expDate_${idx}`),
            role: fd.get(`expRole_${idx}`),
            company: fd.get(`expCompany_${idx}`),
            description: fd.get(`expDesc_${idx}`)
        });
    });
    return { tag: fd.get('tag'), title: fd.get('title'), items };
}

function collectProjects() {
    const form = document.getElementById('sectionForm');
    const fd = new FormData(form);
    const items = [];
    const projItems = document.querySelectorAll('#projItems .array-item');
    projItems.forEach(item => {
        const idx = item.dataset.index;
        const tagsStr = fd.get(`projTags_${idx}`) || '';
        const linksStr = fd.get(`projLinks_${idx}`) || '';
        const links = linksStr.split('\n').filter(Boolean).map(line => {
            const parts = line.split('|');
            return { icon: parts[0] || '', label: parts[1] || '', url: parts[2] || '#' };
        });
        items.push({
            title: fd.get(`projTitle_${idx}`),
            description: fd.get(`projDesc_${idx}`),
            icon: fd.get(`projIcon_${idx}`),
            previewBg: fd.get(`projBg_${idx}`),
            tags: tagsStr.split(',').map(s => s.trim()).filter(Boolean),
            links
        });
    });
    return { tag: fd.get('tag'), title: fd.get('title'), items };
}

function collectContact() {
    const form = document.getElementById('sectionForm');
    const fd = new FormData(form);
    const items = [];
    const contactItems = document.querySelectorAll('#contactItems .array-item');
    contactItems.forEach(item => {
        const idx = item.dataset.index;
        items.push({
            icon: fd.get(`contactIcon_${idx}`),
            label: fd.get(`contactLabel_${idx}`),
            value: fd.get(`contactValue_${idx}`)
        });
    });
    return { tag: fd.get('tag'), title: fd.get('title'), items };
}

function collectFooter() {
    const form = document.getElementById('sectionForm');
    const fd = new FormData(form);
    const links = [];
    const social = [];
    document.querySelectorAll('#footerLinks .array-item').forEach(item => {
        const idx = item.dataset.index;
        links.push({
            label: fd.get(`footerLinkLabel_${idx}`),
            url: fd.get(`footerLinkUrl_${idx}`)
        });
    });
    document.querySelectorAll('#footerSocial .array-item').forEach(item => {
        const idx = item.dataset.index;
        social.push({
            icon: fd.get(`footerSocialIcon_${idx}`),
            url: fd.get(`footerSocialUrl_${idx}`)
        });
    });
    return {
        logo: fd.get('logo'),
        tagline: fd.get('tagline'),
        copyright: fd.get('copyright'),
        links,
        social
    };
}

// ====== ADD / DELETE ITEMS (front-end only, then save) ======

function addStat() {
    const editor = document.getElementById('statsEditor');
    const idx = nextItemId();
    const div = document.createElement('div');
    div.className = 'stat-item';
    div.dataset.index = idx;
    div.innerHTML = `
        <input type="text" name="statLabel_${idx}" placeholder="Label" />
        <input type="number" name="statValue_${idx}" placeholder="Value" value="0" />
        <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    editor.appendChild(div);
}

function deleteStat(index) {
    const el = document.querySelector(`.stat-item[data-index="${index}"]`);
    if (el) el.remove();
}

function addAboutCard() {
    const container = document.getElementById('aboutCards');
    const idx = nextItemId();
    const div = document.createElement('div');
    div.className = 'array-item';
    div.dataset.index = idx;
    div.innerHTML = `
        <div class="array-item-header">
            <h4>New Card</h4>
            <div class="array-item-actions">
                <button type="button" class="toggle-btn" onclick="toggleItem(this)"><i class="fas fa-chevron-up"></i></button>
                <button type="button" class="delete-btn" onclick="this.closest('.array-item').remove()"><i class="fas fa-trash"></i></button>
            </div>
        </div>
        <div class="array-item-body">
            <div class="form-group">
                <label>Icon (Font Awesome class)</label>
                <input type="text" name="aboutIcon_${idx}" value="fas fa-cog" />
            </div>
            <div class="form-group">
                <label>Title</label>
                <input type="text" name="aboutTitle_${idx}" placeholder="Card Title" />
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea name="aboutDesc_${idx}" rows="3" placeholder="Card description..."></textarea>
            </div>
        </div>
    `;
    container.appendChild(div);
}

function addSkillCategory() {
    const container = document.getElementById('skillCategories');
    const idx = nextItemId();
    const div = document.createElement('div');
    div.className = 'array-item';
    div.dataset.index = idx;
    div.innerHTML = `
        <div class="array-item-header">
            <h4>New Category</h4>
            <div class="array-item-actions">
                <button type="button" class="toggle-btn" onclick="toggleItem(this)"><i class="fas fa-chevron-up"></i></button>
                <button type="button" class="delete-btn" onclick="this.closest('.array-item').remove()"><i class="fas fa-trash"></i></button>
            </div>
        </div>
        <div class="array-item-body">
            <div class="form-row">
                <div class="form-group">
                    <label>Category Name</label>
                    <input type="text" name="skillCatName_${idx}" placeholder="e.g. Languages" />
                </div>
                <div class="form-group">
                    <label>Icon</label>
                    <input type="text" name="skillCatIcon_${idx}" value="fas fa-code" />
                </div>
            </div>
            <div class="form-group">
                <label>Skills (comma separated)</label>
                <input type="text" name="skillCatItems_${idx}" placeholder="e.g. Python, JavaScript, Rust" />
            </div>
        </div>
    `;
    container.appendChild(div);
}

function addExperience() {
    const container = document.getElementById('expItems');
    const idx = nextItemId();
    const div = document.createElement('div');
    div.className = 'array-item';
    div.dataset.index = idx;
    div.innerHTML = `
        <div class="array-item-header">
            <h4>New Experience</h4>
            <div class="array-item-actions">
                <button type="button" class="toggle-btn" onclick="toggleItem(this)"><i class="fas fa-chevron-up"></i></button>
                <button type="button" class="delete-btn" onclick="this.closest('.array-item').remove()"><i class="fas fa-trash"></i></button>
            </div>
        </div>
        <div class="array-item-body">
            <div class="form-row">
                <div class="form-group">
                    <label>Date</label>
                    <input type="text" name="expDate_${idx}" placeholder="e.g. 2024 - Present" />
                </div>
                <div class="form-group">
                    <label>Role</label>
                    <input type="text" name="expRole_${idx}" placeholder="e.g. Senior AI Engineer" />
                </div>
            </div>
            <div class="form-group">
                <label>Company</label>
                <input type="text" name="expCompany_${idx}" placeholder="Company · Location" />
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea name="expDesc_${idx}" rows="3" placeholder="Describe your role..."></textarea>
            </div>
        </div>
    `;
    container.appendChild(div);
}

function addProject() {
    const container = document.getElementById('projItems');
    const idx = nextItemId();
    const div = document.createElement('div');
    div.className = 'array-item';
    div.dataset.index = idx;
    div.innerHTML = `
        <div class="array-item-header">
            <h4>New Project</h4>
            <div class="array-item-actions">
                <button type="button" class="toggle-btn" onclick="toggleItem(this)"><i class="fas fa-chevron-up"></i></button>
                <button type="button" class="delete-btn" onclick="this.closest('.array-item').remove()"><i class="fas fa-trash"></i></button>
            </div>
        </div>
        <div class="array-item-body">
            <div class="form-row">
                <div class="form-group">
                    <label>Title</label>
                    <input type="text" name="projTitle_${idx}" placeholder="Project Name" />
                </div>
                <div class="form-group">
                    <label>Icon</label>
                    <input type="text" name="projIcon_${idx}" value="fas fa-code" />
                </div>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea name="projDesc_${idx}" rows="3" placeholder="Project description..."></textarea>
            </div>
            <div class="form-group">
                <label>Preview Background</label>
                <input type="text" name="projBg_${idx}" value="linear-gradient(135deg, #667eea, #764ba2)" />
            </div>
            <div class="form-group">
                <label>Tags (comma separated)</label>
                <input type="text" name="projTags_${idx}" placeholder="e.g. LLM, RAG, FastAPI" />
            </div>
            <div class="form-group">
                <label>Links (icon|label|url per line)</label>
                <textarea name="projLinks_${idx}" rows="3" placeholder="fab fa-github|Source|https://github.com"></textarea>
            </div>
        </div>
    `;
    container.appendChild(div);
}

function addContactItem() {
    const container = document.getElementById('contactItems');
    const idx = nextItemId();
    const div = document.createElement('div');
    div.className = 'array-item';
    div.dataset.index = idx;
    div.innerHTML = `
        <div class="array-item-header">
            <h4>New Contact</h4>
            <div class="array-item-actions">
                <button type="button" class="toggle-btn" onclick="toggleItem(this)"><i class="fas fa-chevron-up"></i></button>
                <button type="button" class="delete-btn" onclick="this.closest('.array-item').remove()"><i class="fas fa-trash"></i></button>
            </div>
        </div>
        <div class="array-item-body">
            <div class="form-row">
                <div class="form-group">
                    <label>Icon</label>
                    <input type="text" name="contactIcon_${idx}" value="fas fa-envelope" />
                </div>
                <div class="form-group">
                    <label>Label</label>
                    <input type="text" name="contactLabel_${idx}" placeholder="e.g. Email" />
                </div>
            </div>
            <div class="form-group">
                <label>Value</label>
                <input type="text" name="contactValue_${idx}" placeholder="e.g. hello@example.com" />
            </div>
        </div>
    `;
    container.appendChild(div);
}

function addFooterLink() {
    const container = document.getElementById('footerLinks');
    const idx = nextItemId();
    const div = document.createElement('div');
    div.className = 'array-item';
    div.dataset.index = idx;
    div.innerHTML = `
        <div class="array-item-header">
            <h4>New Link</h4>
            <div class="array-item-actions">
                <button type="button" class="delete-btn" onclick="this.closest('.array-item').remove()"><i class="fas fa-trash"></i></button>
            </div>
        </div>
        <div class="array-item-body">
            <div class="form-row">
                <div class="form-group">
                    <label>Label</label>
                    <input type="text" name="footerLinkLabel_${idx}" placeholder="About" />
                </div>
                <div class="form-group">
                    <label>URL</label>
                    <input type="text" name="footerLinkUrl_${idx}" value="#about" />
                </div>
            </div>
        </div>
    `;
    container.appendChild(div);
}

function addFooterSocial() {
    const container = document.getElementById('footerSocial');
    const idx = nextItemId();
    const div = document.createElement('div');
    div.className = 'array-item';
    div.dataset.index = idx;
    div.innerHTML = `
        <div class="array-item-header">
            <h4>New Social Link</h4>
            <div class="array-item-actions">
                <button type="button" class="delete-btn" onclick="this.closest('.array-item').remove()"><i class="fas fa-trash"></i></button>
            </div>
        </div>
        <div class="array-item-body">
            <div class="form-row">
                <div class="form-group">
                    <label>Icon</label>
                    <input type="text" name="footerSocialIcon_${idx}" value="fab fa-github" />
                </div>
                <div class="form-group">
                    <label>URL</label>
                    <input type="text" name="footerSocialUrl_${idx}" placeholder="https://github.com/..." />
                </div>
            </div>
        </div>
    `;
    container.appendChild(div);
}

function deleteItem(section, index) {
    if (!confirm('Delete this item?')) return;
    apiDelete(`${section}/${index}`).then(async res => {
        if (res) {
            allData = await apiGet('');
            loadSection(section);
        }
    }).catch(err => {
        alert('Delete failed: ' + err.message);
    });
}

// Bind events after form render
function bindFormEvents(section) {
    // All interactive elements use inline onclick handlers
}
