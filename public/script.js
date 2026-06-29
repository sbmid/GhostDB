const DOM = {
    // Auth & Overlay
    loginOverlay: document.getElementById('login-overlay'),
    loginPassword: document.getElementById('login-password'),
    btnLogin: document.getElementById('btn-login'),
    loginError: document.getElementById('login-error'),
    btnLogout: document.getElementById('btn-logout'),

    // Sidebar
    sidebar: document.getElementById('sidebar'),
    btnMenu: document.getElementById('btn-menu'),
    btnCloseSidebar: document.getElementById('btn-close-sidebar'),
    colList: document.getElementById('collection-list'),
    btnAddCol: document.getElementById('btn-add-collection'),
    searchCol: document.getElementById('search-collection'),

    // Main Content
    colName: document.getElementById('current-col-name'),
    btnAdd: document.getElementById('btn-add'),
    tableHead: document.getElementById('table-head'),
    tableBody: document.getElementById('table-body'),
    emptyState: document.getElementById('empty-state'),
    
    // Search Data
    dataToolbar: document.getElementById('data-toolbar'),
    searchData: document.getElementById('search-data'),
    
    // Tabs
    tabTable: document.getElementById('tab-table'),
    tabGraph: document.getElementById('tab-graph'),
    viewTable: document.getElementById('view-table'),
    viewGraph: document.getElementById('view-graph'),
    graphContainer: document.getElementById('graph-container'),
    btnCenterGraph: document.getElementById('btn-center-graph'),
    
    // Modals
    modal: document.getElementById('modal'),
    inputId: document.getElementById('input-id'),
    inputJson: document.getElementById('input-json'),
    btnSave: document.getElementById('btn-save'),
    btnCancel: document.getElementById('btn-cancel'),
    btnCloseModal: document.getElementById('btn-close-modal'),

    // Settings
    btnSettings: document.getElementById('btn-settings'),
    modalSettings: document.getElementById('modal-settings'),
    btnCloseSettings: document.getElementById('btn-close-settings'),
    inputOldPass: document.getElementById('input-old-pass'),
    inputNewPass: document.getElementById('input-new-pass'),
    btnSavePass: document.getElementById('btn-save-password'),
    settingsMsg: document.getElementById('settings-msg'),

    // Theme
    btnTheme: document.getElementById('btn-toggle-theme'),
    themeIcon: document.getElementById('theme-icon')
};

let currentCollection = null;
let currentTab = 'table';
let myGraph = null;
let currentDataList = [];

// --- THEME MANAGEMENT ---
function initTheme() {
    const savedTheme = localStorage.getItem('ghost_theme') || 'dark';
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
        DOM.themeIcon.textContent = 'light_mode';
    } else {
        document.documentElement.classList.remove('dark');
        DOM.themeIcon.textContent = 'dark_mode';
    }
}
DOM.btnTheme.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('ghost_theme', isDark ? 'dark' : 'light');
    DOM.themeIcon.textContent = isDark ? 'light_mode' : 'dark_mode';
});

// --- AUTH & FETCH WRAPPER ---
function getToken() {
    return localStorage.getItem('ghost_token');
}

async function apiFetch(url, options = {}) {
    const token = getToken();
    if (!options.headers) options.headers = {};
    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    
    const res = await fetch(url, options);
    if (res.status === 401) {
        // Token expired/invalid
        localStorage.removeItem('ghost_token');
        showLogin();
        throw new Error('Unauthorized');
    }
    return res;
}

// --- LOGIN FLOW ---
function showLogin() {
    DOM.loginOverlay.classList.remove('hidden');
    DOM.loginPassword.value = '';
    DOM.loginError.classList.add('hidden');
}

function hideLogin() {
    DOM.loginOverlay.classList.add('hidden');
}

DOM.btnLogin.addEventListener('click', async () => {
    const pwd = DOM.loginPassword.value;
    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: pwd })
        });
        const data = await res.json();
        if (data.success) {
            localStorage.setItem('ghost_token', data.token);
            hideLogin();
            initApp();
        } else {
            DOM.loginError.textContent = data.error || 'Login gagal';
            DOM.loginError.classList.remove('hidden');
        }
    } catch (e) {
        DOM.loginError.textContent = 'Network error';
        DOM.loginError.classList.remove('hidden');
    }
});

DOM.btnLogout.addEventListener('click', () => {
    localStorage.removeItem('ghost_token');
    showLogin();
});

// --- SETTINGS (CHANGE PASSWORD) ---
DOM.btnSettings.addEventListener('click', () => {
    DOM.modalSettings.classList.remove('hidden');
    setTimeout(() => DOM.modalSettings.querySelector('div').classList.remove('scale-95'), 10);
    DOM.inputOldPass.value = '';
    DOM.inputNewPass.value = '';
    DOM.settingsMsg.classList.add('hidden');
});

function closeSettings() {
    DOM.modalSettings.querySelector('div').classList.add('scale-95');
    setTimeout(() => DOM.modalSettings.classList.add('hidden'), 200);
}
DOM.btnCloseSettings.addEventListener('click', closeSettings);

DOM.btnSavePass.addEventListener('click', async () => {
    const oldP = DOM.inputOldPass.value;
    const newP = DOM.inputNewPass.value;
    try {
        const res = await apiFetch('/api/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ oldPassword: oldP, newPassword: newP })
        });
        const data = await res.json();
        DOM.settingsMsg.classList.remove('hidden');
        if (data.success) {
            DOM.settingsMsg.textContent = 'Password berhasil diganti!';
            DOM.settingsMsg.className = 'text-sm text-green-500 mt-2';
            localStorage.setItem('ghost_token', data.token);
            setTimeout(closeSettings, 1500);
        } else {
            DOM.settingsMsg.textContent = data.error;
            DOM.settingsMsg.className = 'text-sm text-red-500 mt-2';
        }
    } catch (e) {
        console.error(e);
    }
});


// --- MOBILE SIDEBAR ---
DOM.btnMenu.addEventListener('click', () => {
    DOM.sidebar.classList.remove('-translate-x-full');
});
DOM.btnCloseSidebar.addEventListener('click', () => {
    DOM.sidebar.classList.add('-translate-x-full');
});

// --- TAB SWITCHING ---
function switchTab(tab) {
    currentTab = tab;
    if (tab === 'table') {
        DOM.tabTable.className = "px-3 py-1 text-sm rounded-md bg-text-primary text-bg-primary font-medium transition-colors";
        DOM.tabGraph.className = "px-3 py-1 text-sm rounded-md text-text-secondary hover:text-text-primary transition-colors";
        DOM.viewTable.classList.remove('hidden');
        DOM.viewGraph.classList.add('hidden');
        if (currentCollection) DOM.btnAdd.classList.remove('hidden');
    } else {
        DOM.tabGraph.className = "px-3 py-1 text-sm rounded-md bg-text-primary text-bg-primary font-medium transition-colors";
        DOM.tabTable.className = "px-3 py-1 text-sm rounded-md text-text-secondary hover:text-text-primary transition-colors";
        DOM.viewTable.classList.add('hidden');
        DOM.viewGraph.classList.remove('hidden');
        DOM.btnAdd.classList.add('hidden');
        loadGraph();
    }
}

// --- DATA FETCHING ---
async function fetchCollections() {
    try {
        const res = await apiFetch('/api/collections');
        const cols = await res.json();
        renderCollections(cols);
    } catch (e) {
        console.error(e);
    }
}

function renderCollections(cols) {
    DOM.colList.innerHTML = '';
    const filterText = DOM.searchCol.value.toLowerCase();
    
    cols.forEach(col => {
        if (filterText && !col.toLowerCase().includes(filterText)) return;

        const btn = document.createElement('button');
        btn.className = `w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors flex items-center gap-2 ${col === currentCollection ? 'bg-bg-tertiary text-text-primary font-medium border border-border-color' : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'}`;
        btn.innerHTML = `<span class="material-symbols-outlined text-[18px]">folder</span> ${col}`;
        btn.onclick = () => {
            currentCollection = col;
            DOM.colName.textContent = col;
            DOM.btnAdd.classList.remove('hidden');
            DOM.dataToolbar.classList.remove('hidden');
            // Hide sidebar on mobile after click
            if(window.innerWidth < 768) DOM.sidebar.classList.add('-translate-x-full');
            loadData();
            fetchCollections(); // re-render buat update state active
        };
        DOM.colList.appendChild(btn);
    });
}
DOM.searchCol.addEventListener('input', fetchCollections);

DOM.btnAddCol.addEventListener('click', () => {
    const name = prompt('Nama Collection Baru:');
    if (name) {
        currentCollection = name;
        DOM.colName.textContent = name;
        DOM.btnAdd.classList.remove('hidden');
        DOM.dataToolbar.classList.remove('hidden');
        loadData();
    }
});

async function loadData() {
    if (!currentCollection) return;
    try {
        const res = await apiFetch(`/api/${currentCollection}`);
        currentDataList = await res.json();
        renderDataList();
    } catch (e) {
        console.error(e);
    }
}

function renderDataList() {
    DOM.tableBody.innerHTML = '';
    
    let filteredList = currentDataList;
    const filterText = DOM.searchData.value.toLowerCase();
    
    if (filterText) {
        filteredList = currentDataList.filter(item => 
            item.id.toLowerCase().includes(filterText) || 
            JSON.stringify(item).toLowerCase().includes(filterText)
        );
    }

    if (filteredList.length === 0) {
        DOM.tableHead.parentElement.classList.add('hidden');
        DOM.emptyState.classList.remove('hidden');
        return;
    }
    
    DOM.tableHead.parentElement.classList.remove('hidden');
    DOM.emptyState.classList.add('hidden');
    
    // Reverse supaya data terbaru di atas (asumsi ID time-based, atau minimal insert order dibalik)
    filteredList.slice().reverse().forEach(item => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-bg-tertiary transition-colors group";
        
        let jsonPreview = JSON.stringify(item);
        if (jsonPreview.length > 80) jsonPreview = jsonPreview.substring(0, 80) + '...';

        tr.innerHTML = `
            <td class="px-6 py-4 font-mono text-xs font-semibold whitespace-nowrap text-text-primary">${item.id}</td>
            <td class="px-6 py-4 font-mono text-xs text-text-secondary truncate max-w-[200px] sm:max-w-md">${jsonPreview}</td>
            <td class="px-6 py-4 text-right">
                <button class="text-text-secondary hover:text-text-primary mr-3 opacity-0 group-hover:opacity-100 transition-opacity" onclick="editData('${item.id}')" title="Edit">
                    <span class="material-symbols-outlined text-[18px]">edit</span>
                </button>
                <button class="text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" onclick="deleteData('${item.id}')" title="Delete">
                    <span class="material-symbols-outlined text-[18px]">delete</span>
                </button>
            </td>
        `;
        DOM.tableBody.appendChild(tr);
    });
}
DOM.searchData.addEventListener('input', renderDataList);

// --- MODAL & CRUD ---
function openModal(id = '', jsonData = '') {
    DOM.modal.classList.remove('hidden');
    setTimeout(() => {
        DOM.modal.classList.remove('opacity-0');
        DOM.modal.querySelector('div').classList.remove('scale-95');
    }, 10);
    DOM.inputId.value = id;
    DOM.inputJson.value = jsonData;
    DOM.inputId.disabled = !!id; // Lock ID kalo edit
}

function closeModal() {
    DOM.modal.classList.add('opacity-0');
    DOM.modal.querySelector('div').classList.add('scale-95');
    setTimeout(() => DOM.modal.classList.add('hidden'), 200);
}

DOM.btnAdd.addEventListener('click', () => {
    openModal('', '{\n  \n}');
});
DOM.btnCancel.addEventListener('click', closeModal);
DOM.btnCloseModal.addEventListener('click', closeModal);

DOM.btnSave.addEventListener('click', async () => {
    const id = DOM.inputId.value.trim();
    let data;
    try {
        data = JSON.parse(DOM.inputJson.value);
    } catch(e) {
        alert('Invalid JSON!');
        return;
    }
    
    if (!id) return alert('ID required!');
    data.id = id;
    
    try {
        await apiFetch(`/api/${currentCollection}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        closeModal();
        loadData();
    } catch (e) {
        console.error(e);
        alert('Gagal nyimpen!');
    }
});

window.editData = (id) => {
    const item = currentDataList.find(i => i.id === id);
    if (!item) return;
    openModal(id, JSON.stringify(item, null, 2));
}

window.deleteData = async (id) => {
    if (!confirm(`Yakin hapus ID: ${id}?`)) return;
    try {
        await apiFetch(`/api/${currentCollection}/${id}`, { method: 'DELETE' });
        loadData();
    } catch (e) {
        console.error(e);
    }
}

// --- GRAPH VISUALIZATION ---
async function loadGraph() {
    try {
        const res = await apiFetch('/api/graph-data');
        const gData = await res.json();
        
        const colors = {};
        
        if (!myGraph) {
            myGraph = ForceGraph()(DOM.graphContainer)
                .backgroundColor('transparent')
                .nodeId('id')
                .nodeVal('val')
                .nodeLabel(node => {
                    if (node.group === 'ROOT') return `<div class="bg-bg-secondary text-text-primary p-2 rounded-md border border-purple-500 text-lg font-bold shadow-[0_0_15px_rgba(168,85,247,0.5)]">🌌 SEMESTA: ${node.name}</div>`;
                    if (node.group === 0) return `<div class="bg-bg-tertiary text-text-primary p-2 rounded-md border border-border-color text-sm font-semibold">📁 Collection: ${node.name}</div>`;
                    return `<div class="bg-bg-tertiary text-text-secondary p-2 rounded-md border border-border-color text-xs font-mono"><span class="text-text-primary font-semibold">📄 ID: ${node.name}</span><br/>Size: ${node.val * 50} chars</div>`;
                })
                .nodeColor(node => {
                    if (node.group === 'ROOT') return '#a855f7'; 
                    if (node.group === 0) return '#94a3b8'; // Base folder color
                    if (!colors[node.group]) {
                        colors[node.group] = `hsl(${Math.random() * 360}, 70%, 60%)`;
                    }
                    return colors[node.group];
                })
                .linkColor(() => {
                    const isDark = document.documentElement.classList.contains('dark');
                    return isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
                })
                .linkWidth(1)
                .onNodeClick(node => {
                    if (node.group !== 0 && node.group !== 'ROOT') {
                        currentCollection = node.group;
                        DOM.colName.textContent = currentCollection;
                        DOM.dataToolbar.classList.remove('hidden');
                        switchTab('table');
                        loadData();
                        setTimeout(() => editData(node.name), 300); // Open edit modal
                    }
                });
                
            myGraph.d3Force('charge').strength(-200);
            myGraph.d3Force('link').distance(link => {
                if (link.source.id === 'ROOT_DB' || link.target.id === 'ROOT_DB') return 80; 
                return 40;
            });
        }
        
        myGraph.graphData(gData);
    } catch (e) {
        console.error('Gagal load graph', e);
    }
}

DOM.btnCenterGraph.addEventListener('click', () => {
    if (myGraph) myGraph.zoomToFit(800, 50);
});

// --- BOOTSTRAP ---
function initApp() {
    initTheme();
    if (getToken()) {
        hideLogin();
        fetchCollections();
    } else {
        showLogin();
    }
}

initApp();
