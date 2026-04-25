// ============================================================
// QUANTUM BUILDER — Compatibility Service + Wizard Logic
// 8-Step Guided PC Configuration
// Steps: Case → CPU → Mobo → Cooler → RAM → Storage → GPU → PSU
// ============================================================

// ── Step Definitions ────────────────────────────────────────
const BUILDER_STEPS = [
    { key: 'case',        label: 'Case',        icon: '🗃️', category: 'case',        hint: 'Choose your chassis — sets the form factor for your build.', optional: false },
    { key: 'cpu',         label: 'CPU',          icon: '⚡', category: 'cpu',         hint: 'Pick your processor — determines socket and RAM type.', optional: false },
    { key: 'motherboard', label: 'Motherboard',  icon: '🖥️', category: 'motherboard', hint: 'Must match your CPU socket and case form factor.', optional: false },
    { key: 'cooling',     label: 'Cooler',       icon: '❄️', category: 'cooling',     hint: 'AIO or air — must support your CPU socket.', optional: true },
    { key: 'ram',         label: 'RAM',          icon: '💡', category: 'ram',         hint: 'DDR5 for modern builds — must match your CPU/mobo.', optional: false },
    { key: 'storage',     label: 'Storage',      icon: '💾', category: 'storage',     hint: 'NVMe SSD for speed, HDD for bulk storage.', optional: true },
    { key: 'gpu',         label: 'GPU',          icon: '🎯', category: 'gpu',         hint: 'Your primary performance driver for gaming.', optional: false },
    { key: 'psu',         label: 'PSU',          icon: '🔌', category: 'psu',         hint: 'Power supply — sized to your total TDP + 25% overhead.', optional: false },
];

// ── TDP Map (parsed from spec strings, fallback values) ──────
const TDP_DEFAULTS = {
    cpu: 125, gpu: 300, motherboard: 30, ram: 10,
    storage: 8, cooling: 10, case: 0, psu: 0,
};

// ── Build State ──────────────────────────────────────────────
const BuildState = {
    selections: {},  // { case: partObj, cpu: partObj, ... }
    currentStep: 0,

    get(key)      { return this.selections[key] || null; },
    set(key, part){ this.selections[key] = part; },
    clear(key)    { delete this.selections[key]; },
    clearAll()    { this.selections = {}; this.currentStep = 0; },

    totalPrice() {
        return Object.values(this.selections).reduce((s, p) => s + (p?.price || 0), 0);
    },

    selectedCount() { return Object.keys(this.selections).length; },

    isEssentialComplete() {
        const essential = ['cpu', 'motherboard', 'ram', 'gpu'];
        return essential.every(k => !!this.selections[k]);
    },
};

// ── Compatibility Service ────────────────────────────────────
const CompatibilityService = {

    // Extract socket from compatibility or spec string
    extractSocket(part) {
        if (!part) return null;
        const str = (part.compatibility || '') + ' ' + (part.spec || '');
        if (/LGA1700/i.test(str)) return 'LGA1700';
        if (/AM5/i.test(str))     return 'AM5';
        if (/AM4/i.test(str))     return 'AM4';
        if (/LGA1200/i.test(str)) return 'LGA1200';
        // Also check socket field directly
        if (part.socket) return part.socket.toUpperCase();
        return null;
    },

    // Extract RAM type from spec/compatibility string
    extractRAMType(part) {
        if (!part) return null;
        const str = (part.spec || '') + ' ' + (part.compatibility || '');
        if (/DDR5/i.test(str)) return 'DDR5';
        if (/DDR4/i.test(str)) return 'DDR4';
        return null;
    },

    // Extract form factors supported by a case
    extractCaseFormFactors(casePart) {
        if (!casePart) return [];
        const str = (casePart.compatibility || '') + ' ' + (casePart.spec || '');
        const factors = [];
        if (/E-ATX/i.test(str))   factors.push('E-ATX');
        if (/M-ATX|mATX/i.test(str)) factors.push('M-ATX');
        if (/\bATX\b/i.test(str)) factors.push('ATX');
        if (/\bITX\b/i.test(str)) factors.push('ITX');
        if (/\bSFX\b/i.test(str)) factors.push('SFX');
        return factors;
    },

    // Extract wattage number from spec string
    extractWattage(psuPart) {
        if (!psuPart) return 0;
        const m = (psuPart.spec || psuPart.wattage || '').match(/(\d+)\s*W/i);
        return m ? parseInt(m[1]) : 0;
    },

    // Extract TDP from spec string
    extractTDP(part) {
        if (!part) return 0;
        const str = part.spec || '';
        const m = str.match(/(\d+)\s*W\s*TDP/i);
        if (m) return parseInt(m[1]);
        return TDP_DEFAULTS[part.category] || 0;
    },

    // Calculate total TDP across all selections
    totalTDP() {
        return Object.values(BuildState.selections).reduce(
            (sum, p) => sum + (p ? CompatibilityService.extractTDP(p) : 0), 0
        );
    },

    // Recommended PSU wattage = total TDP * 1.25, rounded up to nearest 50W
    recommendedPSU() {
        const tdp = this.totalTDP();
        if (tdp === 0) return 0;
        return Math.ceil((tdp * 1.25) / 50) * 50;
    },

    // ── Part-level compatibility check ─────────────────────
    // Returns array of conflict strings (empty = compatible)
    checkPartConflicts(stepKey, candidate) {
        const conflicts = [];
        const sel = BuildState.selections;

        // Motherboard vs CPU: socket match
        if (stepKey === 'motherboard' && sel.cpu) {
            const cpuSocket  = this.extractSocket(sel.cpu);
            const moboSocket = this.extractSocket(candidate);
            if (cpuSocket && moboSocket && cpuSocket !== moboSocket) {
                conflicts.push(`CPU is ${cpuSocket} but this motherboard uses ${moboSocket}`);
            }
        }
        if (stepKey === 'cpu' && sel.motherboard) {
            const cpuSocket  = this.extractSocket(candidate);
            const moboSocket = this.extractSocket(sel.motherboard);
            if (cpuSocket && moboSocket && cpuSocket !== moboSocket) {
                conflicts.push(`Motherboard uses ${moboSocket} but this CPU needs ${cpuSocket}`);
            }
        }

        // Motherboard vs Case: form factor
        if (stepKey === 'motherboard' && sel.case) {
            const caseFactors = this.extractCaseFormFactors(sel.case);
            const moboFactor  = candidate.formFactor || '';
            if (caseFactors.length > 0 && moboFactor) {
                const fits = caseFactors.some(f =>
                    moboFactor.toUpperCase().includes(f.toUpperCase()) ||
                    f.toUpperCase().includes(moboFactor.toUpperCase())
                );
                if (!fits) conflicts.push(`${moboFactor} motherboard doesn't fit in this case (supports ${caseFactors.join('/')})`);
            }
        }
        if (stepKey === 'case' && sel.motherboard) {
            const caseFactors = this.extractCaseFormFactors(candidate);
            const moboFactor  = sel.motherboard.formFactor || '';
            if (caseFactors.length > 0 && moboFactor) {
                const fits = caseFactors.some(f =>
                    moboFactor.toUpperCase().includes(f.toUpperCase()) ||
                    f.toUpperCase().includes(moboFactor.toUpperCase())
                );
                if (!fits) conflicts.push(`Your ${moboFactor} motherboard won't fit in this case`);
            }
        }

        // RAM DDR type vs CPU/Mobo
        if (stepKey === 'ram') {
            const refPart = sel.cpu || sel.motherboard;
            if (refPart) {
                const required = this.extractRAMType(refPart);
                const ramType  = this.extractRAMType(candidate);
                if (required && ramType && required !== ramType) {
                    conflicts.push(`Your build requires ${required}, but this RAM is ${ramType}`);
                }
            }
        }

        // Cooler vs CPU: socket compatibility
        if (stepKey === 'cooling' && sel.cpu) {
            const cpuSocket  = this.extractSocket(sel.cpu);
            const coolerCompat = candidate.compatibility || '';
            if (cpuSocket && !coolerCompat.toUpperCase().includes(cpuSocket.toUpperCase())) {
                conflicts.push(`This cooler may not support ${cpuSocket} socket`);
            }
        }

        return conflicts;
    },

    // Check if a candidate part is compatible with current selections
    isCompatible(stepKey, candidate) {
        return this.checkPartConflicts(stepKey, candidate).length === 0;
    },

    // Get all active build-level conflicts (for current full selection)
    getBuildConflicts() {
        const conflicts = [];
        const sel = BuildState.selections;

        // CPU ↔ Mobo socket
        if (sel.cpu && sel.motherboard) {
            const cs = this.extractSocket(sel.cpu);
            const ms = this.extractSocket(sel.motherboard);
            if (cs && ms && cs !== ms)
                conflicts.push(`⚡ CPU (${cs}) and Motherboard (${ms}) sockets don't match`);
        }

        // Mobo ↔ Case form factor
        if (sel.motherboard && sel.case) {
            const caseFactors = this.extractCaseFormFactors(sel.case);
            const moboFactor  = sel.motherboard.formFactor || '';
            if (caseFactors.length > 0 && moboFactor) {
                const fits = caseFactors.some(f =>
                    moboFactor.toUpperCase().includes(f.toUpperCase()) ||
                    f.toUpperCase().includes(moboFactor.toUpperCase())
                );
                if (!fits)
                    conflicts.push(`⚡ ${moboFactor} motherboard doesn't fit in case (supports ${caseFactors.join('/')})`);
            }
        }

        // RAM DDR type
        if (sel.ram && (sel.cpu || sel.motherboard)) {
            const ref      = sel.cpu || sel.motherboard;
            const required = this.extractRAMType(ref);
            const ramType  = this.extractRAMType(sel.ram);
            if (required && ramType && required !== ramType)
                conflicts.push(`⚡ RAM type mismatch: need ${required}, selected ${ramType}`);
        }

        // PSU underpowered
        if (sel.psu) {
            const psuW   = this.extractWattage(sel.psu);
            const recW   = this.recommendedPSU();
            if (psuW > 0 && recW > 0 && psuW < recW)
                conflicts.push(`⚡ PSU (${psuW}W) may be underpowered — recommended ${recW}W`);
        }

        return conflicts;
    },
};

// ── Wizard Renderer ──────────────────────────────────────────
function renderWizard() {
    renderSidebar();
    renderStepContent();
    renderConflictAlert();
}

function renderSidebar() {
    // Step indicator
    const stepsEl = document.getElementById('builderSteps');
    stepsEl.innerHTML = BUILDER_STEPS.map((step, i) => {
        const sel = BuildState.get(step.key);
        const isActive    = i === BuildState.currentStep;
        const isCompleted = !!sel;
        const isLocked    = i > BuildState.currentStep && !isCompleted;

        return `
        <div class="step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}"
             onclick="goToStep(${i})" data-step="${i}">
            <div class="step-num">${isCompleted ? '✓' : i + 1}</div>
            <div class="step-info">
                <span class="step-label">${step.icon} ${step.label}${step.optional ? ' <em style="opacity:0.5;font-size:0.6rem">(opt)</em>' : ''}</span>
                ${sel ? `<span class="step-selected-name">${sel.name}</span>` : ''}
            </div>
        </div>`;
    }).join('');

    // TDP meter
    const totalTDP = CompatibilityService.totalTDP();
    const maxTDP   = 900;
    const pct      = Math.min((totalTDP / maxTDP) * 100, 100);
    document.getElementById('tdpBar').style.width   = pct + '%';
    document.getElementById('tdpValueText').textContent = totalTDP > 0 ? `${totalTDP}W` : '—';
    const recPSU = CompatibilityService.recommendedPSU();
    document.getElementById('tdpPsuHint').innerHTML =
        recPSU > 0 ? `Recommended PSU: <span>${recPSU}W+</span>` : 'Select parts to estimate PSU';

    // Build parts list
    const partsListEl = document.getElementById('buildPartsList');
    const entries = BUILDER_STEPS.filter(s => BuildState.get(s.key));
    if (entries.length === 0) {
        partsListEl.innerHTML = `<div class="build-empty-hint">No parts selected yet</div>`;
    } else {
        partsListEl.innerHTML = entries.map(s => {
            const p = BuildState.get(s.key);
            return `
            <div class="build-part-row">
                <span class="build-part-icon">${s.icon}</span>
                <div class="build-part-info">
                    <span class="build-part-cat">${s.label}</span>
                    <span class="build-part-name">${p.name}</span>
                </div>
                <span class="build-part-price">₹${p.price.toLocaleString('en-IN')}</span>
            </div>`;
        }).join('');
    }

    // Total price
    const total = BuildState.totalPrice();
    document.getElementById('buildTotalPrice').textContent =
        total > 0 ? `₹${total.toLocaleString('en-IN')}` : '₹0';

    // Buy build button
    const buyBtn = document.getElementById('btnBuyBuild');
    buyBtn.disabled = !BuildState.isEssentialComplete();
}

function renderStepContent() {
    const step = BUILDER_STEPS[BuildState.currentStep];
    if (!step) return;

    // Step header
    document.getElementById('stepIcon').textContent  = step.icon;
    document.getElementById('stepTitle').textContent = `Step ${BuildState.currentStep + 1}: ${step.label}`;
    document.getElementById('stepHint').textContent  = step.hint;

    // Filter parts for this category
    let parts = typeof PARTS !== 'undefined' ? PARTS.filter(p => p.category === step.category) : [];

    // PSU step: sort by recommended wattage
    const recPSU = CompatibilityService.recommendedPSU();
    if (step.key === 'psu' && recPSU > 0) {
        parts = [...parts].sort((a, b) => {
            const aw = CompatibilityService.extractWattage(a);
            const bw = CompatibilityService.extractWattage(b);
            const aFits = aw >= recPSU;
            const bFits = bw >= recPSU;
            if (aFits && !bFits) return -1;
            if (!aFits && bFits)  return 1;
            return bw - aw;
        });
    }

    const grid = document.getElementById('componentsGrid');
    if (parts.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 0;color:var(--text-muted);font-family:var(--font-ui);">No parts available for this category.</div>`;
        return;
    }

    const currentSel = BuildState.get(step.key);

    grid.innerHTML = parts.map(part => {
        const isSelected   = currentSel && (currentSel.id === part.id || currentSel.name === part.name);
        const isIncompat   = !isSelected && !CompatibilityService.isCompatible(step.key, part);
        const tdp          = CompatibilityService.extractTDP(part);
        const psuW         = step.key === 'psu' ? CompatibilityService.extractWattage(part) : 0;
        const isPsuRec     = step.key === 'psu' && recPSU > 0 && psuW >= recPSU;

        const imgHtml = part.image
            ? `<img src="${part.image}" alt="${part.name}" onerror="this.parentElement.innerHTML='<div class=\\'comp-card-art\\' style=\\'background:${part.artColor || '#111'};\\'>${part.artIcon || '📦'}</div>'">`
            : `<div class="comp-card-art" style="background:${part.artColor || '#111'};">${part.artIcon || '📦'}</div>`;

        return `
        <div class="comp-card ${isSelected ? 'selected selected-check' : ''} ${isIncompat ? 'incompatible' : ''}"
             onclick="selectPart('${step.key}', '${part.id}')" id="comp-${part.id}">
            ${isPsuRec ? `<span class="psu-recommended-badge">✓ Recommended</span>` :
              (part.badge ? `<span class="comp-card-badge">${part.badge}</span>` : '')}
            <div class="comp-card-image">${imgHtml}</div>
            <div class="comp-card-body">
                <span class="comp-card-brand">${part.brand}</span>
                <span class="comp-card-name">${part.name}</span>
                <span class="comp-card-spec">${part.spec || ''}</span>
                ${tdp > 0 ? `<span class="comp-card-tdp">⚡ ${tdp}W TDP</span>` : ''}
                <div class="comp-card-footer">
                    <div>
                        <span class="comp-card-price">₹${part.price.toLocaleString('en-IN')}</span>
                        ${part.originalPrice ? `<span class="comp-card-original">₹${part.originalPrice.toLocaleString('en-IN')}</span>` : ''}
                    </div>
                    <button class="btn-select" onclick="event.stopPropagation();selectPart('${step.key}','${part.id}')">
                        ${isSelected ? '✓ Selected' : 'Select'}
                    </button>
                </div>
            </div>
        </div>`;
    }).join('');

    // Step nav buttons
    const prevBtn = document.getElementById('btnStepPrev');
    const nextBtn = document.getElementById('btnStepNext');
    const skipBtn = document.getElementById('btnStepSkip');

    prevBtn.style.visibility = BuildState.currentStep === 0 ? 'hidden' : 'visible';
    nextBtn.textContent       = BuildState.currentStep === BUILDER_STEPS.length - 1 ? '🎉 Finish Build' : 'Next →';
    nextBtn.disabled          = false; // Always allow forward navigation
    skipBtn.style.display     = step.optional ? 'block' : 'none';
}

function renderConflictAlert() {
    const conflicts = CompatibilityService.getBuildConflicts();
    const alertEl   = document.getElementById('conflictAlert');
    const descEl    = document.getElementById('conflictDesc');

    if (conflicts.length > 0) {
        descEl.textContent = conflicts.join(' · ');
        alertEl.classList.add('show');
    } else {
        alertEl.classList.remove('show');
    }
}

// ── Actions ──────────────────────────────────────────────────
function selectPart(stepKey, partId) {
    const part = PARTS.find(p => String(p.id) === String(partId));
    if (!part) return;

    // Toggle off if same part selected
    const current = BuildState.get(stepKey);
    if (current && (current.id === part.id || current.name === part.name)) {
        BuildState.clear(stepKey);
    } else {
        BuildState.set(stepKey, part);
    }

    renderWizard();
}

function goToStep(index) {
    if (index < 0 || index >= BUILDER_STEPS.length) return;
    BuildState.currentStep = index;
    renderStepContent();
    renderSidebar();
    // Scroll content to top
    const content = document.getElementById('builderContent');
    if (content) content.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function stepNext() {
    if (BuildState.currentStep < BUILDER_STEPS.length - 1) {
        goToStep(BuildState.currentStep + 1);
    } else {
        // Last step — attempt buy
        if (BuildState.isEssentialComplete()) {
            addBuildToCart();
        } else {
            showBuilderNotification('Please select at least CPU, Motherboard, RAM and GPU first.', 'error');
        }
    }
}

function stepPrev() {
    if (BuildState.currentStep > 0) {
        goToStep(BuildState.currentStep - 1);
    }
}

function stepSkip() {
    stepNext();
}

function clearBuild() {
    if (!confirm('Clear your entire build and start over?')) return;
    BuildState.clearAll();
    renderWizard();
    goToStep(0);
}

function addBuildToCart() {
    const parts = Object.values(BuildState.selections).filter(Boolean);
    if (parts.length === 0) return;

    parts.forEach(part => {
        if (typeof addToCart === 'function') {
            addToCart({ id: part.id, name: part.name, price: part.price, brand: part.brand, qty: 1 });
        } else {
            // Fallback: direct localStorage
            const cart = JSON.parse(localStorage.getItem('qb_cart') || '[]');
            const existing = cart.find(i => String(i.id) === String(part.id));
            if (!existing) {
                cart.push({ id: part.id, name: part.name, price: part.price, brand: part.brand, qty: 1 });
                localStorage.setItem('qb_cart', JSON.stringify(cart));
            }
        }
    });

    if (typeof updateCartCount === 'function') updateCartCount();

    // Show success overlay
    const overlay = document.getElementById('buildSuccessOverlay');
    document.getElementById('buildSuccessCount').textContent = parts.length;
    document.getElementById('buildSuccessTotal').textContent =
        `₹${BuildState.totalPrice().toLocaleString('en-IN')}`;
    overlay.classList.add('show');
}

function closeBuildSuccess(goCart) {
    document.getElementById('buildSuccessOverlay').classList.remove('show');
    if (goCart) window.location.href = 'cart.html';
}

// ── Notification helper ──────────────────────────────────────
function showBuilderNotification(msg, type = 'info') {
    if (typeof showNotification === 'function') {
        showNotification(msg, type);
        return;
    }
    alert(msg);
}

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    if (typeof PARTS === 'undefined') {
        console.warn('[Builder] PARTS not loaded.');
        return;
    }
    BuildState.clearAll();
    renderWizard();
});
