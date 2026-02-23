const API_BASE_URL = 'http://localhost:8090/api';

// DOM Elements - Shared
const navLinks = document.querySelectorAll('#nav-links a');
const sections = {
    'dashboard-view': document.getElementById('dashboard-view'),
    'patients-view': document.getElementById('patients-view'),
    'doctors-view': document.getElementById('doctors-view'),
    'appointments-view': document.getElementById('appointments-view')
};

// Modals and Toasts
const modalOverlay = document.getElementById('modalOverlay');
const modalContent = document.getElementById('modalContent');
const toastContainer = document.getElementById('toastContainer');

/* ======================================================================
   SPA NAVIGATION LOGIC
   ====================================================================== */
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();

        // Remove active class from all links
        navLinks.forEach(l => l.classList.remove('active'));
        e.currentTarget.classList.add('active');

        // Hide all views
        Object.values(sections).forEach(section => {
            if (section) section.classList.add('hidden');
        });

        // Show selected view
        const viewId = e.currentTarget.getAttribute('data-view');
        if (sections[viewId]) {
            sections[viewId].classList.remove('hidden');
            // Trigger specific data fetch based on view
            loadViewData(viewId);
        }
    });
});

function loadViewData(viewId) {
    if (viewId === 'patients-view') {
        fetchPatients();
    } else if (viewId === 'doctors-view') {
        // fetchDoctors(); 
    } else if (viewId === 'appointments-view') {
        // fetchAppointments();
    } else if (viewId === 'dashboard-view') {
        // fetchDashboardStats();
    }
}

/* ======================================================================
   API HELPERS
   ====================================================================== */
async function apiCall(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (data) options.body = JSON.stringify(data);

        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(errBody || `HTTP Error ${response.status}`);
        }

        // If DELETE or no content, don't try to parse JSON
        if (response.status === 204 || method === 'DELETE') return true;

        return await response.json();
    } catch (error) {
        console.error(`API Error on ${endpoint}:`, error);
        throw error;
    }
}

/* ======================================================================
   UI HELPERS (MODALS & TOASTS)
   ====================================================================== */
function openModal(headerHtml, bodyHtml, footerHtml) {
    modalContent.innerHTML = `
        <div class="modal-header">
            ${headerHtml}
            <button class="close-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body">
            ${bodyHtml}
        </div>
        <div class="modal-footer">
            ${footerHtml}
        </div>
    `;
    modalOverlay.classList.remove('hidden');
}

function closeModal() {
    modalOverlay.classList.add('hidden');
    modalContent.innerHTML = '';
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '<i class="fa-solid fa-check-circle"></i>' : '<i class="fa-solid fa-circle-exclamation"></i>';
    toast.innerHTML = `${icon} <span>${message}</span>`;

    toastContainer.appendChild(toast);

    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

/* ======================================================================
   PATIENTS MODULE
   ====================================================================== */
const patientTableBody = document.getElementById('patientTableBody');

async function fetchPatients() {
    patientTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center;">Loading patients... <i class="fa-solid fa-spinner fa-spin"></i></td></tr>`;
    try {
        const patients = await apiCall('/patients');
        renderPatientsTable(patients);
    } catch (error) {
        patientTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Failed to load patients data.</td></tr>`;
    }
}

function renderPatientsTable(patients) {
    patientTableBody.innerHTML = '';

    if (patients.length === 0) {
        patientTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No patients found.</td></tr>`;
        return;
    }

    patients.forEach(patient => {
        let genderClass = 'badge-gender-o';
        if (patient.gender === 'M') genderClass = 'badge-gender-m';
        if (patient.gender === 'F') genderClass = 'badge-gender-f';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${patient.patientId}</td>
            <td style="font-weight: 500; color: var(--text-main);">${patient.firstName} ${patient.lastName}</td>
            <td>${patient.dateOfBirth || '-'}</td>
            <td><span class="badge ${genderClass}">${patient.gender || 'N/A'}</span></td>
            <td>${patient.phone || '-'}</td>
            <td>
                <button class="action-btn" title="Edit" onclick="editPatient(${patient.patientId})"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="action-btn delete" title="Delete" onclick="deletePatient(${patient.patientId})"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        `;
        patientTableBody.appendChild(row);
    });
}

// Global functions attached to window for inline onclick handlers
window.openPatientModal = function (patient = null) {
    const isEdit = patient !== null;
    const title = isEdit ? 'Edit Patient' : 'Add New Patient';

    const bodyHtml = `
        <form id="patientForm">
            <input type="hidden" id="patId" value="${isEdit ? patient.patientId : ''}">
            <div class="form-group">
                <label>First Name</label>
                <input type="text" id="patFirstName" required value="${isEdit ? patient.firstName : ''}">
            </div>
            <div class="form-group">
                <label>Last Name</label>
                <input type="text" id="patLastName" required value="${isEdit ? patient.lastName : ''}">
            </div>
            <div class="form-group">
                <label>Date of Birth</label>
                <input type="date" id="patDob" value="${isEdit && patient.dateOfBirth ? patient.dateOfBirth : ''}">
            </div>
            <div class="form-group">
                <label>Gender (M/F/O)</label>
                <input type="text" id="patGender" maxlength="1" value="${isEdit && patient.gender ? patient.gender : ''}">
            </div>
            <div class="form-group">
                <label>Phone</label>
                <input type="text" id="patPhone" value="${isEdit && patient.phone ? patient.phone : ''}">
            </div>
        </form>
    `;

    const footerHtml = `
        <button class="btn" style="background: white; border: 1px solid #ddd; color: #333;" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="savePatient()">${isEdit ? 'Update' : 'Save'} Patient</button>
    `;

    openModal(`<h2>${title}</h2>`, bodyHtml, footerHtml);
};

window.savePatient = async function () {
    const pId = document.getElementById('patId').value;
    const patientData = {
        firstName: document.getElementById('patFirstName').value,
        lastName: document.getElementById('patLastName').value,
        dateOfBirth: document.getElementById('patDob').value,
        gender: document.getElementById('patGender').value.toUpperCase(),
        phone: document.getElementById('patPhone').value
    };

    try {
        if (pId) {
            // Update
            await apiCall(`/patients/${pId}`, 'PUT', patientData);
            showToast('Patient updated successfully');
        } else {
            // Create
            await apiCall(`/patients`, 'POST', patientData);
            showToast('Patient added successfully');
        }
        closeModal();
        fetchPatients(); // refresh list
    } catch (error) {
        showToast('Error saving patient: ' + error.message, 'error');
    }
};

window.editPatient = async function (id) {
    try {
        const patient = await apiCall(`/patients/${id}`);
        window.openPatientModal(patient);
    } catch (error) {
        showToast('Failed to load patient details', 'error');
    }
};

window.deletePatient = async function (id) {
    if (confirm('Are you sure you want to delete this patient?')) {
        try {
            await apiCall(`/patients/${id}`, 'DELETE');
            showToast('Patient deleted successfully');
            fetchPatients();
        } catch (error) {
            showToast('Failed to delete patient', 'error');
        }
    }
};

/* ======================================================================
   DOCTORS MODULE
   ====================================================================== */
const doctorTableBody = document.getElementById('doctorTableBody');

async function fetchDoctors() {
    doctorTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Loading doctors... <i class="fa-solid fa-spinner fa-spin"></i></td></tr>';
    try {
        const doctors = await apiCall('/doctors');
        renderDoctorsTable(doctors);
    } catch (error) {
        doctorTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Failed to load doctors data.</td></tr>';
    }
}

function renderDoctorsTable(doctors) {
    doctorTableBody.innerHTML = '';

    if (doctors.length === 0) {
        doctorTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No doctors found.</td></tr>';
        return;
    }

    doctors.forEach(doctor => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${doctor.doctorId}</td>
            <td style="font-weight: 500; color: var(--text-main);">${doctor.firstName} ${doctor.lastName}</td>
            <td><span class="badge bg-purple" style="color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;">${doctor.specialization}</span></td>
            <td>${doctor.email || '-'}</td>
            <td>
                <button class="action-btn delete" title="Delete" onclick="deleteDoctor(${doctor.doctorId})"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        `;
        doctorTableBody.appendChild(row);
    });
}

window.openDoctorModal = function () {
    const bodyHtml = `
        <form id="doctorForm">
            <div class="form-group">
                <label>First Name</label>
                <input type="text" id="docFirstName" required>
            </div>
            <div class="form-group">
                <label>Last Name</label>
                <input type="text" id="docLastName" required>
            </div>
            <div class="form-group">
                <label>Specialization</label>
                <input type="text" id="docSpec" required>
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" id="docEmail">
            </div>
        </form>
    `;

    const footerHtml = `
        <button class="btn" style="background: white; border: 1px solid #ddd; color: #333;" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="saveDoctor()">Add Doctor</button>
    `;

    openModal('<h2>Add New Doctor</h2>', bodyHtml, footerHtml);
};

window.saveDoctor = async function () {
    const doctorData = {
        firstName: document.getElementById('docFirstName').value,
        lastName: document.getElementById('docLastName').value,
        specialization: document.getElementById('docSpec').value,
        email: document.getElementById('docEmail').value
    };

    try {
        await apiCall('/doctors', 'POST', doctorData);
        showToast('Doctor added successfully');
        closeModal();
        fetchDoctors(); // refresh list
    } catch (error) {
        showToast('Error saving doctor: ' + error.message, 'error');
    }
};

window.deleteDoctor = async function (id) {
    if (confirm('Are you sure you want to delete this doctor?')) {
        try {
            await apiCall(`/doctors/${id}`, 'DELETE');
            showToast('Doctor deleted successfully');
            fetchDoctors();
        } catch (error) {
            showToast('Failed to delete doctor', 'error');
        }
    }
};

/* ======================================================================
   APPOINTMENTS MODULE
   ====================================================================== */
const appointmentTableBody = document.getElementById('appointmentTableBody');

async function fetchAppointments() {
    appointmentTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Loading appointments... <i class="fa-solid fa-spinner fa-spin"></i></td></tr>';
    try {
        const appointments = await apiCall('/appointments');
        renderAppointmentsTable(appointments);
    } catch (error) {
        appointmentTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: red;">Failed to load appointments data.</td></tr>';
    }
}

function renderAppointmentsTable(appointments) {
    appointmentTableBody.innerHTML = '';

    if (appointments.length === 0) {
        appointmentTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No appointments found.</td></tr>';
        return;
    }

    appointments.forEach(app => {
        let statusColor = 'bg-blue';
        if (app.status === 'COMPLETED') statusColor = 'bg-green';
        if (app.status === 'CANCELLED') statusColor = 'bg-red';

        let dateStr = 'Unknown';
        if (app.appointmentDate && app.appointmentTime) {
            // Trim seconds or format nicely if needed, but simple concat works
            // Ex: 2028-06-13 02:36:00
            dateStr = `${app.appointmentDate} ${app.appointmentTime}`;
        } else if (app.appointmentDateTime) {
            const dateObj = new Date(app.appointmentDateTime);
            if (!isNaN(dateObj)) {
                dateStr = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
        }

        const patientName = app.patient ? `${app.patient.firstName} ${app.patient.lastName}` : 'Unknown';
        const doctorName = app.doctor ? `Dr. ${app.doctor.firstName} ${app.doctor.lastName}` : 'Unknown';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${app.appointmentId}</td>
            <td style="font-weight: 500;">${patientName}</td>
            <td>${doctorName}</td>
            <td>${dateStr}</td>
            <td><span class="badge ${statusColor}" style="color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;">${app.status}</span></td>
            <td>${app.reason || '-'}</td>
            <td>
                ${app.status === 'SCHEDULED' ? `<button class="action-btn" title="Cancel" onclick="cancelAppointment(${app.appointmentId})"><i class="fa-solid fa-ban" style="color: #ef4444;"></i></button>` : ''}
                <button class="action-btn delete" title="Delete" onclick="deleteAppointment(${app.appointmentId})"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        `;
        appointmentTableBody.appendChild(row);
    });
}

window.openAppointmentModal = async function () {
    openModal('<h2>Schedule Appointment</h2>', '<div style="text-align:center">Loading...</div>', '');

    try {
        const [patients, doctors] = await Promise.all([
            apiCall('/patients'),
            apiCall('/doctors')
        ]);

        let patientOptions = patients.map(p => `<option value="${p.patientId}">${p.firstName} ${p.lastName} (#${p.patientId})</option>`).join('');
        let doctorOptions = doctors.map(d => `<option value="${d.doctorId}">Dr. ${d.firstName} ${d.lastName} - ${d.specialization}</option>`).join('');

        const bodyHtml = `
            <form id="appointmentForm">
                <div class="form-group">
                    <label>Patient</label>
                    <select id="appPatient" required>
                        <option value="">Select Patient...</option>
                        ${patientOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label>Doctor</label>
                    <select id="appDoctor" required>
                        <option value="">Select Doctor...</option>
                        ${doctorOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label>Date & Time</label>
                    <input type="datetime-local" id="appDateTime" required>
                </div>
                <div class="form-group">
                    <label>Reason for Visit</label>
                    <input type="text" id="appReason" required>
                </div>
            </form>
        `;

        const footerHtml = `
            <button class="btn" style="background: white; border: 1px solid #ddd; color: #333;" onclick="closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="saveAppointment()">Schedule</button>
        `;

        openModal('<h2>Schedule Appointment</h2>', bodyHtml, footerHtml);

    } catch (error) {
        showToast('Failed to load data for form', 'error');
        closeModal();
    }
};

window.saveAppointment = async function () {
    const pId = document.getElementById('appPatient').value;
    const dId = document.getElementById('appDoctor').value;

    const dateTimeVal = document.getElementById('appDateTime').value;

    if (!pId || !dId || !dateTimeVal) {
        showToast('Please select Patient, Doctor, and Date & Time', 'error');
        return;
    }

    const [datePart, timePart] = dateTimeVal.split('T');

    const appointmentData = {
        patient: { patientId: parseInt(pId) },
        doctor: { doctorId: parseInt(dId) },
        appointmentDate: datePart,
        appointmentTime: timePart + ':00',
        status: 'SCHEDULED',
        reason: document.getElementById('appReason').value
    };

    try {
        await apiCall('/appointments', 'POST', appointmentData);
        showToast('Appointment scheduled successfully');
        closeModal();
        fetchAppointments(); // refresh list
    } catch (error) {
        showToast('Booking failed: ' + error.message, 'error');
    }
};

window.cancelAppointment = async function (id) {
    if (confirm('Are you sure you want to cancel this appointment?')) {
        try {
            const app = await apiCall(`/appointments/${id}`);
            app.status = 'CANCELLED';
            await apiCall(`/appointments/${id}`, 'PUT', app);
            showToast('Appointment cancelled');
            fetchAppointments();
        } catch (error) {
            showToast('Failed to cancel appointment', 'error');
        }
    }
};

window.deleteAppointment = async function (id) {
    if (confirm('Are you sure you want to delete this record?')) {
        try {
            await apiCall(`/appointments/${id}`, 'DELETE');
            showToast('Appointment deleted');
            fetchAppointments();
        } catch (error) {
            showToast('Failed to delete appointment', 'error');
        }
    }
};

/* ======================================================================
   DASHBOARD FIX / RE-WIRE
   ====================================================================== */
const originalLoadViewData = loadViewData;
loadViewData = function (viewId) {
    if (viewId === 'patients-view') fetchPatients();
    else if (viewId === 'doctors-view') fetchDoctors();
    else if (viewId === 'appointments-view') fetchAppointments();
    else if (viewId === 'dashboard-view') fetchDashboardStats();
};

async function fetchDashboardStats() {
    try {
        const [patients, doctors, appointments] = await Promise.all([
            apiCall('/patients').catch(() => []),
            apiCall('/doctors').catch(() => []),
            apiCall('/appointments').catch(() => [])
        ]);

        document.getElementById('dashTotalPatients').textContent = patients.length;
        document.getElementById('dashTotalDoctors').textContent = doctors.length;

        const pendingApps = appointments.filter(a => a.status === 'SCHEDULED');
        document.getElementById('dashTotalAppointments').textContent = pendingApps.length;

    } catch (error) {
        console.error('Error fetching stats', error);
    }
}

// Ensure dashboard loads initially
document.addEventListener('DOMContentLoaded', fetchDashboardStats);
