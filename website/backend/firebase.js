// backend/firebase.js
const admin = require('firebase-admin');

// Replace with the path to your downloaded service account key JSON file
const serviceAccount = require('/home/vigneshvembar/Documents/megathon-24-firebase-adminsdk-hu295-47b07e0092.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

module.exports = db;
