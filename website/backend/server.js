// backend/server.js
const express = require('express');
const path = require('path');
const db = require('./firebase'); // Import Firestore
const multer = require('multer'); // Middleware for handling file uploads
const { exec } = require('child_process'); // To run the Python script
const app = express();
const PORT = 3000;

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Directory to store uploaded files
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to filename
    }
});

const upload = multer({ storage: storage });

app.use(express.static(path.join(__dirname, '../frontend')));
app.use(express.json());

// Route to add a new patient
app.post('/patients', async (req, res) => {
    const { name, dateOfBirth, contactInfo } = req.body;
    const patientRef = await db.collection('patients').add({
        name,
        dateOfBirth,
        contactInfo
    });
    res.json({ id: patientRef.id, name, dateOfBirth, contactInfo });
});

// Route to get all patients
app.get('/patients', async (req, res) => {
    const snapshot = await db.collection('patients').get();
    const patients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(patients);
});

// Route to add a new session for a patient, including audio file upload
app.post('/sessions', upload.single('audioFile'), async (req, res) => {
    const { patientId, sessionDate, notes } = req.body;

    // Call the Python script to convert audio to text
    exec(`python3 audio_to_text.py "${req.file.path}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).json({ error: 'Error processing audio' });
        }

        // Get the transcript output from the Python script
        const transcript = stdout.trim(); // Trim whitespace from output

        // Store session details along with transcript in Firestore
        db.collection('sessions').add({
            patientId,
            sessionDate,
            notes,
            transcript
        }).then((sessionRef) => {
            res.json({ id: sessionRef.id, patientId, sessionDate, notes, transcript });
        }).catch((error) => {
            console.error("Error adding session:", error);
            res.status(500).json({ error: 'Error saving session' });
        });
    });
});

// Route to get sessions for a specific patient
app.get('/sessions/:patientId', async (req, res) => {
    const { patientId } = req.params;
    const snapshot = await db.collection('sessions').where('patientId', '==', patientId).get();
    const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(sessions);
});

// Route to search patients by name
app.get('/patients/search/:name', async (req, res) => {
    const searchName = req.params.name.toLowerCase(); // Get the search name and convert to lowercase
    const snapshot = await db.collection('patients').get();
    
    // Filter patients where the name includes the search term
    const patients = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(patient => patient.name.toLowerCase().includes(searchName)); // Case insensitive search

    res.json(patients);
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
