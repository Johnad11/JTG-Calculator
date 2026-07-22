const admin = require('firebase-admin');
const fs = require('fs');

// Manually parse .env.local
try {
    const envFile = fs.readFileSync('.env.local', 'utf8');
    envFile.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            let value = parts.slice(1).join('=').trim();
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            }
            process.env[key] = value;
        }
    });
    console.log("✅ Successfully parsed environment variables from .env.local");
} catch (e) {
    console.error("⚠️ Error reading/parsing .env.local:", e.message);
}

// Initialize Firebase Admin
if (!admin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY 
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
        : undefined;

    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
        });
        console.log("✅ Firebase Admin initialized successfully!");
    } else {
        console.error("❌ Failed to initialize Firebase Admin. Missing environment variables.");
        process.exit(1);
    }
}

const targetEmail = "nwabuezejohnad11@gmail.com";
const pointsToAward = 20000;

async function run() {
    try {
        const db = admin.firestore();
        
        console.log(`🔍 Looking up user in Firebase Auth: ${targetEmail}...`);
        const userRecord = await admin.auth().getUserByEmail(targetEmail);
        const uid = userRecord.uid;
        console.log(`✅ User found! UID: ${uid}`);

        console.log(`🔧 Updating user_settings document for UID: ${uid} with ${pointsToAward} points...`);
        const userSettingsRef = db.collection('user_settings').doc(uid);
        
        // Fetch current settings to see if they exist
        const snap = await userSettingsRef.get();
        if (!snap.exists) {
            console.log("⚠️ Settings document does not exist. Creating new document...");
        }

        await userSettingsRef.set({
            referralPoints: pointsToAward
        }, { merge: true });

        console.log(`🎉 Success! Awarded ${pointsToAward} points to user ${targetEmail} (UID: ${uid}).`);
        process.exit(0);
    } catch (error) {
        console.error("❌ Error running script:", error);
        process.exit(1);
    }
}

run();
