// === UI & Navigation Management ===
const sidebar = document.querySelector('.sidebar');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const navItems = document.querySelectorAll('.nav-item');
const viewSections = document.querySelectorAll('.view-section');
const toolCards = document.querySelectorAll('.tool-card');
const btnBack = document.getElementById('btn-back');

// Mobile Menu Toggle
mobileMenuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
});

// View Navigation Logic
function switchView(targetId) {
    // Update Nav Activity if it's a sidebar link
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.target === targetId) {
            item.classList.add('active');
        }
    });

    // Handle tool workspace
    if (['merge', 'split', 'ocr', 'compress'].includes(targetId)) {
        setupToolWorkspace(targetId);
        targetId = 'tool-workspace';
    }

    // Hide all sections, show target
    viewSections.forEach(sec => sec.classList.remove('active'));
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Close mobile menu if open
    if (window.innerWidth <= 992) {
        sidebar.classList.remove('open');
    }
}

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        switchView(item.dataset.target);
    });
});

toolCards.forEach(card => {
    card.addEventListener('click', () => {
        switchView(card.dataset.target);
    });
});

btnBack.addEventListener('click', () => {
    switchView('home');
});

// === Tool State & Setup ===
let currentTool = '';
let selectedFiles = [];
let processedBlob = null; // To store result

const workspaceTitle = document.getElementById('workspace-title');
const workspaceDesc = document.getElementById('workspace-desc');
const toolOptions = document.getElementById('tool-options');
const fileInput = document.getElementById('file-input');
const uploadBox = document.getElementById('upload-box');
const workspacePanel = document.getElementById('workspace-panel');
const fileList = document.getElementById('file-list');
const btnClear = document.getElementById('btn-clear');
const btnProcess = document.getElementById('btn-process');
const fileNote = document.getElementById('file-note');

const toolsMeta = {
    'merge': {
        title: 'Merge PDF',
        desc: 'Gabungkan file PDF dalam urutan yang Anda inginkan. Seret file di daftar untuk mengurutkan.',
        accept: '.pdf',
        note: 'Hanya format PDF. Anda bisa mengunggah banyak file.'
    },
    'split': {
        title: 'Split PDF',
        desc: 'Ekstrak halaman tertentu atau pisahkan menjadi beberapa dokumen.',
        accept: '.pdf',
        note: 'Hanya format PDF.'
    },
    'ocr': {
        title: 'OCR PDF / Gambar',
        desc: 'Mengenali teks dalam dokumen PDF atau Gambar (JPG/PNG).',
        accept: '.pdf, .jpg, .jpeg, .png',
        note: 'Mendukung PDF, JPG, PNG.'
    },
    'compress': {
        title: 'Compress PDF',
        desc: 'Kurangi ukuran file PDF dengan mengoptimalkan kualitas gambar dan kompresi konten.',
        accept: '.pdf',
        note: 'Maksimum 50MB per file.'
    }
};

function setupToolWorkspace(toolId) {
    currentTool = toolId;
    const meta = toolsMeta[toolId];
    workspaceTitle.innerText = meta.title;
    workspaceDesc.innerText = meta.desc;
    fileInput.accept = meta.accept;
    fileNote.innerText = meta.note;

    // reset state
    clearFiles();

    // Inject specific tool options HTML
    toolOptions.innerHTML = '';
    const btnTextProcess = document.getElementById('btn-text-process');
    if (btnTextProcess) btnTextProcess.innerText = meta.title + " Sekarang";

    if (toolId === 'split') {
        renderSplitOptionsUI();
    } else if (toolId === 'compress') {
        toolOptions.innerHTML = `
            <div style="margin-bottom: 25px;">
                <p style="font-size: 13px; font-weight: 700; color: var(--text-main); margin-bottom: 20px; text-transform: uppercase; letter-spacing: 0.5px;">Tingkat Kompresi</p>
                
                <div class="comp-level-list">
                    <div class="comp-level-item" data-quality="15">
                        <div class="comp-level-info">
                            <span class="comp-level-title" style="color: #6366F1;">EXTREME COMPRESSION</span>
                            <span class="comp-level-desc">Ukuran terkecil, kualitas standar</span>
                        </div>
                        <div class="comp-level-check"><i class="fa-solid fa-check"></i></div>
                    </div>
                    
                    <div class="comp-level-item active" data-quality="40">
                        <div class="comp-level-info">
                            <span class="comp-level-title" style="color: #4F46E5;">RECOMMENDED COMPRESSION</span>
                            <span class="comp-level-desc">Keseimbangan kualitas & ukuran</span>
                        </div>
                        <div class="comp-level-check"><i class="fa-solid fa-check"></i></div>
                    </div>
                    
                    <div class="comp-level-item" data-quality="75">
                        <div class="comp-level-info">
                            <span class="comp-level-title" style="color: #4338CA;">LESS COMPRESSION</span>
                            <span class="comp-level-desc">Kualitas tinggi, kompresi ringan</span>
                        </div>
                        <div class="comp-level-check"><i class="fa-solid fa-check"></i></div>
                    </div>
                </div>

                <input type="hidden" id="compress-quality" value="40">
            </div>
        `;

        const levelItems = document.querySelectorAll('.comp-level-item');
        const hiddenInput = document.getElementById('compress-quality');
        
        levelItems.forEach(item => {
            item.addEventListener('click', () => {
                levelItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                hiddenInput.value = item.getAttribute('data-quality');
            });
        });
    } else if (toolId === 'merge') {
        toolOptions.innerHTML = `
            <div style="background: var(--primary-light); border: 1px solid var(--border-color); padding: 16px; border-radius: 12px; font-size: 13px; color: var(--primary-color); display: flex; gap: 12px; align-items: center;">
                <i class="fa-solid fa-circle-info" style="font-size: 18px;"></i>
                <div>
                   Atur urutan penggabungan file dengan cara menarik dan melepaskan (Drag & drop).
                </div>
            </div>
        `;
    }
}

function updateCompressStats() {
    // Hidden since estimation is removed as requested
    return;
}

function updateAcceptFilter(subType) {
    const filters = {
        'jpg-pdf': '.jpg,.jpeg,.png',
        'word-pdf': '.docx',
        'ppt-pdf': '.pptx',
        'excel-pdf': '.xlsx',
        'html-pdf': '.html',
        'pdf-jpg': '.pdf',
        'pdf-word': '.pdf',
        'pdf-ppt': '.pdf',
        'pdf-excel': '.pdf',
        'pdf-pdfa': '.pdf'
    };
    if (filters[subType]) {
        fileInput.accept = filters[subType];
    }
}

// === Drag and Drop & File Handling ===
uploadBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadBox.classList.add('dragover');
});
uploadBox.addEventListener('dragleave', () => {
    uploadBox.classList.remove('dragover');
});
uploadBox.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadBox.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
    }
});
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFiles(e.target.files);
    }
});

function handleFiles(files) {
    for (let f of files) {
        selectedFiles.push(f);
    }
    if (currentTool === 'split' && selectedFiles.length > 0) {
        initSplitPDF(selectedFiles[0]);
    } else {
        renderFileList();
    }
    
    if (currentTool === 'compress') updateCompressStats();
}

let draggedItemIndex = null;
let pdfTotalPagesForSplit = 1;
let splitRanges = [{ from: 1, to: 1 }];
let currentPdfFileForSplit = null;
let splitMode = 'custom';
let fixedSplitPageCount = 5;
let splitMainTab = 'range'; // range, pages, size
let extractMode = 'all'; // all, select
let selectedSplitPages = [];
let maxSizePerFile = 100;
let sizeUnit = 'KB';

async function initSplitPDF(file) {
    currentPdfFileForSplit = file;
    if (file.type === 'application/pdf' && window.pdfjsLib) {
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
        const fileUrl = URL.createObjectURL(file);
        const loadingTask = pdfjsLib.getDocument(fileUrl);
        const pdf = await loadingTask.promise;
        pdfTotalPagesForSplit = pdf.numPages;

        if (splitMode === 'fixed') {
            calculateFixedRanges();
        } else {
            splitRanges = [{ from: 1, to: pdfTotalPagesForSplit }];
        }
    }
    renderFileList();
    if (typeof renderSplitOptionsUI === 'function') renderSplitOptionsUI();
}

function calculateFixedRanges() {
    splitRanges = [];
    for (let i = 1; i <= pdfTotalPagesForSplit; i += fixedSplitPageCount) {
        let end = i + fixedSplitPageCount - 1;
        if (end > pdfTotalPagesForSplit) end = pdfTotalPagesForSplit;
        splitRanges.push({ from: i, to: end });
    }
}

window.renderSplitOptionsUI = function () {
    if (currentTool !== 'split') return;

    // Main Tabs: Range, Pages, Size
    toolOptions.innerHTML = `
        <div style="display: flex; margin-bottom: 25px; border-bottom: 1px solid rgba(255,255,255,0.1);">
            <div id="tab-split-range" style="flex: 1; text-align: center; padding-bottom: 15px; border-bottom: 2px solid ${splitMainTab === 'range' ? '#ef4444' : 'transparent'}; color: ${splitMainTab === 'range' ? '#ef4444' : 'var(--text-mute)'}; font-weight: 600; cursor: pointer; margin-bottom: -1px;">
                <i class="fa-solid fa-arrows-left-right" style="display: block; font-size: 20px; margin-bottom: 8px;"></i> Range
            </div>
            <div id="tab-split-pages" style="flex: 1; text-align: center; padding-bottom: 15px; border-bottom: 2px solid ${splitMainTab === 'pages' ? '#ef4444' : 'transparent'}; color: ${splitMainTab === 'pages' ? '#ef4444' : 'var(--text-mute)'}; font-weight: 600; cursor: pointer; margin-bottom: -1px;">
                <i class="fa-solid fa-file-export" style="display: block; font-size: 20px; margin-bottom: 8px;"></i> Pages
            </div>
            <div id="tab-split-size" style="flex: 1; text-align: center; padding-bottom: 15px; border-bottom: 2px solid ${splitMainTab === 'size' ? '#ef4444' : 'transparent'}; color: ${splitMainTab === 'size' ? '#ef4444' : 'var(--text-mute)'}; font-weight: 600; cursor: pointer; margin-bottom: -1px; position:relative;">
                <i class="fa-solid fa-up-right-and-down-left-from-center" style="display: block; font-size: 20px; margin-bottom: 8px;"></i> Size
            </div>
        </div>
        
        <div id="split-range-content" class="${splitMainTab === 'range' ? '' : 'hidden'}">
            <p style="font-size: 13px; font-weight: bold; margin-bottom: 12px; color: var(--text-main);">Range mode:</p>
            <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                <button id="btn-split-custom" class="btn-outline" style="flex: 1; ${splitMode === 'custom' ? 'border-color: #ef4444; color: #ef4444; background: rgba(239, 68, 68, 0.05);' : 'border-color: var(--border-color); color: var(--text-mute);'}">Custom</button>
                <button id="btn-split-fixed" class="btn-outline" style="flex: 1; ${splitMode === 'fixed' ? 'border-color: #ef4444; color: #ef4444; background: rgba(239, 68, 68, 0.05);' : 'border-color: var(--border-color); color: var(--text-mute);'}">Fixed</button>
            </div>
            ${splitMode === 'custom' ? `
                <div id="split-ranges-container"></div>
                <button id="btn-add-split-range" class="btn-outline" style="width: 100%; border: 1px dashed rgba(239,68,68,0.5); color: #ef4444; font-weight: 600; margin-bottom: 20px; font-size: 13px; display: flex; justify-content: center;">
                    <i class="fa-solid fa-plus"></i> Tambah Range
                </button>
            ` : `
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="font-weight:600; font-size: 13px; color: var(--text-main);">Split into page ranges of:</label>
                    <input type="number" id="fixed-range-size" class="form-control" value="${fixedSplitPageCount}" min="1" max="${pdfTotalPagesForSplit}" style="margin-top:8px;">
                </div>
                <div style="background: rgba(99, 102, 241, 0.05); border: 1px solid rgba(99, 102, 241, 0.1); padding: 12px; border-radius: 8px; font-size: 12px; color: #818cf8; display: flex; gap: 10px; align-items: center; margin-bottom: 20px;">
                    <i class="fa-solid fa-circle-info"></i>
                    <span>PDF ini akan dipisah setiap ${fixedSplitPageCount} halaman. ${splitRanges.length} file PDF akan dibuat.</span>
                </div>
            `}
        </div>

        <div id="split-pages-content" class="${splitMainTab === 'pages' ? '' : 'hidden'}">
            <p style="font-size: 13px; font-weight: bold; margin-bottom: 12px; color: var(--text-main);">Extract mode:</p>
            <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                <button id="btn-extract-all" class="btn-outline" style="flex: 1; ${extractMode === 'all' ? 'border-color: #ef4444; color: #ef4444; background: rgba(239, 68, 68, 0.05);' : 'border-color: var(--border-color); color: var(--text-mute);'}">Extract all pages</button>
                <button id="btn-extract-select" class="btn-outline" style="flex: 1; ${extractMode === 'select' ? 'border-color: #ef4444; color: #ef4444; background: rgba(239, 68, 68, 0.05);' : 'border-color: var(--border-color); color: var(--text-mute);'}">Select pages</button>
            </div>
            
            ${extractMode === 'select' ? `
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="font-weight:600; font-size: 13px; color: var(--text-main);">Pages to extract:</label>
                    <input type="text" id="select-pages-input" class="form-control" value="${selectedSplitPages.join(',')}" placeholder="example: 1,5,6" style="margin-top:8px;">
                </div>
                <div style="margin-bottom: 20px;">
                    <label style="display: flex; gap: 12px; align-items: center; font-size: 13px; cursor: pointer; color: var(--text-main);">
                        <input type="checkbox" id="merge-pages-check" style="accent-color: #ef4444;">
                        <span>Merge extracted pages into one PDF file.</span>
                    </label>
                </div>
            ` : ''}

            <div style="background: rgba(99, 102, 241, 0.1); border-left: 3px solid #6366f1; padding: 12px 15px; border-radius: 4px; font-size: 13px; color: #818cf8;">
                <i class="fa-solid fa-circle-info"></i> ${extractMode === 'all' ? `All pages will be converted into separate PDF files. ${pdfTotalPagesForSplit} PDF will be created.` : `Selected pages will be converted into separate PDF files. ${selectedSplitPages.length} PDF will be created.`}
            </div>
        </div>

        <div id="split-size-content" class="${splitMainTab === 'size' ? '' : 'hidden'}">
             <div style="font-size: 11px; color: var(--text-mute); margin-bottom: 15px;">
                Original file size: ${(currentPdfFileForSplit?.size / (1024 * 1024)).toFixed(2)} MB<br>
                Total pages: ${pdfTotalPagesForSplit}
            </div>
            <div class="form-group" style="margin-bottom: 15px;">
                <label style="font-weight:600; font-size: 13px; color: var(--text-main);">Maximum size per file:</label>
                <div style="display: flex; gap: 10px; margin-top: 8px;">
                    <input type="number" id="max-size-input" class="form-control" value="${maxSizePerFile}" style="flex: 1;">
                    <div style="display: flex; background: rgba(255,255,255,0.05); border-radius: 8px; padding: 4px; border: 1px solid var(--border-color);">
                        <button id="unit-kb" style="padding: 4px 8px; border: none; font-size: 10px; border-radius: 4px; background: ${sizeUnit === 'KB' ? '#fff' : 'transparent'}; color: ${sizeUnit === 'KB' ? '#000' : '#fff'}; cursor: pointer;">KB</button>
                        <button id="unit-mb" style="padding: 4px 8px; border: none; font-size: 10px; border-radius: 4px; background: ${sizeUnit === 'MB' ? '#fff' : 'transparent'}; color: ${sizeUnit === 'MB' ? '#000' : '#fff'}; cursor: pointer;">MB</button>
                    </div>
                </div>
            </div>
            <div style="background: rgba(99, 102, 241, 0.1); border-left: 3px solid #6366f1; padding: 12px 15px; border-radius: 4px; font-size: 13px; color: #818cf8; margin-bottom: 20px;">
                <i class="fa-solid fa-circle-info"></i> This PDF will be split into files no larger than ${maxSizePerFile} ${sizeUnit} each.
            </div>
            <label style="display: flex; gap: 12px; align-items: center; font-size: 13px; cursor: pointer; color: var(--text-main);">
                <input type="checkbox" checked style="accent-color: #10b981;">
                <span>Allow compression</span>
            </label>
        </div>

        <div id="old-split-common-foot" class="${splitMainTab === 'range' ? '' : 'hidden'}" style="margin-top: 10px; background: rgba(99, 102, 241, 0.1); border-left: 3px solid #6366f1; padding: 12px 15px; border-radius: 4px;">
            <label style="display: flex; gap: 12px; align-items: start; font-size: 13px; cursor: pointer; margin: 0; color: #818cf8;">
                <input type="checkbox" id="merge-extracted" style="margin-top: 2px; accent-color: #6366f1;">
                <span>Gabungkan semua rentang ke dalam satu file PDF.</span>
            </label>
        </div>
    `;

    // Events Main Tabs
    document.getElementById('tab-split-range').addEventListener('click', () => { splitMainTab = 'range'; renderSplitOptionsUI(); renderFileList(); });
    document.getElementById('tab-split-pages').addEventListener('click', () => { splitMainTab = 'pages'; renderSplitOptionsUI(); renderFileList(); });
    document.getElementById('tab-split-size').addEventListener('click', () => { splitMainTab = 'size'; renderSplitOptionsUI(); renderFileList(); });

    if (splitMainTab === 'range') {
        document.getElementById('btn-split-custom').addEventListener('click', () => { splitMode = 'custom'; renderSplitOptionsUI(); renderFileList(); });
        document.getElementById('btn-split-fixed').addEventListener('click', () => { splitMode = 'fixed'; calculateFixedRanges(); renderSplitOptionsUI(); renderFileList(); });
        if (splitMode === 'custom') renderSplitRangesUI();
        else {
            const inf = document.getElementById('fixed-range-size');
            inf.addEventListener('input', (e) => {
                fixedSplitPageCount = parseInt(e.target.value) || 1;
                calculateFixedRanges();
                renderFileList();
                renderSplitOptionsUI();
            });
        }
    } else if (splitMainTab === 'pages') {
        document.getElementById('btn-extract-all').addEventListener('click', () => { extractMode = 'all'; renderSplitOptionsUI(); renderFileList(); });
        document.getElementById('btn-extract-select').addEventListener('click', () => { extractMode = 'select'; renderSplitOptionsUI(); renderFileList(); });
        if (extractMode === 'select') {
            document.getElementById('select-pages-input').addEventListener('input', (e) => {
                const val = e.target.value.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v));
                selectedSplitPages = val;
                renderFileList();
                // update info text without full rerender if possible or just rerender
            });
        }
    } else if (splitMainTab === 'size') {
        document.getElementById('max-size-input').addEventListener('input', (e) => { maxSizePerFile = parseInt(e.target.value) || 100; renderSplitOptionsUI(); });
        document.getElementById('unit-kb').addEventListener('click', () => { sizeUnit = 'KB'; renderSplitOptionsUI(); });
        document.getElementById('unit-mb').addEventListener('click', () => { sizeUnit = 'MB'; renderSplitOptionsUI(); });
    }
}

window.renderSplitRangesUI = function () {
    const container = document.getElementById('split-ranges-container');
    if (!container) return;
    container.innerHTML = splitRanges.map((r, i) => `
        <div style="margin-bottom: 15px; background: rgba(255,255,255,0.02); padding: 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <div style="font-size: 12px; font-weight: 600; color: #94a3b8;"><i class="fa-solid fa-arrows-up-down"></i> Range ${i + 1}</div>
                ${i > 0 ? `<button onclick="removeSplitRange(${i})" style="background: none; border: none; color: #ef4444; cursor: pointer;"><i class="fa-solid fa-xmark"></i></button>` : ''}
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
                <span style="font-size: 11px; color: var(--text-mute); width: 30px;">dari</span>
                <input type="number" min="1" max="${pdfTotalPagesForSplit}" value="${r.from}" class="form-control" style="padding: 6px; width: 60px; font-size: 13px;" onchange="updateSplitRange(${i}, 'from', this.value)">
                <span style="font-size: 11px; color: var(--text-mute); width: 20px; text-align: center;">ke</span>
                <input type="number" min="1" max="${pdfTotalPagesForSplit}" value="${r.to}" class="form-control" style="padding: 6px; width: 60px; font-size: 13px;" onchange="updateSplitRange(${i}, 'to', this.value)">
            </div>
        </div>
    `).join('');

    const btnAdd = document.getElementById('btn-add-split-range');
    if (btnAdd && !btnAdd.hasAttribute('data-bound')) {
        btnAdd.setAttribute('data-bound', '1');
        btnAdd.addEventListener('click', () => {
            splitRanges.push({ from: 1, to: pdfTotalPagesForSplit });
            renderSplitRangesUI();
            if (currentTool === 'split') renderFileList();
        });
    }
}

window.updateSplitRange = function (index, prop, val) {
    let v = parseInt(val);
    if (isNaN(v) || v < 1) v = 1;
    if (v > pdfTotalPagesForSplit) v = pdfTotalPagesForSplit;
    splitRanges[index][prop] = v;
    if (currentTool === 'split') renderFileList();
}

window.removeSplitRange = function (index) {
    splitRanges.splice(index, 1);
    renderSplitRangesUI();
    if (currentTool === 'split') renderFileList();
}

function renderFileList() {
    if (selectedFiles.length === 0) {
        workspacePanel.classList.add('hidden');
        uploadBox.classList.remove('hidden');
        return;
    }
    workspacePanel.classList.remove('hidden');
    uploadBox.classList.add('hidden');
    fileList.innerHTML = '';

    // Set pdf worker if not set
    if (window.pdfjsLib && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    if (currentTool === 'split') {
        fileList.classList.add('split-mode');
        renderSplitWorkspaceVisuals();
        return;
    }

    fileList.classList.remove('split-mode');

    selectedFiles.forEach((file, index) => {
        const li = document.createElement('li');
        li.className = 'file-item';
        li.draggable = true;
        li.dataset.index = index;

        let iconClass = 'fa-file-pdf';
        if (file.type.startsWith('image/')) iconClass = 'fa-file-image text-success';

        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);

        li.innerHTML = `
            <div class="file-item-actions">
                <button class="btn-icon-circle remove" onclick="removeFile(${index})" title="Hapus">
                    <i class="fa-solid fa-xmark"></i>
                </button>
                <button class="btn-icon-circle preview" onclick="previewFile(${index})" title="Preview">
                    <i class="fa-solid fa-eye"></i>
                </button>
            </div>
            <div class="file-preview-box" id="preview-box-${index}">
                <i class="fa-solid ${iconClass}" style="font-size: 32px; opacity: 0.3;"></i>
            </div>
            <div class="file-info">
                <div class="file-name" title="${file.name}">${file.name}</div>
                <div class="file-size">${sizeMB} MB</div>
            </div>
            <div class="file-badge">
                ${index + 1}
            </div>
        `;

        // Drag and Drop ordering events
        li.addEventListener('dragstart', (e) => {
            draggedItemIndex = index;
            li.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        li.addEventListener('dragend', () => {
            li.classList.remove('dragging');
            draggedItemIndex = null;
        });

        li.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            // Add visual indication
            const currentItem = e.target.closest('.file-item');
            if (currentItem && currentItem !== li) {
                // Determine mouse position to show drop indicator (optional enhancement)
            }
        });

        li.addEventListener('drop', (e) => {
            e.preventDefault();
            if (draggedItemIndex === null || draggedItemIndex === index) return;

            const draggedFile = selectedFiles[draggedItemIndex];
            selectedFiles.splice(draggedItemIndex, 1);
            selectedFiles.splice(index, 0, draggedFile);
            renderFileList();
        });

        fileList.appendChild(li);

        // Async Thumbnail generation
        generateThumbnail(file, index);
    });
}

async function generateThumbnail(file, index) {
    const box = document.getElementById(`preview-box-${index}`);
    if (!box) return;

    try {
        if (file.type === 'application/pdf' && window.pdfjsLib) {
            const fileUrl = URL.createObjectURL(file);
            const loadingTask = pdfjsLib.getDocument(fileUrl);
            const pdf = await loadingTask.promise;
            const page = await pdf.getPage(1);

            const viewport = page.getViewport({ scale: 0.5 }); // thumbnail size
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport: viewport }).promise;

            box.innerHTML = '';
            box.appendChild(canvas);
            URL.revokeObjectURL(fileUrl);
        } else if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            box.innerHTML = '';
            box.appendChild(img);
        }
    } catch (e) {
        console.warn("Could not generate thumbnail for file:", file.name, e);
    }
}

window.removeFile = function (index) {
    selectedFiles.splice(index, 1);
    renderFileList();
};

function clearFiles() {
    selectedFiles = [];
    fileInput.value = '';
    renderFileList();
}
btnClear.addEventListener('click', clearFiles);

const btnAddMore = document.getElementById('btn-add-more');
if (btnAddMore) {
    btnAddMore.addEventListener('click', () => {
        fileInput.click();
    });
}

// === Processing Logic ===
const loader = document.getElementById('loader');
const successModal = document.getElementById('success-modal');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnDownload = document.getElementById('btn-download');
const progressText = document.getElementById('progress-text');

btnCloseModal.addEventListener('click', () => {
    successModal.classList.add('hidden');
    clearFiles();
});

btnDownload.addEventListener('click', () => {
    if (processedBlob) {
        const url = URL.createObjectURL(processedBlob);
        const a = document.createElement('a');
        a.href = url;
        const ts = new Date().getTime();

        let ext = 'pdf';
        if (processedBlob.type.includes('zip')) ext = 'zip';
        else if (processedBlob.type.includes('plain')) ext = 'txt';
        else if (processedBlob.type.includes('jpeg')) ext = 'jpg';
        else if (processedBlob.type.includes('png')) ext = 'png';

        a.download = `PDF_MGC_${ts}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
});

btnProcess.addEventListener('click', async () => {
    if (selectedFiles.length === 0) return;

    loader.classList.remove('hidden');
    processedBlob = null;

    try {
        switch (currentTool) {
            case 'merge':
                await processMerge();
                break;
            case 'split':
                await processSplit();
                break;
            case 'ocr':
                await processOCR();
                break;
            case 'compress':
                await processCompress();
                break;
            default:
                await processMockDelay();
                break;
        }

        loader.classList.add('hidden');
        successModal.classList.remove('hidden');
    } catch (e) {
        loader.classList.add('hidden');
        console.error(e);
        alert("Terjadi kesalahan saat memproses file: " + e.message);
    }
});

async function processOCR() {
    progressText.innerText = "Menyiapkan mesin OCR...";
    const worker = await Tesseract.createWorker('ind');

    const { PDFDocument } = PDFLib;
    const finalPdf = await PDFDocument.create();

    let count = 0;
    for (const file of selectedFiles) {
        count++;
        progressText.innerText = `Menganalisis teks file ${count} dari ${selectedFiles.length}...`;

        try {
            let targetContent = file;

            // If PDF, convert first page to image for OCR
            if (file.type === 'application/pdf') {
                const pdfData = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
                const page = await pdf.getPage(1);
                const viewport = page.getViewport({ scale: 2.0 });
                const canvas = document.createElement('canvas');
                const canvasContext = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                await page.render({ canvasContext, viewport }).promise;
                targetContent = canvas.toDataURL('image/png');
            }

            // Generate Searchable PDF for this specific image/page
            const { data: { pdf } } = await worker.recognize(targetContent, { pdfTitle: file.name }, { pdf: true });

            // Tesseract returns an ArrayBuffer for the PDF. Load it into pdf-lib to merge
            const ocrPagePdf = await PDFDocument.load(pdf);
            const copiedPages = await finalPdf.copyPages(ocrPagePdf, ocrPagePdf.getPageIndices());
            copiedPages.forEach((page) => finalPdf.addPage(page));

        } catch (err) {
            console.error("Error processing OCR for", file.name, err);
        }
    }

    await worker.terminate();

    if (finalPdf.getPageCount() === 0) {
        throw new Error("Gagal mengekstraksi teks dari file yang dipilih.");
    }

    const pdfBytes = await finalPdf.save();
    processedBlob = new Blob([pdfBytes], { type: 'application/pdf' });
}

async function processCompress() {
    progressText.innerText = "Menginisialisasi optimasi mendalam...";
    const { PDFDocument, PDFRawStream, PDFName, PDFDict } = PDFLib;
    
    // Quality settings
    const qualityLevel = parseInt(document.getElementById('compress-quality').value) || 40;
    const quality = qualityLevel / 100;

    for (const file of selectedFiles) {
        if (file.type !== 'application/pdf') continue;

        const pdfData = await file.arrayBuffer();
        const srcDoc = await PDFDocument.load(pdfData);
        const pdfDoc = await PDFDocument.create();
        
        // This map stores [Original Reference ID] -> [New Compressed Image Object]
        const imageMap = new Map();
        
        progressText.innerText = "Menganalisis aset gambar...";
        const indirectObjects = srcDoc.context.enumerateIndirectObjects();
        
        for (const [ref, obj] of indirectObjects) {
            if (obj instanceof PDFRawStream) {
                const dict = obj.dict;
                if (dict.get(PDFName.of('Subtype')) === PDFName.of('Image')) {
                    try {
                        const width = dict.get(PDFName.of('Width')).numberValue;
                        const height = dict.get(PDFName.of('Height')).numberValue;
                        
                        // Extract and Compress
                        const rawBytes = obj.getContents();
                        const blob = new Blob([rawBytes]);
                        const url = URL.createObjectURL(blob);
                        
                        const img = await new Promise((resolve, reject) => {
                            const i = new Image();
                            i.onload = () => resolve(i);
                            i.onerror = () => reject();
                            i.src = url;
                        });

                        const canvas = document.createElement('canvas');
                        // Smart downsampling: Extreme (15) -> 0.5x, Recommended (40) -> 0.7x, Less (75) -> 0.9x
                        let factor = 0.8;
                        if (qualityLevel < 30) factor = 0.5;
                        if (qualityLevel > 70) factor = 1.0;
                        
                        canvas.width = width * factor;
                        canvas.height = height * factor;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        
                        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                        const compressedBytes = Uint8Array.from(atob(compressedDataUrl.split(',')[1]), c => c.charCodeAt(0));
                        
                        const newImg = await pdfDoc.embedJpg(compressedBytes);
                        imageMap.set(ref.toString(), newImg);
                        
                        URL.revokeObjectURL(url);
                    } catch (e) {
                        // Skip if format is incompatible with browser Image()
                    }
                }
            }
        }

        progressText.innerText = "Menyusun ulang struktur dokumen...";
        const copiedPages = await pdfDoc.copyPages(srcDoc, srcDoc.getPageIndices());
        
        for (let i = 0; i < copiedPages.length; i++) {
            const page = copiedPages[i];
            // Access internal resources to swap pointers
            const xObjects = page.node.Resources().get(PDFName.of('XObject'));
            if (xObjects instanceof PDFDict) {
                for (const [name, ref] of xObjects.entries()) {
                    if (imageMap.has(ref.toString())) {
                        xObjects.set(name, imageMap.get(ref.toString()).ref);
                    }
                }
            }
            pdfDoc.addPage(page);
        }

        const pdfBytes = await pdfDoc.save({ useObjectStreams: true, addDefaultMetadata: false });
        processedBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    }
}

function cleanPdfText(str) {
    return str.replace(/[^\x20-\x7E]/g, ''); // Filter WinAnsi compatibility
}

async function processMockDelay() {
    progressText.innerText = "Sistem web sedang berjalan di background...";
    await new Promise(resolve => setTimeout(resolve, 2000));
    processedBlob = new Blob(["Simulasi berhasil"], { type: "text/plain" });
}

async function processMerge() {
    progressText.innerText = "Membaca dokumen PDF...";
    const { PDFDocument } = PDFLib;
    const mergedPdf = await PDFDocument.create();

    let count = 1;
    for (const file of selectedFiles) {
        progressText.innerText = `Menggabungkan dokumen ${count} dari ${selectedFiles.length}...`;
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
        count++;
    }

    progressText.innerText = "Menyimpan output akhir...";
    const pdfBytes = await mergedPdf.save();
    processedBlob = new Blob([pdfBytes], { type: 'application/pdf' });
}

async function processSplit() {
    progressText.innerText = "Memproses pemisahan dokumen...";
    if (!currentPdfFileForSplit && selectedFiles.length === 0) return;
    const fileTarget = currentPdfFileForSplit || selectedFiles[0];

    const { PDFDocument } = PDFLib;
    const arrayBuffer = await fileTarget.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const totalPages = pdfDoc.getPageCount();

    if (splitMainTab === 'range') {
        const mergeExtractedObj = document.getElementById('merge-extracted');
        const mergeExtracted = mergeExtractedObj ? mergeExtractedObj.checked : true;

        if (mergeExtracted) {
            let pagesToExtract = [];
            splitRanges.forEach(r => {
                for (let i = r.from; i <= r.to; i++) {
                    if (i >= 1 && i <= totalPages) pagesToExtract.push(i - 1);
                }
            });
            if (pagesToExtract.length === 0) throw new Error("Tidak ada halaman yang dipilih.");

            const splitPdf = await PDFDocument.create();
            const copiedPages = await splitPdf.copyPages(pdfDoc, pagesToExtract);
            copiedPages.forEach((page) => splitPdf.addPage(page));
            const pdfBytes = await splitPdf.save();
            processedBlob = new Blob([pdfBytes], { type: 'application/pdf' });
        } else {
            const zip = new JSZip();
            for (let i = 0; i < splitRanges.length; i++) {
                const r = splitRanges[i];
                let rangePages = [];
                for (let p = r.from; p <= r.to; p++) if (p >= 1 && p <= totalPages) rangePages.push(p - 1);

                if (rangePages.length > 0) {
                    const subPdf = await PDFDocument.create();
                    const copiedPages = await subPdf.copyPages(pdfDoc, rangePages);
                    copiedPages.forEach((page) => subPdf.addPage(page));
                    const pdfBytes = await subPdf.save();
                    zip.file(`Range_${i + 1}_(${r.from}-${r.to}).pdf`, pdfBytes);
                }
            }
            processedBlob = await zip.generateAsync({ type: "blob" });
        }
    } else if (splitMainTab === 'pages') {
        const mergeCheck = document.getElementById('merge-pages-check');
        const merge = mergeCheck ? mergeCheck.checked : false;

        let targetPages = [];
        if (extractMode === 'all') {
            for (let i = 0; i < totalPages; i++) targetPages.push(i);
        } else {
            targetPages = selectedSplitPages.map(p => p - 1).filter(p => p >= 0 && p < totalPages);
        }

        if (targetPages.length === 0) throw new Error("Silahkan pilih halaman yang ingin diekstrak.");

        if (merge) {
            const subPdf = await PDFDocument.create();
            const copiedPages = await subPdf.copyPages(pdfDoc, targetPages);
            copiedPages.forEach(p => subPdf.addPage(p));
            const pdfBytes = await subPdf.save();
            processedBlob = new Blob([pdfBytes], { type: 'application/pdf' });
        } else {
            const zip = new JSZip();
            for (let i = 0; i < targetPages.length; i++) {
                const pageIdx = targetPages[i];
                progressText.innerText = `Mengekstrak halaman ${i + 1} dari ${targetPages.length}...`;
                const subPdf = await PDFDocument.create();
                const [copiedPage] = await subPdf.copyPages(pdfDoc, [pageIdx]);
                subPdf.addPage(copiedPage);
                const pdfBytes = await subPdf.save();
                zip.file(`halaman-${pageIdx + 1}.pdf`, pdfBytes);
            }
            processedBlob = await zip.generateAsync({ type: "blob" });
        }
    } else if (splitMainTab === 'size') {
        const targetSizeInBytes = maxSizePerFile * (sizeUnit === 'MB' ? 1024 * 1024 : 1024);
        const zip = new JSZip();
        
        let currentChunkPages = [];
        let chunkCount = 1;

        for (let i = 0; i < totalPages; i++) {
            progressText.innerText = `Menganalisis halaman ${i + 1} untuk ukuran file...`;
            
            // Try adding this page to the current chunk
            currentChunkPages.push(i);
            
            const tempPdf = await PDFDocument.create();
            const copiedPages = await tempPdf.copyPages(pdfDoc, currentChunkPages);
            copiedPages.forEach(p => tempPdf.addPage(p));
            const tempBytes = await tempPdf.save();
            
            // If it exceeds the limit AND it's not the first page of the chunk
            if (tempBytes.length > targetSizeInBytes && currentChunkPages.length > 1) {
                // Remove the last page from this chunk
                currentChunkPages.pop();
                
                // Finalize the previous state of this chunk
                const finalSubPdf = await PDFDocument.create();
                const finalCopied = await finalSubPdf.copyPages(pdfDoc, currentChunkPages);
                finalCopied.forEach(p => finalSubPdf.addPage(p));
                const finalPartBytes = await finalSubPdf.save();
                
                zip.file(`Bagian_${chunkCount}.pdf`, finalPartBytes);
                chunkCount++;
                
                // Start a new chunk with the current page
                currentChunkPages = [i];
            }
        }
        
        // Finalize the last chunk
        if (currentChunkPages.length > 0) {
            const lastSubPdf = await PDFDocument.create();
            const lastCopied = await lastSubPdf.copyPages(pdfDoc, currentChunkPages);
            lastCopied.forEach(p => lastSubPdf.addPage(p));
            const lastBytes = await lastSubPdf.save();
            zip.file(`Bagian_${chunkCount}.pdf`, lastBytes);
        }

        processedBlob = await zip.generateAsync({ type: "blob" });
    }
}

function renderSplitWorkspaceVisuals() {
    fileList.classList.add('split-mode');
    fileList.innerHTML = '';

    // Header (always visible in split)
    const header = document.createElement('div');
    header.className = 'split-preview-header';

    const fileName = currentPdfFileForSplit ? currentPdfFileForSplit.name : 'Dokumen PDF';
    header.innerHTML = `
        <div class="split-file-info">
            <div class="split-file-icon">
                <i class="fa-solid fa-file-pdf"></i>
            </div>
            <div>
                <div class="file-name" style="font-size: 16px; margin-bottom: 2px;">${fileName}</div>
                <div class="file-size">${pdfTotalPagesForSplit} Halaman</div>
            </div>
        </div>
        <button class="btn-outline" onclick="previewFile(0)">
            <i class="fa-solid fa-eye"></i> Preview Dokumen
        </button>
    `;
    fileList.appendChild(header);

    const container = document.createElement('div');
    container.className = splitMainTab === 'range' ? 'split-range-grid' : 'page-grid';

    if (splitMainTab === 'range') {
        splitRanges.forEach((range, i) => {
            const card = document.createElement('div');
            card.className = 'split-range-card';

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <div class="split-range-title">Range ${i + 1}</div>
                    <button class="btn-icon-circle preview" onclick="previewSplitRange(${i})" title="Preview Range">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                </div>
                <div class="range-visualizer">
                    <div class="range-page-thumb">
                        <div class="thumb-box" id="split-thumb-${i}-start">
                            <i class="fa-solid fa-file-pdf" style="font-size: 24px; color: #ef4444; opacity: 0.2;"></i>
                        </div>
                        <div class="page-num">Hal ${range.from}</div>
                    </div>
                    
                    ${range.from !== range.to ? `
                        <div class="range-separator">...</div>
                        <div class="range-page-thumb">
                            <div class="thumb-box" id="split-thumb-${i}-end">
                                <i class="fa-solid fa-file-pdf" style="font-size: 24px; color: #ef4444; opacity: 0.2;"></i>
                            </div>
                            <div class="page-num">Hal ${range.to}</div>
                        </div>
                    ` : ''}
                </div>
            `;
            container.appendChild(card);
            if (currentPdfFileForSplit) {
                generateSplitThumbnail(currentPdfFileForSplit, range.from, `split-thumb-${i}-start`);
                if (range.from !== range.to) generateSplitThumbnail(currentPdfFileForSplit, range.to, `split-thumb-${i}-end`);
            }
        });
    } else if (splitMainTab === 'pages') {
        for (let i = 1; i <= pdfTotalPagesForSplit; i++) {
            const isSelected = extractMode === 'all' || selectedSplitPages.includes(i);
            const card = document.createElement('div');
            card.className = `page-item-card ${isSelected ? 'selected' : ''}`;

            card.innerHTML = `
                <div class="page-item-thumb" id="page-grid-thumb-${i}">
                     <i class="fa-solid fa-file-pdf" style="font-size: 24px; color: #ef4444; opacity: 0.2;"></i>
                </div>
                <div class="page-num" style="font-weight: 800; font-size: 13px; color: var(--text-main);">${i}</div>
                ${isSelected ? `<div class="file-badge" style="background: var(--success); top: -6px; left: -6px; width: 22px; height: 22px;"><i class="fa-solid fa-check"></i></div>` : ''}
            `;

            card.onclick = () => {
                if (extractMode === 'all') return;
                if (selectedSplitPages.includes(i)) {
                    selectedSplitPages = selectedSplitPages.filter(p => p !== i);
                } else {
                    selectedSplitPages.push(i);
                }
                renderFileList();
                renderSplitOptionsUI();
            };

            container.appendChild(card);
            if (currentPdfFileForSplit) generateSplitThumbnail(currentPdfFileForSplit, i, `page-grid-thumb-${i}`);
        }
    } else if (splitMainTab === 'size') {
        const card = document.createElement('div');
        card.className = 'split-range-card';
        card.style.maxWidth = '400px';
        card.style.margin = '0 auto';
        card.style.textAlign = 'center';

        card.innerHTML = `
            <div class="page-item-thumb" id="size-mode-thumb" style="height: 200px; margin-bottom: 20px;">
                 <i class="fa-solid fa-file-pdf" style="font-size: 48px; color: #ef4444; opacity: 0.2;"></i>
            </div>
            <div style="font-weight: 700; font-size: 15px; color: var(--text-main);">${currentPdfFileForSplit?.name || 'Dokumen'}</div>
            <div style="font-size: 13px; color: var(--text-mute); margin-top: 4px;">Mode: Pisah berdasarkan ukuran</div>
        `;
        container.appendChild(card);
        if (currentPdfFileForSplit) generateSplitThumbnail(currentPdfFileForSplit, 1, `size-mode-thumb`);
    }

    fileList.appendChild(container);
}

window.previewSplitRange = async function (index) {
    if (!currentPdfFileForSplit) return;
    const range = splitRanges[index];

    loader.classList.remove('hidden');
    progressText.innerText = "Menyiapkan pratinjau rentang halaman...";

    try {
        const { PDFDocument } = PDFLib;
        const arrayBuffer = await currentPdfFileForSplit.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const subPdf = await PDFDocument.create();

        const pagesToExtract = [];
        for (let p = range.from; p <= range.to; p++) {
            if (p >= 1 && p <= pdfDoc.getPageCount()) pagesToExtract.push(p - 1);
        }

        if (pagesToExtract.length === 0) throw new Error("Range tidak valid");

        const copiedPages = await subPdf.copyPages(pdfDoc, pagesToExtract);
        copiedPages.forEach(p => subPdf.addPage(p));

        const pdfBytes = await subPdf.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        previewTitle.innerText = `Preview: Range ${index + 1} (Hal ${range.from} - ${range.to})`;
        previewContainer.innerHTML = `<iframe src="${url}" style="width: 100%; height: 100%; border: none;"></iframe>`;
        previewModal.classList.remove('hidden');
    } catch (e) {
        console.error(e);
        alert("Gagal memuat pratinjau rentang.");
    } finally {
        loader.classList.add('hidden');
    }
};

async function generateSplitThumbnail(file, pageNum, elementId) {
    try {
        if (file.type === 'application/pdf' && window.pdfjsLib) {
            const box = document.getElementById(elementId);
            if (!box) return;
            const fileUrl = URL.createObjectURL(file);
            const loadingTask = pdfjsLib.getDocument(fileUrl);
            const pdf = await loadingTask.promise;

            if (pageNum < 1) pageNum = 1;
            if (pageNum > pdf.numPages) pageNum = pdf.numPages;

            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 0.4 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport: viewport }).promise;

            box.innerHTML = '';
            box.appendChild(canvas);
            setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
        }
    } catch (e) {
        console.warn("Split thumbnail failed", e);
    }
}

// Inisialisasi awal
document.addEventListener('DOMContentLoaded', () => {
    switchView('home');
});

// === Preview Logic ===
const previewModal = document.getElementById('preview-modal');
const previewTitle = document.getElementById('preview-title');
const previewContainer = document.getElementById('preview-container');
const btnClosePreview = document.getElementById('btn-close-preview');

if (btnClosePreview) {
    btnClosePreview.addEventListener('click', () => {
        previewModal.classList.add('hidden');
        previewContainer.innerHTML = ''; // free up memory
    });
}

window.previewFile = function (index) {
    const file = selectedFiles[index];
    if (!file) return;

    previewTitle.innerText = `Preview: ${file.name}`;
    previewContainer.innerHTML = '';

    const fileUrl = URL.createObjectURL(file);

    if (file.type === 'application/pdf') {
        const iframe = document.createElement('iframe');
        iframe.src = fileUrl + '#view=FitH'; // Fit page horizontally
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        previewContainer.appendChild(iframe);
    } else if (file.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = fileUrl;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        previewContainer.appendChild(img);
    } else {
        previewContainer.innerHTML = '<div style="padding: 40px; color: #333; text-align: center;">Format file ini tidak dapat dipreview.</div>';
    }

    previewModal.classList.remove('hidden');
};
