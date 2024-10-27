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
