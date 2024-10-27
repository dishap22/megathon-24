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


// Define the path to Mapping.xlsx
const mappingFilePath = path.join(__dirname, '../../Mapping.xlsx');

// const xlsxPopulate = require('xlsx-populate');
// const keywordExtractor = require('keyword-extractor');

// Load the mapping file and create a dictionary of phrases to conditions
async function loadMappings(mappingFilePath) {
    const workbook = await xlsxPopulate.fromFileAsync(mappingFilePath);
    const sheet = workbook.sheet(0);
    const rows = sheet.usedRange().value();
    const mapping = {};

    // Skip the header row and populate the mapping dictionary
    rows.slice(1).forEach(row => {
        const [phrase, condition] = row;
        mapping[phrase.toLowerCase()] = condition;
    });
    return mapping;
}

// Extract keywords and map them to conditions based on the mapping dictionary

async function mapKeywordsToConditions(userInput, mapping, mappingFilePath) {
    // Call Python script for keyword extraction
    return new Promise((resolve, reject) => {
        exec(`python3 words.py "${userInput}" "${mappingFilePath}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return reject(error);
            }

            // Parse the output from the Python script
            let result;
            try {
                result = JSON.parse(stdout);
            } catch (jsonError) {
                console.error('Error parsing JSON:', jsonError);
                return reject(jsonError);
            }

            // Extract keywords and map to conditions
            const keywords = result.keywords.map(kw => kw[0]); // Extract only the keyword text
            const conditions = new Set();

            // Match extracted keywords with conditions in the mapping
            keywords.forEach(keyword => {
                const condition = mapping[keyword.toLowerCase()];
                if (condition) {
                    conditions.add(condition);
                }
            });

            const mappedCondition = conditions.size > 0 ? Array.from(conditions).join(', ') : 'None';
            resolve({ keywords: keywords.join(', '), mappedCondition });
        });
    });
}

async function processUserInputs(inputFilePath, mappingFilePath) {
    // Load mapping data
    const mapping = await loadMappings(mappingFilePath);

    // Read CSV input
    const csvData = fs.readFileSync(inputFilePath, 'utf8');
    const rows = csvData.split('\n').slice(1).map(line => line.split(','));

    // Prepare an array to hold the results
    const results = [];

    // Process each row
    for (const row of rows) {
        const userInput = row[0];

        // Extract keywords and map to conditions using the Python script
        const { keywords, mappedCondition } = await mapKeywordsToConditions(userInput, mapping, mappingFilePath);

        // Store the result as a string (you can adjust the format)
        results.push(`${userInput} | ${keywords} | ${mappedCondition}`);
    }

    return results; // If you want to return an array instead
}

// Route to add a new session for a patient, including audio file upload
// app.post('/sessions', upload.single('audioFile'), async (req, res) => {
//     console.log('Received session data');
    
//     const { patientId, sessionDate, notes } = req.body;

//     if (!req.file) {
//         console.error('No audio file uploaded');
//         return res.status(400).json({ error: 'No audio file uploaded' });
//     }

//     // Call the Python script to convert audio to text
//     exec(`python3 audio_to_text.py "${req.file.path}"`, async (error, stdout, stderr) => {
//         if (error) {
//             console.error(`Error processing audio: ${stderr}`);
//             return res.status(500).json({ error: 'Error processing audio' });
//         }

//         // Read the generated CSV file for transcripts
//         const csvFilePath = 'sentences.csv'; // Update with your generated CSV path
//         let sentences;

//         try {
//             const data = fs.readFileSync(csvFilePath, 'utf-8');
//             sentences = data.split('\n').map(line => line.trim()).filter(line => line.length > 0);
//         } catch (err) {
//             console.error(`Error reading CSV: ${err}`);
//             return res.status(500).json({ error: 'Error reading CSV' });
//         }

//         // Prepare to gather polarity results
//         const polarityResults = [];

//         // Call the polarity script once for all sentences
//         exec(`python3 polarity.py "${csvFilePath}"`, (err, stdout) => {
//             if (err) {
//                 console.error(`Polarity exec error: ${err}`);
//                 return res.status(500).json({ error: 'Error processing polarity' });
//             }

//             try {
//                 const results = JSON.parse(stdout); // Assuming polarity.py outputs JSON in this format
//                 polarityResults.push(...results);
//             } catch (parseErr) {
//                 console.error(`Error parsing polarity results: ${parseErr}`);
//                 return res.status(500).json({ error: 'Error parsing polarity results' });
//             }

//             // Calculate aggregate polarity metrics
//             const aggregateResults = {
//                 pos: 0,
//                 avg: 0,
//                 neg: 0,
//                 totalSentences: polarityResults.length
//             };

//             polarityResults.forEach(({ pos, neg, intensity }) => {
//                 aggregateResults.pos += pos || 0;
//                 aggregateResults.neg += neg || 0;
//                 aggregateResults.avg += intensity || 0; // Average intensity
//             });

//             // Calculate average intensity if there are sentences
//             if (aggregateResults.totalSentences > 0) {
//                 aggregateResults.avg /= aggregateResults.totalSentences;
//             }

//             // Call processUserInputs to handle keyword extraction and classification
//             processUserInputs('sentences.csv', mappingFilePath, patientId, sessionDate, notes, sentences)
//                 .then(mappedCondition => {
//                     // Store session details along with transcript and polarity results in Firestore
//                     db.collection('sessions').add({
//                         patientId,
//                         sessionDate,
//                         notes,
//                         transcript: sentences,
//                         polarity: aggregateResults,
//                         classification: mappedCondition
//                     })
//                     .then((sessionRef) => {
//                         res.json({
//                             id: sessionRef.id,
//                             patientId,
//                             sessionDate,
//                             notes,
//                             transcript: sentences,
//                             polarity: aggregateResults,
//                             classification: mappedCondition
//                         });
//                     })
//                     .catch((error) => {
//                         console.error("Error adding session:", error);
//                         res.status(500).json({ error: 'Error saving session' });
//                     });
//                 })
//                 .catch(err => {
//                     console.error(`Error processing user inputs: ${err}`);
//                     res.status(500).json({ error: 'Error processing user inputs' });
//                 });
//         });
//     });
// });

app.post('/sessions', upload.single('audioFile'), async (req, res) => {
    console.log('Processing new session request');
    
    try {
        const { patientId, sessionDate, notes } = req.body;
        
        // Validate required fields
        if (!patientId || !sessionDate || !req.file) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Validate patient exists
        const patientDoc = await db.collection('patients').doc(patientId).get();
        if (!patientDoc.exists) {
            return res.status(404).json({ error: 'Patient not found' });
        }
        
        // Process audio file
        const audioProcessingPromise = new Promise((resolve, reject) => {
            exec(`python3 audio_to_text.py "${req.file.path}"`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Audio processing error: ${stderr}`);
                    reject(new Error('Error processing audio file'));
                    return;
                }
                resolve();
            });
        });
        
        await audioProcessingPromise;
        
        // Read and process transcripts
        const csvFilePath = 'sentences.csv';
        let sentences = [];
        
        try {
            const data = fs.readFileSync(csvFilePath, 'utf-8');
            sentences = data.split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);
        } catch (err) {
            console.error(`CSV reading error: ${err}`);
            return res.status(500).json({ error: 'Error processing transcript' });
        }
        
        // Process polarity
        const polarityPromise = new Promise((resolve, reject) => {
            exec(`python3 polarity.py "${csvFilePath}"`, (error, stdout) => {
                if (error) {
                    reject(new Error('Error processing polarity'));
                    return;
                }
                try {
                    resolve(JSON.parse(stdout));
                } catch (parseErr) {
                    reject(new Error('Error parsing polarity results'));
                }
            });
        });
        
        const polarityResults = await polarityPromise;
        
        // Calculate aggregate metrics
        const aggregateResults = {
            pos: 0,
            neg: 0,
            avg: 0,
            totalSentences: polarityResults.length
        };
        
        polarityResults.forEach(({ pos, neg, intensity }) => {
            aggregateResults.pos += pos || 0;
            aggregateResults.neg += neg || 0;
            aggregateResults.avg += intensity || 0;
        });
        
        if (aggregateResults.totalSentences > 0) {
            aggregateResults.avg /= aggregateResults.totalSentences;
        }
        
        

        // Process keywords and classifications
        const mappedCondition = await processUserInputs('sentences.csv', mappingFilePath);
        
        // Store session in Firestore
        const sessionData = {
            patientId,
            sessionDate,
            notes,
            transcript: sentences,
            polarity: aggregateResults,
            classification: mappedCondition,
            audioPath: req.file.path,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        const sessionRef = await db.collection('sessions').add(sessionData);
        
        // Clean up temporary files
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error deleting temporary audio file:', err);
        });
        
        fs.unlink(csvFilePath, (err) => {
            if (err) console.error('Error deleting temporary CSV file:', err);
        });
        
        res.json({
            id: sessionRef.id,
            ...sessionData
        });
        
    } catch (error) {
        console.error('Session processing error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
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