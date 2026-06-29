const express = require('express');
const path = require('path');
const GhostDB = require('./index');

const app = express();
const db = new GhostDB('./mydb');
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.get('/api/collections', (req, res) => {
    // Hack receh buat dapet list collection: baca isi folder mydb
    const fs = require('fs');
    try {
        const files = fs.readdirSync('./mydb');
        const collections = files.map(f => f.replace('.json', ''));
        res.json(collections);
    } catch (e) {
        res.json([]);
    }
});

app.get('/api/graph-data', (req, res) => {
    const fs = require('fs');
    try {
        const files = fs.readdirSync('./mydb');
        const nodes = [];
        const links = [];
        
        // Node pusat semesta (GhostDB)
        nodes.push({ id: 'ROOT_DB', name: 'GhostDB', group: 'ROOT', val: 30 });
        
        files.forEach(file => {
            const col = file.replace('.json', '');
            nodes.push({ id: col, name: col, group: 0, val: 15 }); // Collection node
            links.push({ source: col, target: 'ROOT_DB' }); // Ikat collection ke pusat
            
            const data = db.all(col);
            data.forEach(item => {
                const itemId = `${col}_${item.id}`;
                const jsonStr = JSON.stringify(item);
                const size = Math.max(2, Math.min(10, jsonStr.length / 50)); 
                
                nodes.push({ id: itemId, name: item.id, group: col, val: size, data: item });
                links.push({ source: itemId, target: col }); // Ikat file ke collection
            });
        });
        
        res.json({ nodes, links });
    } catch (e) {
        res.json({ nodes: [], links: [] });
    }
});

app.get('/api/:collection', (req, res) => {
    res.json(db.all(req.params.collection));
});

app.post('/api/:collection/:id', (req, res) => {
    const data = db.set(req.params.collection, req.params.id, req.body);
    res.json({ success: true, data });
});

app.delete('/api/:collection/:id', (req, res) => {
    const success = db.delete(req.params.collection, req.params.id);
    res.json({ success });
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 GhostDB UI nyala di http://localhost:${PORT}`);
});
