// backend/server.js
const express = require('express');
const path = require('path');
const db = require('./firebase'); // Import Firestore
const app = express();
const PORT = 3000;

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

// Route to add a new session for a patient
app.post('/sessions', async (req, res) => {
    const { patientId, sessionDate, notes } = req.body;
    const sessionRef = await db.collection('sessions').add({
        patientId,
        sessionDate,
        notes
    });
    res.json({ id: sessionRef.id, patientId, sessionDate, notes });
});

// Route to get sessions for a specific patient
app.get('/sessions/:patientId', async (req, res) => {
    const { patientId } = req.params;
    const snapshot = await db.collection('sessions').where('patientId', '==', patientId).get();
    const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(sessions);
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
