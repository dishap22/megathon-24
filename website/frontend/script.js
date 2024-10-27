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
    displayPatients(patients); // Display all patients
}

async function fetchPatientsByName() {
    const name = document.getElementById('searchPatientName').value;
    const response = await fetch(`/patients/search/${encodeURIComponent(name)}`);
    const patients = await response.json();
    displayPatients(patients); // Show search results in the same format
}

function displayPatients(patients) {
    const patientsList = document.getElementById('searchResults');
    patientsList.innerHTML = ''; // Clear previous entries

    if (patients.length === 0) {
        patientsList.innerHTML = '<p>No patients found.</p>';
    } else {
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

// Fetch sessions function (to be implemented)
async function fetchSessions() {
    const patientId = document.getElementById('searchPatientId').value;
    // Add your implementation to fetch sessions for the patient by ID
}

// Set default date on page load



// async function addSession() {
//     const patientId = document.getElementById('sessionPatientId').value;
//     const sessionDate = document.getElementById('sessionDate').value;
//     const notes = document.getElementById('sessionNotes').value;
//     const audioFile = document.getElementById('audioFile').files[0];

//     const formData = new FormData();
//     formData.append('patientId', patientId);
//     formData.append('sessionDate', sessionDate);
//     formData.append('notes', notes);
//     formData.append('audioFile', audioFile);

//     try {
//         const response = await fetch('/sessions', {
//             method: 'POST',
//             body: formData
//         });

//         if (!response.ok) {
//             throw new Error(`HTTP error! status: ${response.status}`);
//         }

//         const newSession = await response.json();
//         console.log('New Session Recorded:', newSession);
//     } catch (error) {
//         console.error('Error recording session:', error);
//     }
// }

async function addSession() {
    console.log('fgshhnnh');
    const submitButton = document.getElementById('submitSession');
    const statusDiv = document.getElementById('sessionStatus');
    
    try {
        // Disable submit button and show loading state
        submitButton.disabled = true;
        statusDiv.innerHTML = '<p class="text-yellow-600">Processing session... Please wait.</p>';
        
        // Validate inputs
        const patientId = document.getElementById('sessionPatientId').value;
        const sessionDate = document.getElementById('sessionDate').value;
        const notes = document.getElementById('sessionNotes').value;
        const audioFile = document.getElementById('audioFile').files[0];
        
        if (!patientId || !sessionDate || !audioFile) {
            throw new Error('Please fill in all required fields and upload an audio file.');
        }
        
        // Validate audio file type
        const validAudioTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/x-m4a'];
        if (!validAudioTypes.includes(audioFile.type)) {
            throw new Error('Please upload a valid audio file (WAV, MP3, or M4A format).');
        }
        
        // Create form data
        const formData = new FormData();
        formData.append('patientId', patientId);
        formData.append('sessionDate', sessionDate);
        formData.append('notes', notes);
        formData.append('audioFile', audioFile);
        
        // Send request with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 300000); // 5-minute timeout
        
        const response = await fetch('/sessions', {
            method: 'POST',
            body: formData,
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to record session');
        }
        
        const newSession = await response.json();
        
        // Show success message with session details
        statusDiv.innerHTML = `
            <div class="text-green-600">
                <p>Session recorded successfully!</p>
                <p>Session ID: ${newSession.id}</p>
                <p>Date: ${newSession.sessionDate}</p>
                ${newSession.transcript ? `<p>Transcribed ${newSession.transcript.length} sentences</p>` : ''}
                ${newSession.classification ? `<p>Detected conditions: ${newSession.classification}</p>` : ''}
            </div>
        `;
        
        // Clear form
        document.getElementById('sessionPatientId').value = '';
        document.getElementById('sessionNotes').value = '';
        document.getElementById('audioFile').value = '';
        setDefaultDate(); // Reset date to today
        
        // Update sessions list if it exists
        if (newSession.patientId) {
            await fetchSessions(newSession.patientId);
        }
        
    } catch (error) {
        console.error('Error recording session:', error);
        statusDiv.innerHTML = `<p class="text-red-600">Error: ${error.message}</p>`;
    } finally {
        submitButton.disabled = false;
    }
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


// Set default date on page load
window.onload = setDefaultDate;
