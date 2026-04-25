// ============================================================
// QUANTUM BUILD — Products Panel
// Full CRUD: list, search, filter, create, edit, delete
// + Cloudinary image upload
// ============================================================

let allProducts = [];
let filteredProducts = [];
let productCurrentPage = 1;
const PRODUCTS_PER_PAGE = 12;
let productCategoryFilter = '';
let productSearchTerm = '';
let productsLoaded = false;

// ── Image Upload Helpers ──────────────────────────────────

function resolveImageUrl(url) {
    if (!url) return url;
    if (/^https?:\/\//i.test(url)) return url;
    return `${window.location.protocol}//${window.location.host}${url.startsWith('/') ? '' : '/'}${url}`;
}

function setProductImage(url) {
    document.getElementById('productImage').value = url;
    const wrap = document.getElementById('imagePreviewWrap');
    const img  = document.getElementById('imagePreview');
    if (url) {
        img.src = resolveImageUrl(url);
        wrap.style.display = 'block';
        // Collapse the drop zone when an image is set
        document.getElementById('imageDropZone').style.display = 'none';
    } else {
        wrap.style.display = 'none';
        document.getElementById('imageDropZone').style.display = '';
    }
}

function clearProductImage() {
    document.getElementById('productImage').value = '';
    document.getElementById('imagePreview').src = '';
    document.getElementById('imagePreviewWrap').style.display = 'none';
    document.getElementById('imageDropZone').style.display = '';
    const urlInput = document.getElementById('productImageUrlInput');
    if (urlInput) urlInput.value = '';
    resetDropZoneContent();
}

function resetImageUploadUI() {
    clearProductImage();
    // Hide paste URL panel
    const pasteWrap = document.getElementById('pasteUrlWrap');
    if (pasteWrap) pasteWrap.style.display = 'none';
    const urlInput = document.getElementById('productImageUrlInput');
    if (urlInput) urlInput.value = '';
}

function resetDropZoneContent() {
    const statusDiv = document.getElementById('uploadStatusInZone');
    const contentDiv = document.getElementById('dropZoneContent');
    if (statusDiv) { statusDiv.style.display = 'none'; statusDiv.innerHTML = ''; }
    if (contentDiv) contentDiv.style.display = '';
    const zone = document.getElementById('imageDropZone');
    if (zone) zone.classList.remove('drag-over');
}

function setDropZoneStatus(html, color = 'var(--text-secondary)') {
    const statusDiv = document.getElementById('uploadStatusInZone');
    const contentDiv = document.getElementById('dropZoneContent');
    if (statusDiv) {
        statusDiv.innerHTML = `<div style="color:${color};font-size:0.85rem;padding:4px 0;">${html}</div>`;
        statusDiv.style.display = '';
    }
    if (contentDiv) contentDiv.style.display = 'none';
}

async function handleImageFile(file) {
    if (!file) return;

    const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!ALLOWED.includes(file.type)) {
        setDropZoneStatus('⚠️ Only JPG, PNG, or WebP images are allowed', 'var(--status-danger)');
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        setDropZoneStatus('⚠️ Image must be under 5 MB', 'var(--status-danger)');
        return;
    }

    setDropZoneStatus('<span class="spinner" style="width:14px;height:14px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:6px;"></span> Uploading to Cloudinary...', 'var(--accent-blue)');

    const formData = new FormData();
    formData.append('image', file);
    const token = getToken();

    try {
        const res = await fetch(`${API_BASE}/upload/image`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Upload failed');
        }
        const data = await res.json();
        const url = data.imageUrl || data.url || data.secure_url;
        setProductImage(url);
        resetDropZoneContent(); // drop zone is hidden now; reset for future clears
    } catch (err) {
        setDropZoneStatus('⚠️ ' + err.message, 'var(--status-danger)');
    }
}

function handleImageDrop(e) {
    e.preventDefault();
    document.getElementById('imageDropZone').classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file);
}

function togglePasteUrl() {
    const wrap = document.getElementById('pasteUrlWrap');
    wrap.style.display = wrap.style.display === 'none' ? 'block' : 'none';
    if (wrap.style.display === 'block') {
        document.getElementById('productImageUrlInput')?.focus();
    }
}

function applyPastedUrl(val) {
    const url = val.trim();
    if (url) {
        document.getElementById('productImage').value = url;
        const img = document.getElementById('imagePreview');
        const wrap = document.getElementById('imagePreviewWrap');
        img.src = resolveImageUrl(url);
        wrap.style.display = 'block';
        document.getElementById('imageDropZone').style.display = 'none';
    } else {
        clearProductImage();
    }
}

// ── Gallery Image State ───────────────────────────────────
// galleryImages = [{ url, publicId }]
let galleryImages = [];
const MAX_GALLERY = 5;

function renderGalleryGrid() {
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;

    grid.innerHTML = galleryImages.map((img, i) => `
        <div style="position:relative;aspect-ratio:1;border-radius:8px;overflow:hidden;
                    border:1px solid var(--border);background:var(--bg-secondary);">
            <img src="${resolveImageUrl(img.url)}" alt="Gallery ${i+1}"
                 style="width:100%;height:100%;object-fit:cover;"
                 onerror="this.style.opacity='0.3'">
            <button type="button" onclick="removeGalleryImage(${i})"
                    style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.75);
                           border:none;color:#fff;border-radius:50%;width:22px;height:22px;
                           cursor:pointer;font-size:0.75rem;line-height:1;display:flex;
                           align-items:center;justify-content:center;">✕</button>
        </div>
    `).join('');

    // Show empty slot hint if under max
    if (galleryImages.length < MAX_GALLERY) {
        const remaining = MAX_GALLERY - galleryImages.length;
        grid.innerHTML += `
            <div onclick="document.getElementById('galleryFileInput').click()"
                 style="aspect-ratio:1;border:2px dashed var(--border-color);border-radius:8px;
                        display:flex;flex-direction:column;align-items:center;justify-content:center;
                        cursor:pointer;color:var(--text-muted);font-size:0.65rem;text-align:center;
                        gap:4px;transition:all 0.2s;"
                 onmouseover="this.style.borderColor='var(--border-hover)'"
                 onmouseout="this.style.borderColor='var(--border-color)'">
                <span style="font-size:1.2rem;">＋</span>
                <span>${remaining} slot${remaining>1?'s':''} left</span>
            </div>`;
    }
}

function removeGalleryImage(index) {
    galleryImages.splice(index, 1);
    renderGalleryGrid();
}

async function handleGalleryFiles(fileList) {
    if (!fileList || fileList.length === 0) return;

    const slots = MAX_GALLERY - galleryImages.length;
    if (slots <= 0) {
        notify(`Gallery is full (max ${MAX_GALLERY} images)`, 'warning');
        return;
    }

    const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const files = Array.from(fileList).slice(0, slots).filter(f => {
        if (!ALLOWED.includes(f.type)) { notify(`Skipped "${f.name}": not a valid image type`, 'warning'); return false; }
        if (f.size > 5 * 1024 * 1024) { notify(`Skipped "${f.name}": exceeds 5 MB`, 'warning'); return false; }
        return true;
    });

    if (!files.length) return;

    const statusEl = document.getElementById('galleryUploadStatus');
    statusEl.style.display = '';
    statusEl.innerHTML = `<span class="spinner" style="width:12px;height:12px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:6px;"></span> Uploading ${files.length} image${files.length>1?'s':''}...`;

    const formData = new FormData();
    files.forEach(f => formData.append('images', f));
    const token = getToken();

    try {
        const res = await fetch(`${API_BASE}/upload/images`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Upload failed');
        }
        const data = await res.json();
        data.images.forEach(img => {
            if (galleryImages.length < MAX_GALLERY) {
                galleryImages.push({ url: img.imageUrl, publicId: img.publicId });
            }
        });
        renderGalleryGrid();
        statusEl.style.display = 'none';
        notify(`${data.images.length} image${data.images.length>1?'s':''} added to gallery`, 'success');
    } catch (err) {
        statusEl.textContent = '⚠️ ' + err.message;
        statusEl.style.color = 'var(--status-danger)';
    }

    // Reset file input so same files can be re-selected
    document.getElementById('galleryFileInput').value = '';
}

function resetImageUploadUI() {
    clearProductImage();
    galleryImages = [];
    renderGalleryGrid();
    const pasteWrap = document.getElementById('pasteUrlWrap');
    if (pasteWrap) pasteWrap.style.display = 'none';
    const urlInput = document.getElementById('productImageUrlInput');
    if (urlInput) urlInput.value = '';
    const statusEl = document.getElementById('galleryUploadStatus');
    if (statusEl) { statusEl.style.display = 'none'; statusEl.textContent = ''; }
}

// ── Load Products ─────────────────────────────────────────
async function loadProductsPanel(force = false) {
    if (productsLoaded && !force) return;
    productsLoaded = true;

    const tbody = document.getElementById('productsTbody');
    tbody.innerHTML = `<tr><td colspan="6"><div class="loading-state"><span class="spinner spinner-lg"></span> Loading products...</div></td></tr>`;

    try {
        const data = await apiGetProducts({ pageSize: 100 });
        allProducts = data.products || data || [];

        document.getElementById('navBadgeProducts').textContent = allProducts.length;

        // Load categories for chips
        await loadCategoryChips();

        // Init search
        const searchInput = document.getElementById('productSearch');
        searchInput.removeEventListener('input', onProductSearch);
        searchInput.addEventListener('input', onProductSearch);

        applyProductFilters();

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-text">${err.message}</div></div></td></tr>`;
        notify('Failed to load products: ' + err.message, 'error');
    }
}

function onProductSearch(e) {
    productSearchTerm = e.target.value.toLowerCase().trim();
    productCurrentPage = 1;
    applyProductFilters();
}

async function loadCategoryChips() {
    const chipsContainer = document.getElementById('categoryChips');
    chipsContainer.innerHTML = `
        <span class="chip active" data-cat="">All</span>
        <span class="chip" data-cat="Gaming PC">Gaming PC</span>
        <span class="chip" data-cat="PC parts">PC parts</span>
    `;

    chipsContainer.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
            chipsContainer.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            productCategoryFilter = chip.dataset.cat;
            productCurrentPage = 1;
            applyProductFilters();
        });
    });
}

function applyProductFilters() {
    filteredProducts = allProducts.filter(p => {
        let isGamingPC = (p.category === 'Gaming PC' || p.category === 'PC' || p.partCategory === 'pc');
        let resolvedCat = isGamingPC ? 'Gaming PC' : 'PC parts';
        
        const matchCat = !productCategoryFilter || resolvedCat === productCategoryFilter;
        const matchSearch = !productSearchTerm ||
            p.name.toLowerCase().includes(productSearchTerm) ||
            (p.brand || '').toLowerCase().includes(productSearchTerm) ||
            (p.category || '').toLowerCase().includes(productSearchTerm);
        return matchCat && matchSearch;
    });

    // Default Sort: By Category recursively, then by Product Name
    filteredProducts.sort((a, b) => {
        let catA = (a.partCategory || a.category || '').toLowerCase();
        let catB = (b.partCategory || b.category || '').toLowerCase();
        if (catA !== catB) return catA.localeCompare(catB);
        return (a.name || '').localeCompare(b.name || '');
    });

    const total = filteredProducts.length;
    document.getElementById('productsSubtitle').textContent =
        `Showing ${Math.min(PRODUCTS_PER_PAGE, total)} of ${total} product${total !== 1 ? 's' : ''}`;

    renderProductsTable();
    renderProductsPagination();
}

function renderProductsTable() {
    const tbody = document.getElementById('productsTbody');
    const start = (productCurrentPage - 1) * PRODUCTS_PER_PAGE;
    const pageProducts = filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);

    if (!pageProducts.length) {
        tbody.innerHTML = `<tr><td colspan="6">
            <div class="empty-state">
                <div class="empty-state-icon">📦</div>
                <div class="empty-state-text">No products found</div>
            </div>
        </td></tr>`;
        return;
    }

    tbody.innerHTML = pageProducts.map(p => {
        const thumb = p.image
            ? `<img src="${resolveImageUrl(p.image)}" alt="${p.name}" class="product-thumb" onerror="this.style.display='none'">`
            : `<div class="product-thumb flex-center" style="font-size:1.2rem;">📦</div>`;

        let isGamingPC = (p.category === 'Gaming PC' || p.category === 'PC' || p.partCategory === 'pc');
        let cat = isGamingPC ? 'Gaming PC' : 'PC parts';
        const stars = '★'.repeat(Math.round(p.rating || 0)) + '☆'.repeat(5 - Math.round(p.rating || 0));
        const isChecked = typeof selectedProductIds !== 'undefined' && selectedProductIds.has(p._id);

        return `
            <tr>
                <td style="width:36px;text-align:center;">
                    <input type="checkbox" class="product-row-checkbox" data-id="${p._id}"
                           ${isChecked ? 'checked' : ''}
                           onchange="onProductCheckboxChange(this)">
                </td>
                <td>
                    <div class="product-cell">
                        ${thumb}
                        <div>
                            <div class="product-name" title="${p.name}">${p.name}</div>
                            <div class="product-brand">${p.brand || ''}</div>
                        </div>
                    </div>
                </td>
                <td><span class="badge badge-user" style="text-transform:capitalize;">${cat}</span></td>
                <td>
                    <div style="font-weight:600;color:var(--text-primary);">${formatPrice(p.price)}</div>
                    ${p.originalPrice ? `<div style="font-size:0.72rem;color:var(--text-muted);text-decoration:line-through;">${formatPrice(p.originalPrice)}</div>` : ''}
                </td>
                <td>${getStockBadge(p.countInStock)}</td>
                <td>
                    <span style="color:var(--accent-amber);font-size:0.8rem;">${stars}</span>
                    <span style="font-size:0.72rem;color:var(--text-muted);"> (${p.numReviews || 0})</span>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-secondary btn-sm" onclick="openProductModal('${p._id}')" title="Edit product">✏️ Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteProduct('${p._id}', '${p.name.replace(/'/g, '\\\'').replace(/"/g, '&quot;')}')" title="Delete product">🗑</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderProductsPagination() {
    const pagination = document.getElementById('productsPagination');
    const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);

    if (totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }

    pagination.style.display = 'flex';
    document.getElementById('productsPageInfo').textContent =
        `Page ${productCurrentPage} of ${totalPages}`;

    const btnsContainer = document.getElementById('productsPaginationBtns');
    btnsContainer.innerHTML = '';

    // Prev
    const prevBtn = createPageBtn('‹', productCurrentPage === 1, () => {
        productCurrentPage--;
        renderProductsTable();
        renderProductsPagination();
    });
    btnsContainer.appendChild(prevBtn);

    // Pages
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || Math.abs(i - productCurrentPage) <= 1) {
            const btn = createPageBtn(i, false, () => {
                productCurrentPage = i;
                renderProductsTable();
                renderProductsPagination();
            });
            if (i === productCurrentPage) btn.classList.add('current');
            btnsContainer.appendChild(btn);
        } else if (Math.abs(i - productCurrentPage) === 2) {
            const dots = document.createElement('span');
            dots.textContent = '…';
            dots.style.padding = '5px 4px';
            dots.style.color = 'var(--text-muted)';
            dots.style.fontSize = '0.78rem';
            btnsContainer.appendChild(dots);
        }
    }

    // Next
    const nextBtn = createPageBtn('›', productCurrentPage === totalPages, () => {
        productCurrentPage++;
        renderProductsTable();
        renderProductsPagination();
    });
    btnsContainer.appendChild(nextBtn);
}

function createPageBtn(label, disabled, onClick) {
    const btn = document.createElement('button');
    btn.className = 'pagination-btn';
    btn.textContent = label;
    btn.disabled = disabled;
    btn.addEventListener('click', onClick);
    return btn;
}

// ── Product Modal ─────────────────────────────────────────
async function openProductModal(productId = null) {
    const overlay = document.getElementById('productModalOverlay');
    const titleEl = document.getElementById('productModalTitle');
    const form = document.getElementById('productForm');
    const errorEl = document.getElementById('productFormError');

    form.reset();
    errorEl.classList.remove('visible');
    document.getElementById('productId').value = '';

    // Reset image UI first
    resetImageUploadUI();

    if (productId) {
        titleEl.textContent = 'Edit Product';
        try {
            const p = await apiGetProduct(productId);
            document.getElementById('productId').value = p._id;
            document.getElementById('productName').value = p.name || '';
            document.getElementById('productBrand').value = p.brand || '';
            document.getElementById('productCategory').value = p.category || '';
            document.getElementById('productPartCategory').value = p.partCategory || '';
            document.getElementById('productPrice').value = p.price || '';
            document.getElementById('productOriginalPrice').value = p.originalPrice || '';
            document.getElementById('productStock').value = p.countInStock ?? '';
            document.getElementById('productBadge').value = p.badge || '';
            document.getElementById('productDescription').value = p.description || '';
            document.getElementById('productSpecs').value = p.specifications || '';
            document.getElementById('productCompat').value = p.compatibility || '';
            // Pre-fill primary image
            if (p.image) setProductImage(p.image);
            // Pre-fill gallery
            if (Array.isArray(p.images) && p.images.length) {
                galleryImages = p.images.map((url, i) => ({
                    url,
                    publicId: (p.cloudinaryPublicIds || [])[i] || null,
                }));
                renderGalleryGrid();
            }
        } catch (err) {
            notify('Failed to load product: ' + err.message, 'error');
            return;
        }
    } else {
        titleEl.textContent = 'Add New Product';
    }

    overlay.classList.add('open');
}

function closeProductModal() {
    document.getElementById('productModalOverlay').classList.remove('open');
}

// Close on overlay click + global paste handler
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('productModalOverlay');

    overlay.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeProductModal();
    });

    // ── Clipboard Paste Handler ──────────────────────────────
    // Works anywhere while the product modal is open.
    // Handles two cases:
    //   1. Pasted image data (screenshot, copied image file) → upload to Cloudinary
    //   2. Pasted text that looks like an image URL → set as primary image URL
    document.addEventListener('paste', async (e) => {
        // Only act when the product modal is open
        if (!overlay.classList.contains('open')) return;

        // Don't intercept normal text input paste events (name, description, etc.)
        const tag = document.activeElement?.tagName?.toLowerCase();
        const isTextInput = (tag === 'input' && document.activeElement.type !== 'hidden') || tag === 'textarea';

        const items = e.clipboardData?.items || [];

        // Case 1: clipboard contains an image file (screenshot / Ctrl+C on image)
        const imageItem = Array.from(items).find(item => item.type.startsWith('image/'));
        if (imageItem) {
            // Don't block normal typing
            e.preventDefault();
            const file = imageItem.getAsFile();
            if (file) {
                notify('📋 Image detected — uploading from clipboard...', 'info');
                await handleImageFile(file);
            }
            return;
        }

        // Case 2: clipboard contains text — check if it's an image URL
        if (!isTextInput) {
            const textItem = Array.from(items).find(item => item.type === 'text/plain');
            if (textItem) {
                textItem.getAsString((text) => {
                    const url = text.trim();
                    const isUrl = /^https?:\/\//i.test(url);
                    const looksLikeImage = /\.(jpe?g|png|webp|gif|svg|avif|bmp)(\?.*)?$/i.test(url) || isUrl;
                    if (looksLikeImage) {
                        e.preventDefault();
                        applyPastedUrl(url);
                        // Show the paste URL field with the value
                        const pasteWrap = document.getElementById('pasteUrlWrap');
                        const urlInput = document.getElementById('productImageUrlInput');
                        if (pasteWrap) pasteWrap.style.display = 'block';
                        if (urlInput) urlInput.value = url;
                        notify('📋 Image URL pasted', 'success');
                    }
                });
            }
        }
    });
});


async function saveProduct() {
    const id = document.getElementById('productId').value;
    const saveBtn = document.getElementById('saveProductBtn');
    const errorEl = document.getElementById('productFormError');

    const name = document.getElementById('productName').value.trim();
    const brand = document.getElementById('productBrand').value.trim();
    const category = document.getElementById('productCategory').value.trim();
    const partCategory = document.getElementById('productPartCategory').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const originalPrice = parseFloat(document.getElementById('productOriginalPrice').value) || undefined;
    const countInStock = parseInt(document.getElementById('productStock').value);
    const badge = document.getElementById('productBadge').value.trim() || undefined;
    const image = document.getElementById('productImage').value.trim();
    const description = document.getElementById('productDescription').value.trim();
    const specifications = document.getElementById('productSpecs').value.trim() || undefined;
    const compatibility = document.getElementById('productCompat').value.trim() || undefined;

    // Validate
    if (!name || !brand || !category || isNaN(price) || isNaN(countInStock) || !image || !description) {
        errorEl.textContent = 'Please fill in all required fields.';
        errorEl.classList.add('visible');
        return;
    }

    errorEl.classList.remove('visible');
    saveBtn.disabled = true;
    const origText = saveBtn.textContent;
    saveBtn.innerHTML = '<span class="spinner" style="width:14px;height:14px;border-width:2px;"></span> Saving...';

    try {
        const images             = galleryImages.map(g => g.url);
        const cloudinaryPublicIds = galleryImages.map(g => g.publicId).filter(Boolean);

        const body = { name, brand, category, partCategory, price, originalPrice, countInStock, badge, image, description, specifications, compatibility, images, cloudinaryPublicIds };

        if (id) {
            await apiUpdateProduct(id, body);
            notify('Product updated successfully!', 'success');
        } else {
            await apiCreateProduct(body);
            notify('Product created successfully!', 'success');
        }

        closeProductModal();
        productsLoaded = false;
        await loadProductsPanel(true);
        overviewLoaded = false;

    } catch (err) {
        errorEl.textContent = err.message;
        errorEl.classList.add('visible');
        notify('Save failed: ' + err.message, 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = origText;
    }
}

// ── Delete Product ────────────────────────────────────────
function deleteProduct(id, name) {
    qbConfirm(
        `Delete "${name}"? This action cannot be undone.`,
        'Delete Product',
        async () => {
            try {
                await apiDeleteProduct(id);
                notify('Product deleted successfully', 'success');
                productsLoaded = false;
                await loadProductsPanel(true);
                overviewLoaded = false;
            } catch (err) {
                notify('Delete failed: ' + err.message, 'error');
            }
        }
    );
}
