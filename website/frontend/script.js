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
    patientsList.innerHTML = ''; // Clear previous entries

    patients.forEach(patient => {
        const patientEntry = document.createElement('div');
        patientEntry.className = 'patient-entry';

        const patientDetails = document.createElement('p');
        patientDetails.innerHTML = `
            <strong>Name:</strong> <span class="patient-value">${patient.name}</span><br>
            <strong>DOB:</strong> <span class="patient-value">${patient.dateOfBirth}</span><br>
            <strong>Contact:</strong> <span class="patient-value">${patient.contactInfo}</span>
        `;
        
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-id-button';
        copyButton.textContent = 'Copy ID';
        copyButton.onclick = () => copyToClipboard(patient.id, copyButton); // Pass patient ID and button

        patientEntry.appendChild(patientDetails);
        patientEntry.appendChild(copyButton);
        patientsList.appendChild(patientEntry); // Append the new patient entry to the results list
    });
}


function copyToClipboard(id, button) {
    navigator.clipboard.writeText(id).then(() => {
        // Change button width
        button.style.width = '360px'; // Expand width
        // Change button text
        const originalText = button.textContent;
        button.innerHTML = `Copied Patient ID: <strong>${id}</strong> to Clipboard!`; // Bold for ID

        // Revert text and width after 5 seconds
        setTimeout(() => {
            button.innerHTML = originalText; // Restore original button text
            button.style.width = '120px'; // Revert width
        }, 5000); // 5000 milliseconds = 5 seconds
    }).catch(err => {
        console.error('Error copying ID: ', err);
    });
}




// In fetchPatients, update the copy button onClick to pass the button itself
const copyButton = document.createElement('button');
copyButton.className = 'copy-id-button';
copyButton.textContent = 'Copy ID';
copyButton.onclick = () => copyToClipboard(patient.id, copyButton); // Pass patient ID and button


async function addSession() {
    const patientId = document.getElementById('sessionPatientId').value;
    const sessionDate = document.getElementById('sessionDate').value;
    const notes = document.getElementById('sessionNotes').value;
    const audioFile = document.getElementById('audioFile').files[0];

    const formData = new FormData();
    formData.append('patientId', patientId);
    formData.append('sessionDate', sessionDate);
    formData.append('notes', notes);
    formData.append('audioFile', audioFile);

    try {
        const response = await fetch('/sessions', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const newSession = await response.json();
        console.log('New Session Recorded:', newSession);
    } catch (error) {
        console.error('Error recording session:', error);
    }
}

async function fetchPatientsByName() {
    const name = document.getElementById('searchPatientName').value;
    const response = await fetch(`/patients/search/${encodeURIComponent(name)}`);
    const patients = await response.json();
    displayPatients(patients); // Show results in modal
}

// Show the modal with patient data
function displayPatients(patients) {
    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = ''; // Clear previous search results

    if (patients.length === 0) {
        searchResults.innerHTML = '<p>No patients found.</p>';
    } else {
        const table = document.createElement('table');
        table.innerHTML = `
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>DOB</th>
                <th>Contact</th>
            </tr>`;
        
        patients.forEach(patient => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${patient.id}</td>
                <td>${patient.name}</td>
                <td>${patient.dateOfBirth}</td>
                <td>${patient.contactInfo}</td>`;
            table.appendChild(row);
        });

        searchResults.appendChild(table);
    }
    openModal(); // Show the modal
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

// Modal control functions
function openModal() {
    document.getElementById('modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

// Close modal when clicking outside of it
window.onclick = function(event) {
    const modal = document.getElementById('modal');
    if (event.target === modal) {
        closeModal();
    }
}

// Set default date on page load
window.onload = setDefaultDate;
