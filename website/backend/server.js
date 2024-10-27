// backend/server.js
const express = require('express');
const path = require('path');
const db = require('./firebase'); // Import Firestore
const multer = require('multer'); // Middleware for handling file uploads
const { exec } = require('child_process'); // To run the Python script
const fs = require('fs'); // To read files
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
    exec(`python3 audio_to_text.py "${req.file.path}"`, async (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).json({ error: 'Error processing audio' });
        }

        // Read the generated CSV file for transcripts
        const csvFilePath = 'sentences.csv'; // Update with your generated CSV path
        fs.readFile(csvFilePath, 'utf-8', (err, data) => {
            if (err) {
                console.error(`Error reading CSV: ${err}`);
                return res.status(500).json({ error: 'Error reading CSV' });
            }

            // Split the data into lines
            const sentences = data.split('\n').map(line => line.trim()).filter(line => line.length > 0);

            // Prepare to gather polarity results
            const polarityResults = [];

            // Call the polarity script for each sentence
            const polarityPromises = sentences.map(sentence => {
                return new Promise((resolve, reject) => {
                    exec(`python3 polarity.py "${sentence}"`, (err, stdout) => {
                        if (err) {
                            console.error(`Polarity exec error: ${err}`);
                            return reject(err);
                        }

                        const results = JSON.parse(stdout); // Assuming polarity.py outputs JSON
                        polarityResults.push(results);
                        resolve();
                    });
                });
            });

            Promise.all(polarityPromises)
                .then(() => {
                    // Calculate aggregate polarity metrics
                    const aggregateResults = {
                        pos: 0,
                        avg: 0,
                        neg: 0,
                        totalSentences: polarityResults.length
                    };

                    polarityResults.forEach(({ pos, neg, intensity }) => {
                        aggregateResults.pos += pos;
                        aggregateResults.neg += neg;
                        aggregateResults.avg += intensity; // Average intensity
                    });

                    // Calculate average intensity
                    aggregateResults.avg /= aggregateResults.totalSentences;

                    // Store session details along with transcript and polarity results in Firestore
                    db.collection('sessions').add({
                        patientId,
                        sessionDate,
                        notes,
                        transcript: sentences,
                        polarity: aggregateResults
                    }).then((sessionRef) => {
                        res.json({ id: sessionRef.id, patientId, sessionDate, notes, transcript: sentences, polarity: aggregateResults });
                    }).catch((error) => {
                        console.error("Error adding session:", error);
                        res.status(500).json({ error: 'Error saving session' });
                    });
                })
                .catch(err => {
                    console.error(`Error processing polarity: ${err}`);
                    res.status(500).json({ error: 'Error processing polarity' });
                });
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
11