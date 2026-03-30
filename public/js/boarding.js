let allBoarding = [];
let boardingEventsBound = false;

async function initBoarding() {
    await Promise.all([
        fetchDropdowns(),
        loadBoarding(),
        loadGates()
    ]);

    if (!boardingEventsBound) {
        document.getElementById('search-boarding').addEventListener('input', (e) => {
            renderBoardingTable(e.target.value);
        });

        document.getElementById('form-boarding').addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitBoarding();
        });
        boardingEventsBound = true;
    }
}

async function fetchDropdowns() {
    try {
        const [resPax, resFlt, resGt] = await Promise.all([
            fetch('/api/passengers'),
            fetch('/api/flights'),
            fetch('/api/boarding/gates/all')
        ]);
        const pax = await resPax.json();
        const flt = await resFlt.json();
        const gt = await resGt.json();

        document.getElementById('b_passenger').innerHTML = '<option value="">Select Passenger</option>' + 
            pax.map(p => `<option value="${p.PASSENGER_ID}">${p.FULL_NAME} (${p.PASSPORT_NUMBER || 'No PP'})</option>`).join('');
            
        document.getElementById('b_flight').innerHTML = '<option value="">Select Flight</option>' + 
            flt.map(f => `<option value="${f.FLIGHT_ID}">${f.FLIGHT_NUMBER} - ${f.ARRIVAL_AIRPORT}</option>`).join('');
            
        document.getElementById('b_gate').innerHTML = '<option value="">Select Gate</option>' + 
            gt.map(g => `<option value="${g.GATE_ID}">${g.TERMINAL} / Gate ${g.GATE_NUMBER} (${g.GATE_STATUS})</option>`).join('');

    } catch (err) {
        console.error('Error fetching boarding dropdowns', err);
    }
}

async function loadBoarding() {
    showLoading('boarding-tbody');
    try {
        const terminal = document.getElementById('filter-board-terminal')?.value || 'All';
        const status = document.getElementById('filter-board-status')?.value || 'All';
        
        const res = await fetch(`/api/boarding?terminal=${encodeURIComponent(terminal)}&status=${encodeURIComponent(status)}`);
        allBoarding = await res.json();
        renderBoardingTable('');
        // Update stats (waiting for flight/gate totals, we calculate locally)
        updateBoardingStats();
    } catch (err) {
        document.getElementById('boarding-tbody').innerHTML = emptyHtml('Error loading boarding passes.');
    }
}

async function loadGates() {
    try {
        const res = await fetch('/api/boarding/gates/all');
        const gates = await res.json();
        renderGatesGrid(gates);
        window.gatesData = gates;
        updateBoardingStats();
    } catch (err) {
        console.error('Error loading gates', err);
    }
}

function updateBoardingStats() {
    const totalPasses = allBoarding.length;
    let availGates = 0, occGates = 0;
    
    if (window.gatesData) {
        availGates = window.gatesData.filter(g => g.GATE_STATUS === 'Available').length;
        occGates = window.gatesData.filter(g => g.GATE_STATUS === 'Occupied').length;
    }

    // Flights today calculation (assuming today as start of day)
    const todayStr = new Date().toISOString().split('T')[0];
    const flightsToday = allBoarding.filter(b => b.DEPARTURE_TIME && b.DEPARTURE_TIME.startsWith(todayStr)).length; 
    // Roughly estimating from passes, though a real count from flights table is better. Let's just use passes count for now.

    document.getElementById('boarding-stats').innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${totalPasses}</div>
            <div class="stat-label">Total Boarding Passes</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" style="color: #00C9A7">${availGates}</div>
            <div class="stat-label">Available Gates</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" style="color: #F0A500">${occGates}</div>
            <div class="stat-label">Occupied Gates</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${flightsToday}</div>
            <div class="stat-label">Boarding Passes Today</div>
        </div>
    `;
}

function renderGatesGrid(gates) {
    const grid = document.getElementById('gates-grid');
    if (gates.length === 0) {
        grid.innerHTML = '<div style="color:#A8B2BC">No gates found.</div>';
        return;
    }

    grid.innerHTML = gates.map(g => {
        const isAvail = g.GATE_STATUS === 'Available';
        const cls = isAvail ? 'available' : 'occupied';
        const actBtnArgs = isAvail ? `'Occupied', 'btn-ghost-amber'` : `'Available', 'btn-ghost'`;
        
        return `
            <div class="gate-card ${cls}">
                <div class="gate-card-header">
                    <div class="gate-number">${g.GATE_NUMBER}</div>
                    ${badgeHtml(g.GATE_STATUS)}
                </div>
                <div style="color: #A8B2BC; font-size: 13px; margin-bottom: 8px;">${g.TERMINAL}</div>
                <div style="font-size: 13px; margin-bottom: 12px;">
                    <svg style="width:14px; height:14px; vertical-align:middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    ${g.PASSENGER_COUNT || 0} passengers via gate
                </div>
                <button class="${isAvail ? 'btn-ghost-amber' : 'btn-ghost'}" style="width: 100%; text-align: center;" 
                    onclick="toggleGate(${g.GATE_ID}, '${isAvail ? 'Occupied' : 'Available'}')">
                    Mark ${isAvail ? 'Occupied' : 'Available'}
                </button>
            </div>
        `;
    }).join('');
}

async function toggleGate(id, status) {
    try {
        const res = await fetch(`/api/boarding/gates/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        if (res.ok) {
            showToast(`Gate marked as ${status}`);
            loadGates(); // refresh
            fetchDropdowns(); // refresh dropdowns just in case
        }
    } catch (err) {
        showToast('Error updating gate', 'error');
    }
}

function renderBoardingTable(filter) {
    const tbody = document.getElementById('boarding-tbody');
    const term = filter.toLowerCase();
    
    const filtered = allBoarding.filter(b => 
        (b.PASSENGER_NAME || '').toLowerCase().includes(term) ||
        (b.FLIGHT_NUMBER || '').toLowerCase().includes(term)
    );

    if (filtered.length === 0) {
        tbody.innerHTML = emptyHtml('No boarding passes found.');
        return;
    }

    tbody.innerHTML = filtered.map(b => {
        return `
            <tr>
                <td><strong>BP-${b.BOARDINGPASS_ID}</strong></td>
                <td>${b.PASSENGER_NAME}</td>
                <td>${b.FLIGHT_NUMBER}</td>
                <td>${b.AIRLINE_NAME}</td>
                <td>${b.GATE_NUMBER}</td>
                <td>${b.TERMINAL}</td>
                <td>${b.SEAT_NUMBER}</td>
                <td>${formatDateTime(b.BOARDING_TIME)}</td>
                <td>${b.BOARDING_GROUP}</td>
                <td>${badgeHtml(b.FLIGHT_STATUS)}</td>
                <td>
                    <button class="btn-delete" onclick="deleteBoarding(${b.BOARDINGPASS_ID}, '${b.PASSENGER_NAME.replace(/'/g, "\\'")}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        Delete
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

async function submitBoarding() {
    const payload = {
        passengerId: document.getElementById('b_passenger').value,
        flightId: document.getElementById('b_flight').value,
        gateId: document.getElementById('b_gate').value,
        seatNumber: document.getElementById('b_seat').value,
        boardingGroup: document.getElementById('b_group').value,
        boardingTime: document.getElementById('b_time').value
    };

    try {
        const res = await fetch('/api/boarding', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            showToast('Boarding pass issued successfully');
            hideModal('modal-boarding');
            document.getElementById('form-boarding').reset();
            loadBoarding();
            loadGates();
        } else {
            const data = await res.json();
            showToast(data.error || 'Failed to issue pass', 'error');
        }
    } catch (err) {
        showToast('Error issuing pass', 'error');
    }
}

async function deleteBoarding(id, pname) {
    showConfirm(
        'Delete Boarding Pass?',
        `Are you sure you want to permanently delete the boarding pass for ${pname}?`,
        async () => {
            try {
                const res = await fetch(`/api/boarding/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    showToast(`Boarding pass deleted`);
                    loadBoarding();
                    loadGates(); // to refresh passenger count
                } else {
                    const data = await res.json();
                    showToast(data.error || 'Failed to delete boarding pass', 'error');
                }
            } catch (err) {
                showToast('Error deleting boarding pass', 'error');
            }
        }
    );
}
