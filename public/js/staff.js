let allStaff = [];
let activeAssignments = [];
let staffEventsBound = false;

async function initStaff() {
    await fetchStaffDropdowns();
    await loadStaffData();

    if (!staffEventsBound) {
        document.getElementById('search-staff').addEventListener('input', (e) => {
            renderStaffTable(e.target.value);
        });

        document.getElementById('form-staff').addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitStaff();
        });

        document.getElementById('form-attendance').addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitAttendance();
        });
        staffEventsBound = true;
    }
}

function initStaffModal() {
    document.getElementById('form-staff').reset();
    showModal('modal-staff');
}

async function fetchStaffDropdowns() {
    try {
        const [resShifts, resTeams] = await Promise.all([
            fetch('/api/staff/shifts/all'),
            fetch('/api/staff/teams/all')
        ]);
        const shifts = await resShifts.json();
        const teams = await resTeams.json();

        const shiftsData = Array.isArray(shifts) ? shifts : [];
        const teamsData = Array.isArray(teams) ? teams : [];

        document.getElementById('s_shift').innerHTML = '<option value="">Select Shift</option>' + 
            shiftsData.map(s => `<option value="${s.SHIFT_ID}">${s.SHIFT_NAME} (${s.START_TIME} - ${s.END_TIME})</option>`).join('');
            
        document.getElementById('s_team').innerHTML = '<option value="">-- None --</option>' + 
            teamsData.map(t => `<option value="${t.TEAM_ID}">${t.TEAM_NAME}</option>`).join('');

    } catch (err) {
        console.error('Error fetching staff dropdowns', err);
    }
}

async function loadStaffData() {
    showLoading('staff-tbody');
    try {
        const dept = document.getElementById('filter-staff-dept')?.value || 'All';
        const shift = document.getElementById('filter-staff-shift')?.value || 'All';
        const attendance = document.getElementById('filter-staff-attendance')?.value || 'All';
        const salaryOp = document.getElementById('filter-staff-salary-op')?.value || '>';
        const salaryVal = document.getElementById('filter-staff-salary-val')?.value || '';

        const filterUrl = `/api/staff?dept=${encodeURIComponent(dept)}&shift=${encodeURIComponent(shift)}&attendance=${encodeURIComponent(attendance)}&salary_op=${encodeURIComponent(salaryOp)}&salary_val=${encodeURIComponent(salaryVal)}`;

        const [resStaff, resAtt, resAssn] = await Promise.all([
            fetch(filterUrl),
            fetch('/api/staff/attendance/today'),
            fetch('/api/staff/assignments/active')
        ]);
        
        allStaff = await resStaff.json();
        const attSummary = await resAtt.json();
        activeAssignments = await resAssn.json();

        renderStaffStats(attSummary);
        renderStaffTable('');
    } catch (err) {
        document.getElementById('staff-tbody').innerHTML = emptyHtml('Error loading staff.');
    }
}

function renderStaffStats(attSummary) {
    const total = allStaff.length;
    let present = 0, absent = 0, late = 0;
    
    attSummary.forEach(row => {
        if (row.ATTENDANCE_STATUS === 'Present') present = row.TOTAL;
        if (row.ATTENDANCE_STATUS === 'Absent') absent = row.TOTAL;
        if (row.ATTENDANCE_STATUS === 'Late') late = row.TOTAL;
    });

    const activeCount = activeAssignments.length;

    document.getElementById('staff-stats').innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${total}</div>
            <div class="stat-label">Total Staff</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" style="color: #00C9A7">${present + late}</div>
            <div class="stat-label">Present Today (Inc. Late)</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" style="color: #E05252">${absent}</div>
            <div class="stat-label">Absent Today</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" style="color: #00C9A7">${activeCount}</div>
            <div class="stat-label">Active Assignments</div>
        </div>
    `;
}

function renderStaffTable(filter) {
    const tbody = document.getElementById('staff-tbody');
    const term = filter.toLowerCase();
    
    const filtered = allStaff.filter(s => 
        (s.FULL_NAME || '').toLowerCase().includes(term) ||
        (s.DEPARTMENT || '').toLowerCase().includes(term) ||
        (s.ROLE || '').toLowerCase().includes(term)
    );

    if (filtered.length === 0) {
        tbody.innerHTML = emptyHtml('No staff members found.');
        return;
    }

    tbody.innerHTML = filtered.map(s => {
        const salFmt = s.SALARY ? '$' + Number(s.SALARY).toLocaleString() : '-';
        return `
            <tr>
                <td><strong>${s.FULL_NAME}</strong></td>
                <td>${s.DEPARTMENT || '-'}</td>
                <td>${s.ROLE || '-'}</td>
                <td>${s.SHIFT_NAME ? `${s.SHIFT_NAME} (${s.START_TIME}-${s.END_TIME})` : '-'}</td>
                <td>${s.TEAM_NAME || 'Unassigned'}</td>
                <td>${salFmt}</td>
                <td>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-ghost" onclick="loadStaffDetail(${s.STAFF_ID})">Details</button>
                        <button class="btn-ghost" onclick="openAttendanceModal(${s.STAFF_ID}, '${s.FULL_NAME.replace(/'/g, "\\'")}')">Attn</button>
                        <button class="btn-delete" onclick="deleteStaff(${s.STAFF_ID}, '${s.FULL_NAME.replace(/'/g, "\\'")}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function submitStaff() {
    const payload = {
        firstName: document.getElementById('s_first_name').value,
        lastName: document.getElementById('s_last_name').value,
        department: document.getElementById('s_department').value,
        role: document.getElementById('s_role').value,
        phone: document.getElementById('s_phone').value,
        email: document.getElementById('s_email').value,
        salary: document.getElementById('s_salary').value,
        shiftId: document.getElementById('s_shift').value,
        teamId: document.getElementById('s_team').value || null
    };

    try {
        const res = await fetch('/api/staff', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            showToast('Staff added successfully');
            hideModal('modal-staff');
            loadStaffData();
        } else {
            const data = await res.json();
            showToast(data.error || 'Failed to add staff', 'error');
        }
    } catch (err) {
        showToast('Error adding staff', 'error');
    }
}

function openAttendanceModal(id, name) {
    document.getElementById('att_staff_id').value = id;
    document.getElementById('att_staff_name').textContent = `Staff: ${name}`;
    document.getElementById('att_status').value = 'Present';
    showModal('modal-attendance');
}

async function submitAttendance() {
    const status = document.getElementById('att_status').value;
    const staffId = document.getElementById('att_staff_id').value;

    try {
        const res = await fetch('/api/staff/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ staffId, status })
        });
        if (res.ok) {
            showToast('Attendance recorded');
            hideModal('modal-attendance');
            loadStaffData();
        } else {
            showToast('Failed to record attendance', 'error');
        }
    } catch (err) {
        showToast('Error on attendance', 'error');
    }
}

async function loadStaffDetail(id) {
    showDrawer('drawer-staff');
    const content = document.getElementById('drawer-staff-content');
    content.innerHTML = `<div class="spinner-container"><div class="spinner"></div></div>`;
    
    try {
        const [resStaff, resAssn] = await Promise.all([
            fetch(`/api/staff/${id}`),
            fetch(`/api/staff/assignments/active?staffId=${id}`)
        ]);
        
        if (!resStaff.ok) throw new Error('Failed to load profile');
        const s = await resStaff.json();
        const activeTasks = await resAssn.json();

        content.innerHTML = `
            <div class="drawer-profile-head">
                <h2>${s.FULL_NAME}</h2>
                <div>${badgeHtml(s.DEPARTMENT)} <span style="color:#A8B2BC; margin-left:8px;">${s.ROLE}</span></div>
            </div>
            
            <div style="background: rgba(255,255,255,0.03); padding: 16px; border-radius: 8px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px;">
                    <div><span style="color:#A8B2BC">Phone:</span> <br>${s.PHONE_NUMBER || '-'}</div>
                    <div><span style="color:#A8B2BC">Email:</span> <br>${s.EMAIL || '-'}</div>
                    <div><span style="color:#A8B2BC">Shift:</span> <br>${s.SHIFT_NAME || '-'} (${s.START_TIME || ''} - ${s.END_TIME || ''})</div>
                    <div><span style="color:#A8B2BC">Team:</span> <br>${s.TEAM_NAME || 'None'}</div>
                </div>
            </div>

            <h3 style="margin-top: 10px; font-size: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">Active Assignments</h3>
            <div id="drawer-assignments-list">
                ${activeTasks.length > 0 ? activeTasks.map(t => `
                    <div style="background: rgba(255,255,255,0.03); padding: 16px; border-radius: 8px; margin-bottom: 8px; border-left: 3px solid #F0A500;">
                        <div style="font-weight: 600; margin-bottom: 4px;">${t.TASK_TYPE} @ ${t.ASSIGNED_LOCATION}</div>
                        <div style="font-size: 12px; color: #A8B2BC;">
                            ${formatDateTime(t.ASSIGNMENT_START)} &rarr; ${formatDateTime(t.ASSIGNMENT_END)}
                        </div>
                    </div>
                `).join('') : '<div style="color:#A8B2BC; font-size:14px;">No active assignments.</div>'}
            </div>

            <h3 style="margin-top: 20px; font-size: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">Add Assignment</h3>
            <form onsubmit="submitStaffAssignment(event, ${s.STAFF_ID})" class="form-grid" style="background: rgba(255,255,255,0.02); padding: 16px; border-radius: 8px;">
                <div class="form-group" style="grid-column: span 2;">
                    <label>Task Type</label>
                    <select id="asg_task_type" required>
                        <option value="Gate Duty">Gate Duty</option>
                        <option value="Fueling">Fueling</option>
                        <option value="Baggage">Baggage</option>
                        <option value="Immigration">Immigration</option>
                    </select>
                </div>
                <div class="form-group" style="grid-column: span 2;">
                    <label>Location</label>
                    <input type="text" id="asg_location" required placeholder="e.g. Gate A2">
                </div>
                <div class="form-group" style="grid-column: span 2;">
                    <label>Start Time</label>
                    <input type="datetime-local" id="asg_start" required>
                </div>
                <div class="form-group" style="grid-column: span 2;">
                    <label>End Time</label>
                    <input type="datetime-local" id="asg_end" required>
                </div>
                <div class="form-actions" style="grid-column: span 2;">
                    <button type="submit" class="btn-primary" style="width: 100%;">Assign Task</button>
                </div>
            </form>
        `;
    } catch (err) {
        content.innerHTML = `<div style="color:#E05252">Error loading profile data.</div>`;
    }
}

async function submitStaffAssignment(e, staffId) {
    e.preventDefault();
    const taskType = document.getElementById('asg_task_type').value;
    const assignedLocation = document.getElementById('asg_location').value;
    const assignmentStart = document.getElementById('asg_start').value;
    const assignmentEnd = document.getElementById('asg_end').value;

    if (new Date(assignmentEnd) <= new Date(assignmentStart)) {
        showToast('End time must be after start time', 'warning');
        return;
    }

    try {
        const res = await fetch('/api/staff/assignments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ staffId, taskType, assignedLocation, assignmentStart, assignmentEnd })
        });
        if (res.ok) {
            showToast('Assignment added');
            loadStaffDetail(staffId); // reload drawer
            loadStaffData(); // reload main table just in case
        } else {
            showToast('Failed to add assignment', 'error');
        }
    } catch (err) {
        showToast('Error adding assignment', 'error');
    }
}

async function deleteStaff(id, name) {
    showConfirm(
        'Delete Staff Member?',
        `Are you sure you want to permanently delete staff member ${name}? This will cascade and delete their assignments and attendance records.`,
        async () => {
            try {
                const res = await fetch(`/api/staff/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    showToast(`Staff member ${name} deleted`);
                    loadStaffData();
                } else {
                    const data = await res.json();
                    showToast(data.error || 'Failed to delete staff member', 'error');
                }
            } catch (err) {
                showToast('Error deleting staff member', 'error');
            }
        }
    );
}
