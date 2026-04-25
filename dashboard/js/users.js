// ============================================================
// QUANTUM BUILD — Users Panel
// List, search, toggle admin role, delete users
// ============================================================

let allUsers = [];
let filteredUsers = [];
let userSearchTerm = '';
let usersLoaded = false;

// ── Load Users ────────────────────────────────────────────
async function loadUsersPanel(force = false) {
    if (usersLoaded && !force) return;
    usersLoaded = true;

    const tbody = document.getElementById('usersTbody');
    tbody.innerHTML = `<tr><td colspan="5"><div class="loading-state"><span class="spinner spinner-lg"></span> Loading users...</div></td></tr>`;

    try {
        allUsers = await apiGetUsers();

        document.getElementById('usersSubtitle').textContent =
            `${allUsers.length} registered account${allUsers.length !== 1 ? 's' : ''}`;

        // Init search
        const searchInput = document.getElementById('userSearch');
        searchInput.removeEventListener('input', onUserSearch);
        searchInput.addEventListener('input', onUserSearch);

        applyUserFilters();

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5">
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <div class="empty-state-text">${err.message}</div>
            </div>
        </td></tr>`;
        notify('Failed to load users: ' + err.message, 'error');
    }
}

function onUserSearch(e) {
    userSearchTerm = e.target.value.toLowerCase().trim();
    applyUserFilters();
}

function applyUserFilters() {
    filteredUsers = allUsers.filter(u => {
        if (!userSearchTerm) return true;
        return u.name.toLowerCase().includes(userSearchTerm) ||
               u.email.toLowerCase().includes(userSearchTerm);
    });

    document.getElementById('usersSubtitle').textContent =
        `Showing ${filteredUsers.length} of ${allUsers.length} user${allUsers.length !== 1 ? 's' : ''}`;

    renderUsersTable();
}

function renderUsersTable() {
    const tbody = document.getElementById('usersTbody');
    const currentUser = getCurrentUser();

    if (!filteredUsers.length) {
        tbody.innerHTML = `<tr><td colspan="5">
            <div class="empty-state">
                <div class="empty-state-icon">👥</div>
                <div class="empty-state-text">No users found</div>
            </div>
        </td></tr>`;
        return;
    }

    tbody.innerHTML = filteredUsers.map(u => {
        const isSelf = currentUser && u._id === currentUser._id;
        const roleBadge = u.isAdmin
            ? `<span class="badge badge-admin">⚡ Admin</span>`
            : `<span class="badge badge-user">User</span>`;

        // Avatar initial
        const initial = u.name.charAt(0).toUpperCase();
        const avatarColor = u.isAdmin ? 'var(--accent-red)' : 'var(--accent-purple)';

        const actions = isSelf
            ? `<span style="color:var(--text-muted);font-size:0.78rem;font-style:italic;">You</span>`
            : `
                <div class="table-actions">
                    <button class="btn btn-secondary btn-sm" onclick="toggleUserAdmin('${u._id}', ${u.isAdmin}, '${u.name.replace(/'/g, '\\\'').replace(/"/g, '&quot;')}')">
                        ${u.isAdmin ? '↓ Revoke Admin' : '↑ Make Admin'}
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteUserAdmin('${u._id}', '${u.name.replace(/'/g, '\\\'').replace(/"/g, '&quot;')}')">
                        🗑
                    </button>
                </div>
            `;

        return `
            <tr>
                <td>
                    <div style="display:flex;align-items:center;gap:12px;">
                        <div style="
                            width:36px;height:36px;border-radius:50%;
                            background:${avatarColor};opacity:0.85;
                            display:flex;align-items:center;justify-content:center;
                            font-family:var(--font-heading);font-weight:700;font-size:1rem;color:#fff;
                            flex-shrink:0;
                        ">${initial}</div>
                        <div>
                            <div style="font-weight:500;color:var(--text-primary);">
                                ${u.name}
                                ${isSelf ? '<span style="font-size:0.65rem;color:var(--accent-red);margin-left:4px;">(You)</span>' : ''}
                            </div>
                            <div style="font-size:0.72rem;color:var(--text-muted);">ID: ${u._id.slice(-8)}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <a href="mailto:${u.email}" style="color:var(--text-secondary);transition:color 0.15s;"
                       onmouseover="this.style.color='var(--accent-red)'"
                       onmouseout="this.style.color='var(--text-secondary)'">${u.email}</a>
                </td>
                <td>${roleBadge}</td>
                <td style="color:var(--text-muted);font-size:0.82rem;">${formatDate(u.createdAt)}</td>
                <td>${actions}</td>
            </tr>
        `;
    }).join('');
}

// ── Toggle Admin Role ─────────────────────────────────────
function toggleUserAdmin(id, isCurrentlyAdmin, name) {
    const action = isCurrentlyAdmin ? 'revoke admin privileges from' : 'grant admin privileges to';
    qbConfirm(
        `Are you sure you want to ${action} "${name}"?`,
        isCurrentlyAdmin ? 'Revoke Admin' : 'Grant Admin',
        async () => {
            try {
                await apiUpdateUser(id, { isAdmin: !isCurrentlyAdmin });
                notify(`Admin role ${isCurrentlyAdmin ? 'revoked from' : 'granted to'} ${name}`, 'success');
                usersLoaded = false;
                await loadUsersPanel(true);
            } catch (err) {
                notify('Failed to update user: ' + err.message, 'error');
            }
        }
    );
}

// ── Delete User ───────────────────────────────────────────
function deleteUserAdmin(id, name) {
    qbConfirm(
        `Delete user "${name}"? All their data will be removed permanently.`,
        'Delete User',
        async () => {
            try {
                await apiDeleteUser(id);
                notify(`User "${name}" deleted`, 'success');
                usersLoaded = false;
                await loadUsersPanel(true);
                overviewLoaded = false;
            } catch (err) {
                notify('Failed to delete user: ' + err.message, 'error');
            }
        }
    );
}
