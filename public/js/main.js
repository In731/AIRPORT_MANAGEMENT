// Redirect to login if not authenticated
if (!sessionStorage.getItem('aero_auth_token') && window.location.pathname !== '/login.html') {
    window.location.href = '/login.html';
}

function logout() {
    sessionStorage.removeItem('aero_auth_token');
    sessionStorage.removeItem('aero_mng_id');
    window.location.href = '/login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    // Top bar clock
    setInterval(() => {
        const now = new Date();
        document.getElementById('date-time').textContent = now.toLocaleString('en-GB', { 
            day: '2-digit', month: 'short', year: 'numeric', 
            hour: '2-digit', minute: '2-digit', second: '2-digit' 
        });
    }, 1000);

    // Sidebar navigation
    document.querySelectorAll('.nav-item').forEach(el => {
        el.addEventListener('click', (e) => {
            const target = e.currentTarget.getAttribute('data-target');
            showSection(target);
        });
    });

    // Handle ESC key for modals and drawers
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none');
            document.querySelectorAll('.drawer').forEach(d => d.classList.remove('active'));
        }
    });

    // Handle click outside modal to close
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.style.display = 'none';
        });
    });

    // Check DB status
    checkDbStatus();

    // Show initial section
    showSection('flights');
});

// Toast container
const toastContainer = document.createElement('div');
toastContainer.className = 'toast-container';
document.body.appendChild(toastContainer);

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showSection(name) {
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    
    const sectionEl = document.getElementById(`section-${name}`);
    if (sectionEl) sectionEl.style.display = 'block';

    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.getAttribute('data-target') === name) {
            item.classList.add('active');
            document.getElementById('page-title').textContent = item.textContent.trim();
        } else {
            item.classList.remove('active');
        }
    });

    // Initialize section data
    if (name === 'flights' && typeof initFlights === 'function') initFlights();
    if (name === 'passengers' && typeof initPassengers === 'function') initPassengers();
    if (name === 'boarding' && typeof initBoarding === 'function') initBoarding();
    if (name === 'staff' && typeof initStaff === 'function') initStaff();
}

function showModal(id) { document.getElementById(id).style.display = 'flex'; }
function hideModal(id) { document.getElementById(id).style.display = 'none'; }
function showDrawer(id) { document.getElementById(id).classList.add('active'); }
function hideDrawer(id) { document.getElementById(id).classList.remove('active'); }

function showConfirm(title, message, onConfirm) {
    const modal = document.getElementById('modal-confirm');
    const confirmBtn = document.getElementById('confirm-btn');
    const titleEl = document.getElementById('confirm-title');
    const msgEl = document.getElementById('confirm-msg');

    titleEl.textContent = title || 'Are you sure?';
    msgEl.textContent = message || 'This action cannot be undone.';
    
    // Remove old listeners to avoid multiple fires
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    newConfirmBtn.addEventListener('click', () => {
        hideModal('modal-confirm');
        onConfirm();
    });

    showModal('modal-confirm');
}

function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = `<div class="spinner-container"><div class="spinner"></div></div>`;
}

function badgeHtml(status) {
    if (!status) return '';
    const text = status.toString();
    const green = ['On Time', 'Cleared', 'Present', 'Available', 'Valid', 'Active'];
    const amber = ['Delayed', 'Pending', 'Late', 'Expiring Soon', 'Under Maintenance'];
    const red   = ['Cancelled', 'Rejected', 'Absent', 'Occupied', 'Expired', 'Retired'];
    
    let cls = 'badge ';
    if (green.includes(text)) cls += 'green';
    else if (amber.includes(text)) cls += 'amber';
    else if (red.includes(text)) cls += 'red';
    else cls += 'amber'; // fallback

    return `<span class="${cls}">${text}</span>`;
}

function formatDateTime(isoString) {
    if (!isoString) return '';
    return new Date(isoString).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function emptyHtml(message) {
    return `
        <tr><td colspan="10">
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                <div style="font-size: 16px;">${message}</div>
            </div>
        </td></tr>
    `;
}

async function checkDbStatus() {
    const dot = document.getElementById('db-dot');
    const text = document.getElementById('db-text');
    try {
        const res = await fetch('/api/flights'); // Test endpoint
        if (res.ok) {
            dot.style.background = '#00C9A7';
            text.textContent = 'Oracle DB Connected';
            text.style.color = '#00C9A7';
        } else {
            throw new Error('Not OK');
        }
    } catch (err) {
        dot.style.background = '#E05252';
        text.textContent = 'DB Disconnected';
        text.style.color = '#E05252';
    }
}
