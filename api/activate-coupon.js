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

    const { couponCode } = req.body;
    if (!couponCode) {
        return res.status(400).json({ error: 'Coupon code is required.' });
    }

    if (!admin.apps.length) {
        return res.status(500).json({ error: 'Firebase Admin not initialized' });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;

        const db = admin.firestore();
        const settingsRef = db.collection('user_settings').doc(uid);

        let finalPremiumUntil = "";

        await db.runTransaction(async (transaction) => {
            const settingsSnap = await transaction.get(settingsRef);
            if (!settingsSnap.exists) {
                throw new Error('User settings not found.');
            }

            const data = settingsSnap.data();
            const coupons = data.coupons || [];

            // Find the index of the coupon
            const couponIndex = coupons.findIndex(c => c.code === couponCode);

            if (couponIndex === -1) {
                throw new Error('Invalid coupon code. Coupon not found in your account.');
            }

            const coupon = coupons[couponIndex];

            if (coupon.used === true) {
                throw new Error('Coupon has already been used.');
            }

            if (coupon.type !== 'gold') {
                throw new Error('This coupon is not eligible for direct activation. Please apply it during regular checkout for a discount.');
            }

            // Set coupon used to true
            const updatedCoupons = [...coupons];
            updatedCoupons[couponIndex] = { ...coupon, used: true, usedAt: new Date().toISOString() };

            // Determine Premium Duration
            const now = new Date();
            let premiumUntilDate = new Date();

            const isAlreadyPremium = data.isPremium === true;
            const hasPremiumUntilFuture = data.premiumUntil && new Date(data.premiumUntil) > now;

            if (isAlreadyPremium && hasPremiumUntilFuture) {
                // Extend subscription
                premiumUntilDate = new Date(data.premiumUntil);
                premiumUntilDate.setDate(premiumUntilDate.getDate() + 30);
            } else {
                // New subscription
                premiumUntilDate.setDate(now.getDate() + 30);
            }

            finalPremiumUntil = premiumUntilDate.toISOString();

            transaction.set(settingsRef, {
                isPremium: true,
                premiumPlan: 'Gold Coupon (1 Month Free)',
                premiumUntil: finalPremiumUntil,
                subscribedAt: now.toISOString(),
                coupons: updatedCoupons
            }, { merge: true });
        });

        return res.status(200).json({
            success: true,
            message: '🎉 JTG Premium successfully activated with your Gold Coupon!',
            premiumPlan: 'Gold Coupon (1 Month Free)',
            premiumUntil: finalPremiumUntil
        });

    } catch (error) {
        console.error("Error activating coupon:", error);
        return res.status(500).json({ error: error.message });
    }
}
