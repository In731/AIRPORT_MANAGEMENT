let allFlights = [];
let flightsEventsBound = false;

async function initFlights() {
    await fetchAirlinesAndAircraft();
    loadFlights();

    if (!flightsEventsBound) {
        // Attach search
        document.getElementById('search-flights').addEventListener('input', (e) => {
            renderFlightsTable(e.target.value);
        });

        // Form submit
        document.getElementById('form-flight').addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitFlight();
        });
        flightsEventsBound = true;
    }
}

async function fetchAirlinesAndAircraft() {
    try {
        const [resAir, resAc] = await Promise.all([
            fetch('/api/flights/airlines/all'),
            fetch('/api/flights/aircraft/all')
        ]);
        const airlines = await resAir.json();
        const aircraft = await resAc.json();

        // Store globally for filtering
        window.airlineData = airlines;
        window.aircraftData = aircraft;

        const selAirline = document.getElementById('flight_airline');
        selAirline.innerHTML = '<option value="">Select Airline</option>' + 
            airlines.map(a => `<option value="${a.AIRLINE_ID}">${a.AIRLINE_NAME}</option>`).join('');

        const selFilterAircraft = document.getElementById('filter-flight-aircraft');
        selFilterAircraft.innerHTML = '<option value="All">All Aircraft</option>' + 
            aircraft.map(a => `<option value="${a.AIRCRAFT_MODEL}">${a.AIRCRAFT_MODEL}</option>`).join('');

        filterAircraftDropdown(); // populate initial empty or all
    } catch (err) {
        console.error('Error fetching dropdown data', err);
    }
}

function filterAircraftDropdown() {
    const airlineId = document.getElementById('flight_airline').value;
    const selAircraft = document.getElementById('flight_aircraft');
    const filtered = window.aircraftData.filter(ac => !airlineId || ac.AIRLINE_ID == airlineId);
    
    selAircraft.innerHTML = '<option value="">Select Aircraft</option>' + 
        filtered.map(a => `<option value="${a.AIRCRAFT_ID}">${a.AIRCRAFT_MODEL} (${a.CAPACITY} Pax)</option>`).join('');
}

async function loadFlights() {
    showLoading('flight-tbody');
    try {
        const status = document.getElementById('filter-flight-status')?.value || 'All';
        const airline = document.getElementById('filter-flight-airline')?.value || 'All';
        const aircraft = document.getElementById('filter-flight-aircraft')?.value || 'All';
        
        const res = await fetch(`/api/flights?status=${encodeURIComponent(status)}&airline=${encodeURIComponent(airline)}&aircraft=${encodeURIComponent(aircraft)}`);
        allFlights = await res.json();
        renderFlightStats();
        renderFlightsTable('');
    } catch (err) {
        console.error(err);
        showToast('Failed to load flights', 'error');
        document.getElementById('flight-tbody').innerHTML = emptyHtml('Error loading flights.');
    }
}

function renderFlightStats() {
    const total = allFlights.length;
    const onTime = allFlights.filter(f => f.FLIGHT_STATUS === 'On Time').length;
    const delayed = allFlights.filter(f => f.FLIGHT_STATUS === 'Delayed').length;
    const cancelled = allFlights.filter(f => f.FLIGHT_STATUS === 'Cancelled').length;

    document.getElementById('flight-stats').innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${total}</div>
            <div class="stat-label">Total Flights</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" style="color: #00C9A7">${onTime}</div>
            <div class="stat-label">On Time</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" style="color: #F0A500">${delayed}</div>
            <div class="stat-label">Delayed</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" style="color: #E05252">${cancelled}</div>
            <div class="stat-label">Cancelled</div>
        </div>
    `;
}

function renderFlightsTable(filter) {
    const tbody = document.getElementById('flight-tbody');
    const term = filter.toLowerCase();
    
    const filtered = allFlights.filter(f => 
        f.FLIGHT_NUMBER.toLowerCase().includes(term) ||
        f.AIRLINE_NAME.toLowerCase().includes(term) ||
        f.DEPARTURE_AIRPORT.toLowerCase().includes(term) ||
        f.ARRIVAL_AIRPORT.toLowerCase().includes(term)
    );

    if (filtered.length === 0) {
        tbody.innerHTML = emptyHtml('No flights found.');
        return;
    }

    tbody.innerHTML = filtered.map(f => {
        return `
            <tr>
                <td><strong>${f.FLIGHT_NUMBER}</strong></td>
                <td>${f.AIRLINE_NAME}</td>
                <td>${f.AIRCRAFT_MODEL}</td>
                <td>${f.DEPARTURE_AIRPORT} &rarr; ${f.ARRIVAL_AIRPORT}</td>
                <td>${formatDateTime(f.DEPARTURE_TIME)}</td>
                <td>${formatDateTime(f.ARRIVAL_TIME)}</td>
                <td>${badgeHtml(f.FLIGHT_STATUS)}</td>
                <td>
                    <div class="pax-cell">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        ${f.PASSENGERS_BOOKED || 0}/${f.CAPACITY}
                    </div>
                </td>
                <td>
                    <div style="display: flex; gap: 8px; justify-content: flex-end;">
                        <select class="status-select" onchange="updateFlightStatus(${f.FLIGHT_ID}, this.value)">
                            <option value="" disabled selected>Update...</option>
                            <option value="On Time">On Time</option>
                            <option value="Delayed">Delayed</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                        <button class="btn-delete" onclick="deleteFlight(${f.FLIGHT_ID}, '${f.FLIGHT_NUMBER}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function updateFlightStatus(id, status) {
    if (!status) return;
    try {
        const res = await fetch(`/api/flights/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        if (res.ok) {
            showToast('Flight status updated');
            loadFlights();
        } else {
            showToast('Failed to update status', 'error');
        }
    } catch (err) {
        showToast('Error updating status', 'error');
    }
}

async function submitFlight() {
    const depTime = document.getElementById('flight_dep_time').value;
    const arrTime = document.getElementById('flight_arr_time').value;

    if (new Date(arrTime) <= new Date(depTime)) {
        showToast('Arrival time must be after departure time', 'warning');
        return;
    }

    const payload = {
        flightNumber: document.getElementById('flight_number').value,
        airlineId: document.getElementById('flight_airline').value,
        aircraftId: document.getElementById('flight_aircraft').value,
        departureAirport: document.getElementById('flight_dep_airport').value,
        arrivalAirport: document.getElementById('flight_arr_airport').value,
        departureTime: depTime,
        arrivalTime: arrTime,
        flightStatus: document.getElementById('flight_status').value
    };

    try {
        const res = await fetch('/api/flights', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            showToast('Flight added successfully');
            hideModal('modal-flight');
            document.getElementById('form-flight').reset();
            loadFlights();
        } else {
            const data = await res.json();
            showToast(data.error || 'Failed to add flight', 'error');
        }
    } catch (err) {
        showToast('Error adding flight', 'error');
    }
}

async function deleteFlight(id, fnum) {
    showConfirm(
        'Delete Flight?',
        `Are you sure you want to permanently delete flight ${fnum}? This will also remove all associated boarding passes.`,
        async () => {
            try {
                const res = await fetch(`/api/flights/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    showToast(`Flight ${fnum} deleted`);
                    loadFlights();
                } else {
                    const data = await res.json();
                    showToast(data.error || 'Failed to delete flight', 'error');
                }
            } catch (err) {
                showToast('Error deleting flight', 'error');
            }
        }
    );
}
