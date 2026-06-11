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
    // 1. Enable CORS dynamically to support credentials
    const origin = req.headers.origin;
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    if (!idToken) {
        return res.status(401).json({ error: 'Missing ID Token' });
    }

    if (!admin.apps.length) {
        return res.status(500).json({ error: 'Firebase Admin not initialized' });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;

        const db = admin.firestore();
        const settingsRef = db.collection('user_settings').doc(uid);
        const doc = await settingsRef.get();

        if (doc.exists) {
            const data = doc.data();
            if (data.trialUsed === true) {
                return res.status(400).json({ error: 'You have already redeemed your free trial.' });
            }
            if (data.isPremium === true) {
                return res.status(400).json({ error: 'You already have an active Premium membership.' });
            }
        }

        const now = new Date();
        const premiumUntil = new Date();
        premiumUntil.setDate(now.getDate() + 14); // 14 Days Free Trial

        await settingsRef.set({
            isPremium: true,
            premiumPlan: '14-Day Free Trial',
            premiumUntil: premiumUntil.toISOString(),
            subscribedAt: now.toISOString(),
            trialUsed: true
        }, { merge: true });

        return res.status(200).json({
            success: true,
            message: '14-Day Free Trial successfully activated!',
            premiumPlan: '14-Day Free Trial',
            premiumUntil: premiumUntil.toISOString()
        });

    } catch (error) {
        console.error("Error activating trial:", error);
        return res.status(500).json({ error: error.message });
    }
}
