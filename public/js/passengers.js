let allPassengers = [];
let passengersEventsBound = false;

async function initPassengers() {
    await fetchNationalities();
    loadPassengers();

    if (!passengersEventsBound) {
        // Attach search
        document.getElementById('search-passengers').addEventListener('input', (e) => {
            renderPassengersTable(e.target.value);
        });

        // Form submit
        document.getElementById('form-passenger').addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitPassenger();
        });
        passengersEventsBound = true;
    }
}

function initPassengerModal() {
    document.getElementById('form-passenger').reset();
    showPassengerStep(1);
    showModal('modal-passenger');
}

function showPassengerStep(step) {
    document.getElementById('p-step-1').className = step >= 1 ? 'step active' : 'step';
    document.getElementById('p-step-2').className = step >= 2 ? 'step active' : 'step';
    
    document.getElementById('passenger-part-1').style.display = step === 1 ? 'grid' : 'none';
    document.getElementById('passenger-part-2').style.display = step === 2 ? 'grid' : 'none';
}

function nextPassengerStep() {
    // Basic validation of step 1
    const reqFields = ['p_first_name', 'p_last_name', 'p_dob', 'p_phone', 'p_email', 'p_nationality'];
    let valid = true;
    reqFields.forEach(id => {
        if (!document.getElementById(id).value) valid = false;
    });
    
    if (valid) showPassengerStep(2);
    else showToast('Please fill all required fields in Step 1', 'warning');
}

function prevPassengerStep() {
    showPassengerStep(1);
}

async function fetchNationalities() {
    try {
        const res = await fetch('/api/passengers/nationalities/all');
        const data = await res.json();
        const sel = document.getElementById('filter-pass-nationality');
        sel.innerHTML = '<option value="All">All Nationalities</option>' + 
            data.map(n => `<option value="${n.NATIONALITY}">${n.NATIONALITY}</option>`).join('');
    } catch (err) {
        console.error('Error fetching nationalities', err);
    }
}

async function loadPassengers() {
    showLoading('passenger-tbody');
    try {
        const type = document.getElementById('filter-pass-type')?.value || 'All';
        const status = document.getElementById('filter-pass-status')?.value || 'All';
        const passStatus = document.getElementById('filter-pass-pass-status')?.value || 'All';
        const nationality = document.getElementById('filter-pass-nationality')?.value || 'All';
        
        const res = await fetch(`/api/passengers?type=${encodeURIComponent(type)}&status=${encodeURIComponent(status)}&pass_status=${encodeURIComponent(passStatus)}&nationality=${encodeURIComponent(nationality)}`);
        allPassengers = await res.json();
        renderPassengerStats();
        renderPassengersTable('');
    } catch (err) {
        console.error(err);
        showToast('Failed to load passengers', 'error');
        document.getElementById('passenger-tbody').innerHTML = emptyHtml('Error loading passengers.');
    }
}

function renderPassengerStats() {
    const total = allPassengers.length;
    const validPassports = allPassengers.filter(p => p.PASSPORT_STATUS === 'Valid').length;
    const expiringSoon = allPassengers.filter(p => p.PASSPORT_STATUS === 'Expiring Soon').length;
    const immRecords = allPassengers.filter(p => p.IMMIGRATION_STATUS).length;

    document.getElementById('passenger-stats').innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${total}</div>
            <div class="stat-label">Total Passengers</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" style="color: #00C9A7">${validPassports}</div>
            <div class="stat-label">Valid Passports</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" style="color: #F0A500">${expiringSoon}</div>
            <div class="stat-label">Expiring Soon</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${immRecords}</div>
            <div class="stat-label">Immigration Records</div>
        </div>
    `;
}

function renderPassengersTable(filter) {
    const tbody = document.getElementById('passenger-tbody');
    const term = filter.toLowerCase();
    
    const filtered = allPassengers.filter(p => 
        (p.FULL_NAME || '').toLowerCase().includes(term) ||
        (p.PASSPORT_NUMBER || '').toLowerCase().includes(term) ||
        (p.NATIONALITY || '').toLowerCase().includes(term)
    );

    if (filtered.length === 0) {
        tbody.innerHTML = emptyHtml('No passengers found.');
        return;
    }

    tbody.innerHTML = filtered.map(p => {
        return `
            <tr>
                <td><strong>${p.FULL_NAME}</strong></td>
                <td>${p.GENDER || '-'}</td>
                <td>${p.NATIONALITY || '-'}</td>
                <td>${p.PASSPORT_NUMBER || 'No Record'}</td>
                <td>${p.PASSPORT_TYPE || '-'}</td>
                <td>${badgeHtml(p.PASSPORT_STATUS)}</td>
                <td>${badgeHtml(p.IMMIGRATION_STATUS || 'Unknown')}</td>
                <td>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-ghost" onclick="loadPassengerDetail(${p.PASSENGER_ID})">Details</button>
                        <button class="btn-delete" onclick="deletePassenger(${p.PASSENGER_ID}, '${p.FULL_NAME.replace(/'/g, "\\'")}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function submitPassenger() {
    const payload = {
        firstName: document.getElementById('p_first_name').value,
        lastName: document.getElementById('p_last_name').value,
        gender: document.getElementById('p_gender').value,
        dob: document.getElementById('p_dob').value,
        phone: document.getElementById('p_phone').value,
        email: document.getElementById('p_email').value,
        nationality: document.getElementById('p_nationality').value,
        passportNumber: document.getElementById('p_passport_no').value,
        countryOfIssue: document.getElementById('p_country_issue').value,
        issueDate: document.getElementById('p_issue_date').value,
        expiryDate: document.getElementById('p_expiry_date').value,
        passportType: document.getElementById('p_passport_type').value
    };

    try {
        const res = await fetch('/api/passengers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            showToast('Passenger added successfully');
            hideModal('modal-passenger');
            loadPassengers();
        } else {
            const data = await res.json();
            showToast(data.error || 'Failed to add passenger', 'error');
        }
    } catch (err) {
        showToast('Error adding passenger', 'error');
    }
}

async function loadPassengerDetail(id) {
    showDrawer('drawer-passenger');
    const content = document.getElementById('drawer-passenger-content');
    content.innerHTML = `<div class="spinner-container"><div class="spinner"></div></div>`;
    
    try {
        const res = await fetch(`/api/passengers/${id}`);
        if (!res.ok) throw new Error('Failed to load profile');
        const p = await res.json();

        content.innerHTML = `
            <div class="drawer-profile-head">
                <h2>${p.FULL_NAME}</h2>
                <div>${badgeHtml(p.NATIONALITY)}</div>
            </div>
            
            <div style="background: rgba(255,255,255,0.03); padding: 16px; border-radius: 8px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px;">
                    <div><span style="color:#A8B2BC">Gender:</span> <br>${p.GENDER || '-'}</div>
                    <div><span style="color:#A8B2BC">DOB:</span> <br>${p.DATE_OF_BIRTH ? new Date(p.DATE_OF_BIRTH).toLocaleDateString() : '-'}</div>
                    <div><span style="color:#A8B2BC">Phone:</span> <br>${p.PHONE_NUMBER || '-'}</div>
                    <div><span style="color:#A8B2BC">Email:</span> <br>${p.EMAIL || '-'}</div>
                </div>
            </div>

            <h3 style="margin-top: 10px; font-size: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">Passport Info</h3>
            <div style="background: rgba(255,255,255,0.03); padding: 16px; border-radius: 8px; border-left: 3px solid #00C9A7;">
                <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">${p.PASSPORT_NUMBER || '-'}</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px;">
                    <div><span style="color:#A8B2BC">Type:</span> <br>${p.PASSPORT_TYPE || '-'}</div>
                    <div><span style="color:#A8B2BC">Country:</span> <br>${p.COUNTRY_OF_ISSUE || '-'}</div>
                    <div><span style="color:#A8B2BC">Issue:</span> <br>${p.ISSUE_DATE ? new Date(p.ISSUE_DATE).toLocaleDateString() : '-'}</div>
                    <div><span style="color:#A8B2BC">Expiry:</span> <br>${p.EXPIRY_DATE ? new Date(p.EXPIRY_DATE).toLocaleDateString() : '-'}</div>
                    <div style="grid-column: span 2;">${badgeHtml(p.PASSPORT_STATUS)}</div>
                </div>
            </div>

            <h3 style="margin-top: 10px; font-size: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">Immigration Record</h3>
            ${p.IMMIGRATION_STATUS ? `
                <div style="background: rgba(255,255,255,0.03); padding: 16px; border-radius: 8px;">
                    <div style="margin-bottom: 8px;">
                        <span style="background: #2A3F52; padding: 2px 6px; border-radius: 4px; font-size: 12px;">${p.MOVEMENT_TYPE}</span>
                        <span style="float: right; color:#A8B2BC; font-size: 12px;">${p.ENTRY_DATE ? new Date(p.ENTRY_DATE).toLocaleDateString() : ''}</span>
                    </div>
                    <div style="font-size: 14px; margin-bottom: 12px;">
                        ${p.FROM_COUNTRY} &rarr; ${p.TO_COUNTRY}
                    </div>
                    <div>${badgeHtml(p.IMMIGRATION_STATUS)}</div>
                </div>
            ` : '<div style="color:#A8B2BC; font-size:14px;">No immigration records found.</div>'}
        `;
    } catch (err) {
        content.innerHTML = `<div style="color:#E05252">Error loading profile data.</div>`;
    }
}

async function deletePassenger(id, name) {
    showConfirm(
        'Delete Passenger?',
        `Are you sure you want to permanently delete passenger ${name}? This will cascade and delete their passport, immigration records, and boarding passes.`,
        async () => {
            try {
                const res = await fetch(`/api/passengers/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    showToast(`Passenger ${name} deleted`);
                    loadPassengers();
                } else {
                    const data = await res.json();
                    showToast(data.error || 'Failed to delete passenger', 'error');
                }
            } catch (err) {
                showToast('Error deleting passenger', 'error');
            }
        }
    );
}
