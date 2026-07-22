import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
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
    }
}

export default async function handler(req, res) {
    // Enable CORS
    const origin = req.headers.origin;
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (!admin.apps.length) {
        return res.status(500).json({ 
            error: 'Firebase Admin not initialized. Make sure your local Vercel dev server has loaded the environment variables.' 
        });
    }

    const db = admin.firestore();
    const targetEmail = "nwabuezejohnad11@gmail.com";
    const pointsToAward = 20000;

    try {
        console.log(`🔍 Looking up user in Firebase Auth: ${targetEmail}...`);
        const userRecord = await admin.auth().getUserByEmail(targetEmail);
        const uid = userRecord.uid;
        console.log(`✅ User found! UID: ${uid}`);

        console.log(`🔧 Updating user_settings document for UID: ${uid} with ${pointsToAward} points...`);
        const userSettingsRef = db.collection('user_settings').doc(uid);
        
        await userSettingsRef.set({
            referralPoints: pointsToAward
        }, { merge: true });

        console.log(`🎉 Success! Awarded ${pointsToAward} points to ${targetEmail}.`);
        return res.status(200).json({
            success: true,
            message: `Successfully awarded ${pointsToAward} points to ${targetEmail} (UID: ${uid})!`
        });
    } catch (err) {
        console.error("❌ Error in temp-award handler:", err);
        return res.status(500).json({ error: err.message });
    }
}
