import admin from 'firebase-admin';
import crypto from 'crypto';

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

// Generate random string
function generateRandomString(length) {
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex')
        .slice(0, length)
        .toUpperCase();
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

    const { rewardType } = req.body;
    if (!rewardType || !['bronze', 'silver', 'gold'].includes(rewardType)) {
        return res.status(400).json({ error: 'Invalid or missing rewardType. Must be bronze, silver, or gold.' });
    }

    let pointsCost = 0;
    let couponValue = 0;
    let couponLabel = "";

    if (rewardType === 'bronze') {
        pointsCost = 100;
        couponValue = 100; // ₦100
        couponLabel = "Bronze Coupon (₦100 off)";
    } else if (rewardType === 'silver') {
        pointsCost = 200;
        couponValue = 200; // ₦200
        couponLabel = "Silver Coupon (₦200 off)";
    } else if (rewardType === 'gold') {
        pointsCost = 800;
        couponValue = 800; // ₦800 (1 Month Free)
        couponLabel = "Gold Coupon (1 Month Free)";
    }

    if (!admin.apps.length) {
        return res.status(500).json({ error: 'Firebase Admin not initialized' });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;

        const db = admin.firestore();
        const settingsRef = db.collection('user_settings').doc(uid);

        let couponCode = "";

        await db.runTransaction(async (transaction) => {
            const settingsSnap = await transaction.get(settingsRef);
            if (!settingsSnap.exists) {
                throw new Error('User settings not found.');
            }

            const data = settingsSnap.data();
            const currentPoints = data.referralPoints || 0;

            if (currentPoints < pointsCost) {
                throw new Error(`Insufficient points balance. You need ${pointsCost} points, but you have ${currentPoints}.`);
            }

            // Generate unique code inside transaction
            couponCode = `JTG-${rewardType.toUpperCase()}-${generateRandomString(6)}`;

            const currentCoupons = data.coupons || [];
            const newCoupon = {
                code: couponCode,
                type: rewardType,
                value: couponValue,
                label: couponLabel,
                used: false,
                createdAt: new Date().toISOString()
            };

            transaction.set(settingsRef, {
                referralPoints: currentPoints - pointsCost,
                coupons: [...currentCoupons, newCoupon]
            }, { merge: true });
        });

        return res.status(200).json({
            success: true,
            message: `Successfully converted ${pointsCost} points into a ${couponLabel}!`,
            couponCode,
            couponValue,
            rewardType
        });

    } catch (error) {
        console.error("Error converting points:", error);
        return res.status(500).json({ error: error.message });
    }
}
