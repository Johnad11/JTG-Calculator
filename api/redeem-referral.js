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

    const { referralCode } = req.body;
    if (!referralCode) {
        return res.status(400).json({ error: 'Referral code is required' });
    }

    if (!admin.apps.length) {
        return res.status(500).json({ error: 'Firebase Admin not initialized' });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;

        const db = admin.firestore();
        
        // 1. Get current user's settings to verify they haven't redeemed a code yet
        const mySettingsRef = db.collection('user_settings').doc(uid);
        const mySettingsSnap = await mySettingsRef.get();
        
        if (mySettingsSnap.exists) {
            const myData = mySettingsSnap.data();
            if (myData.referredBy) {
                return res.status(400).json({ error: 'You have already redeemed a referral code.' });
            }
        }

        // 2. Query to find the referrer by referralCode
        const normalizedCode = referralCode.trim().toUpperCase();
        const usersQuery = db.collection('user_settings').where('referralCode', '==', normalizedCode);
        const querySnap = await usersQuery.get();

        if (querySnap.empty) {
            return res.status(404).json({ error: 'Invalid referral code.' });
        }

        const referrerDoc = querySnap.docs[0];
        const referrerUid = referrerDoc.id;

        if (referrerUid === uid) {
            return res.status(400).json({ error: 'You cannot redeem your own referral code.' });
        }

        const referrerData = referrerDoc.data();

        // 3. Update both documents securely using a Firestore Transaction
        await db.runTransaction(async (transaction) => {
            const myFreshSnap = await transaction.get(mySettingsRef);
            if (myFreshSnap.exists && myFreshSnap.data().referredBy) {
                throw new Error('You have already redeemed a referral code.');
            }

            const referrerRef = db.collection('user_settings').doc(referrerUid);
            const referrerFreshSnap = await transaction.get(referrerRef);
            const referrerFreshData = referrerFreshSnap.exists ? referrerFreshSnap.data() : referrerData;

            // Calculate new points and count
            const currentReferrerPoints = referrerFreshData.referralPoints || 0;
            const currentReferralsCount = referrerFreshData.referralsCount || 0;
            
            const currentMyPoints = (myFreshSnap.exists ? myFreshSnap.data().referralPoints : 0) || 0;

            // Referrer gets 100 points
            transaction.set(referrerRef, {
                referralPoints: currentReferrerPoints + 100,
                referralsCount: currentReferralsCount + 1,
            }, { merge: true });

            // Referred user gets 50 points and referredBy tracking
            transaction.set(mySettingsRef, {
                referredBy: referrerUid,
                referralPoints: currentMyPoints + 50,
            }, { merge: true });
        });

        return res.status(200).json({
            success: true,
            message: 'Referral code successfully redeemed! You received 50 points as a welcome bonus.',
            referredBy: referrerUid,
        });

    } catch (error) {
        console.error("Error redeeming referral:", error);
        return res.status(500).json({ error: error.message });
    }
}
