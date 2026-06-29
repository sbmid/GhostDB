let currentCollection = '';
let currentData = [];

const DOM = {
    collections: document.getElementById('collection-list'),
    colName: document.getElementById('current-collection-name'),
    btnAdd: document.getElementById('btn-add'),
    tableContainer: document.getElementById('table-container'),
    tableHead: document.getElementById('table-head'),
    tableBody: document.getElementById('table-body'),
    emptyState: document.getElementById('empty-state'),
    
    // Tabs
    tabTable: document.getElementById('tab-table'),
    tabGraph: document.getElementById('tab-graph'),
    viewTable: document.getElementById('view-table'),
    viewGraph: document.getElementById('view-graph'),
    graphContainer: document.getElementById('graph-container'),
    btnCenterGraph: document.getElementById('btn-center-graph'),
    
    // Modal
    modal: document.getElementById('modal'),
    inputId: document.getElementById('input-id'),
    inputJson: document.getElementById('input-json'),
    btnSave: document.getElementById('btn-save'),
    btnCancel: document.getElementById('btn-cancel'),
    btnCloseModal: document.getElementById('btn-close-modal')
};

let currentTab = 'table';
let myGraph = null;

// --- Tab Switching ---
function switchTab(tab) {
    currentTab = tab;
    
    // Update buttons
    DOM.tabTable.className = tab === 'table' 
        ? "px-3 py-1 text-sm rounded-sm bg-dark-700 text-white font-medium transition-colors" 
        : "px-3 py-1 text-sm rounded-sm text-gray-400 hover:text-white transition-colors";
    
    DOM.tabGraph.className = tab === 'graph' 
        ? "px-3 py-1 text-sm rounded-sm bg-dark-700 text-white font-medium transition-colors" 
        : "px-3 py-1 text-sm rounded-sm text-gray-400 hover:text-white transition-colors";
        
    // Update views
    if (tab === 'table') {
        DOM.viewTable.classList.remove('hidden');
        DOM.viewGraph.classList.add('hidden');
        if (currentCollection) DOM.btnAdd.classList.remove('hidden');
    } else {
        DOM.viewTable.classList.add('hidden');
        DOM.viewGraph.classList.remove('hidden');
        DOM.btnAdd.classList.add('hidden');
        loadGraph();
    }
}

// --- Initialization ---
async function init() {
    switchTab('table');
    await fetchCollections();
}

async function fetchCollections() {
    try {
        const res = await fetch('/api/collections');
        const cols = await res.json();
        renderCollections(cols);
    } catch (e) {
        console.error(e);
    }
}

function renderCollections(cols) {
    DOM.collections.innerHTML = cols.map(c => `
        <li>
            <button onclick="selectCollection('${c}')" class="w-full text-left px-3 py-2 rounded-md text-sm text-gray-400 hover:text-white hover:bg-dark-700 transition-colors ${currentCollection === c ? 'bg-dark-700 text-white' : ''}">
                ${c}
            </button>
        </li>
    `).join('');
    
    // Add "New Collection" button
    DOM.collections.innerHTML += `
        <li class="mt-4">
            <button onclick="promptNewCollection()" class="w-full text-left px-3 py-2 rounded-md text-sm text-gray-500 hover:text-white border border-dashed border-dark-700 hover:border-gray-500 transition-colors flex items-center">
                <span class="material-symbols-outlined text-[16px] mr-1">add</span> New Collection
            </button>
        </li>
    `;
}

function promptNewCollection() {
    const name = prompt('Nama collection baru:');
    if (name) selectCollection(name);
}

// --- Data Fetching & Rendering ---
async function selectCollection(name) {
    currentCollection = name;
    DOM.colName.textContent = name;
    DOM.btnAdd.classList.remove('hidden');
    await loadData();
    fetchCollections(); // re-render sidebar incase new collection
}

async function loadData() {
    if (!currentCollection) return;
    try {
        const res = await fetch(`/api/${currentCollection}`);
        currentData = await res.json();
        renderTable();
    } catch (e) {
        console.error(e);
    }
}

function renderTable() {
    if (currentData.length === 0) {
        DOM.tableContainer.classList.add('hidden');
        DOM.emptyState.classList.remove('hidden');
        return;
    }
    
    DOM.emptyState.classList.add('hidden');
    DOM.tableContainer.classList.remove('hidden');
    
    // Get all unique keys for columns
    const allKeys = new Set(['id']); // ID always first
    currentData.forEach(item => {
        Object.keys(item).forEach(k => {
            if (k !== 'id' && k !== '_updatedAt') allKeys.add(k);
        });
    });
    allKeys.add('_updatedAt');
    const cols = Array.from(allKeys);
    
    // Render Head
    DOM.tableHead.innerHTML = cols.map(c => `<th class="px-4 py-3 font-medium">${c}</th>`).join('') + `<th class="px-4 py-3 text-right">Actions</th>`;
    
    // Render Body
    DOM.tableBody.innerHTML = currentData.map(item => {
        const td = cols.map(c => {
            let val = item[c];
            if (c === '_updatedAt') val = new Date(val).toLocaleString();
            if (typeof val === 'object') val = JSON.stringify(val);
            return `<td class="px-4 py-3 text-gray-300 truncate max-w-[200px]">${val || '-'}</td>`;
        }).join('');
        
        return `
            <tr>
                ${td}
                <td class="px-4 py-3 text-right">
                    <button onclick="editData('${item.id}')" class="text-blue-400 hover:text-blue-300 mr-2"><span class="material-symbols-outlined text-[18px]">edit</span></button>
                    <button onclick="deleteData('${item.id}')" class="text-red-400 hover:text-red-300"><span class="material-symbols-outlined text-[18px]">delete</span></button>
                </td>
            </tr>
        `;
    }).join('');
}

// --- Actions (Modal & API) ---
function openModal(id = '', json = '') {
    DOM.inputId.value = id;
    DOM.inputId.disabled = !!id; // if editing, disable ID change
    DOM.inputJson.value = json;
    DOM.modal.classList.add('modal-active');
}

function closeModal() {
    DOM.modal.classList.remove('modal-active');
}

DOM.btnAdd.addEventListener('click', () => {
    openModal('', '{\n  \n}');
});

DOM.btnCancel.addEventListener('click', closeModal);
DOM.btnCloseModal.addEventListener('click', closeModal);

DOM.btnSave.addEventListener('click', async () => {
    let id = DOM.inputId.value.trim();
    if (!id) id = 'id_' + Date.now(); // Auto ID
    
    let payload;
    try {
        payload = JSON.parse(DOM.inputJson.value);
    } catch (e) {
        alert('Invalid JSON bang! Benerin dulu dong.');
        return;
    }
    
    try {
        await fetch(`/api/${currentCollection}/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        closeModal();
        loadData();
    } catch (e) {
        console.error(e);
        alert('Gagal simpan!');
    }
});

async function editData(id) {
    const item = currentData.find(d => d.id === id);
    if (!item) return;
    
    // clone and remove internal fields
    const copy = { ...item };
    delete copy.id;
    delete copy._updatedAt;
    
    openModal(id, JSON.stringify(copy, null, 2));
}

async function deleteData(id) {
    if (!confirm(`Yakin mau hapus ID: ${id}?`)) return;
    
    try {
        await fetch(`/api/${currentCollection}/${id}`, { method: 'DELETE' });
        loadData();
    } catch (e) {
        console.error(e);
        alert('Gagal hapus!');
    }
}

// --- Graph Visualization ---
async function loadGraph() {
    try {
        const res = await fetch('/api/graph-data');
        const gData = await res.json();
        
        // Buat palet warna acak buat tiap kategori (group)
        const colors = {};
        
        if (!myGraph) {
            myGraph = ForceGraph()(DOM.graphContainer)
                .backgroundColor('#0a0a0a')
                .nodeId('id')
                .nodeVal('val')
                .nodeLabel(node => {
                    if (node.group === 'ROOT') return `<div class="bg-dark-800 text-white p-2 rounded-md border border-purple-500 text-lg font-bold shadow-[0_0_15px_rgba(168,85,247,0.5)]">🌌 SEMESTA: ${node.name}</div>`;
                    if (node.group === 0) return `<div class="bg-dark-800 text-white p-2 rounded-md border border-dark-700 text-sm font-semibold">📁 Collection: ${node.name}</div>`;
                    return `<div class="bg-dark-800 text-gray-300 p-2 rounded-md border border-dark-700 text-xs font-mono"><span class="text-white font-semibold">📄 ID: ${node.name}</span><br/>Size: ${node.val * 50} chars</div>`;
                })
                .nodeColor(node => {
                    if (node.group === 'ROOT') return '#a855f7'; // Purple glow untuk semesta
                    if (node.group === 0) return '#ffffff'; // Folder root warna putih
                    if (!colors[node.group]) {
                        // Generate warna pastel acak buat tiap collection
                        colors[node.group] = `hsl(${Math.random() * 360}, 70%, 60%)`;
                    }
                    return colors[node.group];
                })
                .linkColor(() => 'rgba(255,255,255,0.1)')
                .linkWidth(1)
                .onNodeClick(node => {
                    if (node.group !== 0 && node.group !== 'ROOT') {
                        // Kalo klik node file, tampilin edit modal
                        currentCollection = node.group;
                        DOM.colName.textContent = currentCollection;
                        editData(node.name);
                    }
                });
                
            // --- Custom Physics Engine ---
            // Bikin tolak menolak antar node lebih kuat biar file nggak numpuk jadi satu bola (rapet)
            myGraph.d3Force('charge').strength(-200);
            
            // Atur jarak benang (link)
            myGraph.d3Force('link').distance(link => {
                // Jarak Semesta (ROOT) ke Folder (Collection) dibikin deket biar gak mencar
                if (link.source.id === 'ROOT_DB' || link.target.id === 'ROOT_DB') {
                    return 80; 
                }
                // Jarak Folder ke File dibikin sedeng biar ngembang
                return 40;
            });
        }
        
        myGraph.graphData(gData);
    } catch (e) {
        console.error('Gagal load graph', e);
    }
}

DOM.btnCenterGraph.addEventListener('click', () => {
    if (myGraph) {
        myGraph.zoomToFit(800, 50); // Durasi 800ms, padding 50px
    }
});

// Start
init();
