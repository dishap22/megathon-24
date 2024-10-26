// frontend/script.js
async function addPatient() {
    const name = document.getElementById('patientName').value;
    const dateOfBirth = document.getElementById('patientDOB').value;
    const contactInfo = document.getElementById('patientContact').value;

    const response = await fetch('/patients', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, dateOfBirth, contactInfo })
    });

    const newPatient = await response.json();
    console.log('New Patient Added:', newPatient);
    document.getElementById('patientName').value = ''; // Clear input
    document.getElementById('patientDOB').value = ''; // Clear input
    document.getElementById('patientContact').value = ''; // Clear input
    fetchPatients(); // Refresh patient list
}

async function fetchPatients() {
    const response = await fetch('/patients');
    const patients = await response.json();
    const patientsList = document.getElementById('patientsList');
    patientsList.innerHTML = ''; // Clear previous list

    patients.forEach(patient => {
        const p = document.createElement('p');
        p.textContent = `ID: ${patient.id}, Name: ${patient.name}, DOB: ${patient.dateOfBirth}, Contact: ${patient.contactInfo}`;
        patientsList.appendChild(p);
    });
}

async function addSession() {
    const patientId = document.getElementById('sessionPatientId').value;
    const sessionDate = document.getElementById('sessionDate').value;
    const notes = document.getElementById('sessionNotes').value;

    const response = await fetch('/sessions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ patientId, sessionDate, notes })
    });

    const newSession = await response.json();
    console.log('New Session Recorded:', newSession);
    document.getElementById('sessionPatientId').value = ''; // Clear input
    document.getElementById('sessionDate').value = ''; // Clear input
    document.getElementById('sessionNotes').value = ''; // Clear input
}

async function fetchSessions() {
    const patientId = document.getElementById('searchPatientId').value;
    const response = await fetch(`/sessions/${patientId}`);
    const sessions = await response.json();
    const sessionsList = document.getElementById('sessionsList');
    sessionsList.innerHTML = ''; // Clear previous list

    sessions.forEach(session => {
        const p = document.createElement('p');
        p.textContent = `Session ID: ${session.id}, Date: ${session.sessionDate}, Notes: ${session.notes}`;
        sessionsList.appendChild(p);
    });
}
