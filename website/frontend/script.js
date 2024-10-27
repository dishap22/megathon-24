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

function setDefaultDate() {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const formattedDate = `${year}-${month}-${day}`; // format as yyyy-mm-dd for HTML input
    document.getElementById('sessionDate').value = formattedDate;
}

async function fetchPatients() {
    const response = await fetch('/patients');
    const patients = await response.json();
    const patientsList = document.getElementById('searchResults');
    patientsList.innerHTML = ''; // Clear previous list

    patients.forEach(patient => {
        const p = document.createElement('p');
        p.textContent = `ID: ${patient.id}, Name: ${patient.name}, DOB: ${patient.dateOfBirth}, Contact: ${patient.contactInfo}`;
        patientsList.appendChild(p);
    });
}

async function fetchPatientsByName() {
    const name = document.getElementById('searchPatientName').value;
    const response = await fetch(`/patients/search/${encodeURIComponent(name)}`);
    const patients = await response.json();
    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = ''; // Clear previous search results

    patients.forEach(patient => {
        const p = document.createElement('p');
        p.textContent = `ID: ${patient.id}, Name: ${patient.name}, DOB: ${patient.dateOfBirth}, Contact: ${patient.contactInfo}`;
        searchResults.appendChild(p);
    });
}


async function addSession() {
    const patientId = document.getElementById('sessionPatientId').value;
    const sessionDate = document.getElementById('sessionDate').value;
    const notes = document.getElementById('sessionNotes').value;
    const audioFile = document.getElementById('audioFile').files[0]; // Get the audio file

    const formData = new FormData();
    formData.append('patientId', patientId);
    formData.append('sessionDate', sessionDate);
    formData.append('notes', notes);
    formData.append('audioFile', audioFile); // Append audio file

    const response = await fetch('/sessions', {
        method: 'POST',
        body: formData
    });

    const newSession = await response.json();
    console.log('New Session Recorded:', newSession);
    
    // Clear input fields
    document.getElementById('sessionPatientId').value = '';
    document.getElementById('sessionDate').value = '';
    document.getElementById('sessionNotes').value = '';
    document.getElementById('audioFile').value = ''; // Clear audio file input
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


window.onload = setDefaultDate;