const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.json());

function readData() {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
}

function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Basic Auth middleware for admin routes
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

function auth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const base64 = authHeader.split(' ')[1];
    const decoded = Buffer.from(base64, 'base64').toString('utf-8');
    const [user, pass] = decoded.split(':');
    if (user !== ADMIN_USER || pass !== ADMIN_PASS) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    next();
}

// Public API: Get section data
app.get('/api/:section', (req, res) => {
    const data = readData();
    const section = req.params.section;
    if (data[section]) {
        res.json(data[section]);
    } else {
        res.status(404).json({ error: 'Section not found' });
    }
});

// Public API: Get all data
app.get('/api', (req, res) => {
    const data = readData();
    res.json(data);
});

// Admin API: Update a section
app.put('/api/:section', auth, (req, res) => {
    const data = readData();
    const section = req.params.section;
    if (!data[section]) {
        return res.status(404).json({ error: 'Section not found' });
    }
    data[section] = req.body;
    writeData(data);
    res.json({ message: `${section} updated successfully`, data: data[section] });
});

// Admin API: Update specific item in an array section
app.put('/api/:section/:index', auth, (req, res) => {
    const data = readData();
    const section = req.params.section;
    const index = parseInt(req.params.index);
    if (!data[section]) {
        return res.status(404).json({ error: 'Section not found' });
    }
    if (!Array.isArray(data[section].items || data[section].cards || data[section].categories || data[section].stats || data[section].social || data[section].links)) {
        return res.status(400).json({ error: 'Section does not contain array data' });
    }
    const arr = data[section].items || data[section].cards || data[section].categories || data[section].stats || data[section].social || data[section].links;
    if (index < 0 || index >= arr.length) {
        return res.status(404).json({ error: 'Item not found' });
    }
    arr[index] = req.body;
    writeData(data);
    res.json({ message: 'Item updated successfully', data: data[section] });
});

// Admin API: Delete an item from array section
app.delete('/api/:section/:index', auth, (req, res) => {
    const data = readData();
    const section = req.params.section;
    const index = parseInt(req.params.index);
    const arrKey = ['items', 'cards', 'categories', 'stats', 'social', 'links'].find(k => Array.isArray(data[section]?.[k]));
    if (!arrKey) {
        return res.status(400).json({ error: 'No array found in section' });
    }
    if (index < 0 || index >= data[section][arrKey].length) {
        return res.status(404).json({ error: 'Item not found' });
    }
    data[section][arrKey].splice(index, 1);
    writeData(data);
    res.json({ message: 'Item deleted', data: data[section] });
});

// Admin API: Add an item to array section
app.post('/api/:section', auth, (req, res) => {
    const data = readData();
    const section = req.params.section;
    const arrKey = ['items', 'cards', 'categories', 'stats', 'social', 'links'].find(k => Array.isArray(data[section]?.[k]));
    if (!arrKey) {
        return res.status(400).json({ error: 'No array found in section' });
    }
    if (!data[section][arrKey]) {
        data[section][arrKey] = [];
    }
    data[section][arrKey].push(req.body);
    writeData(data);
    res.json({ message: 'Item added', data: data[section] });
});

// Serve static files
app.use(express.static(__dirname));

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Admin dashboard at http://localhost:${PORT}/admin/`);
    console.log(`Login: ${ADMIN_USER} / ${ADMIN_PASS}`);
});
