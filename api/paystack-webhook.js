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

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    const paystackSignature = req.headers['x-paystack-signature'];
    if (!paystackSignature) {
        return res.status(401).json({ error: 'Missing Paystack Signature' });
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
        console.error("PAYSTACK_SECRET_KEY environment variable is not defined");
        return res.status(500).json({ error: 'Server configuration error' });
    }

    // Validate webhook source signature
    const hash = crypto
        .createHmac('sha512', paystackSecretKey)
        .update(JSON.stringify(req.body))
        .digest('hex');

    if (hash !== paystackSignature) {
        console.warn("⛔ Paystack signature verification failed!");
        return res.status(401).json({ error: 'Invalid Signature' });
    }

    const event = req.body;
    console.log(`🔔 Paystack Webhook event received: ${event.event}`);

    if (event.event === 'charge.success') {
        const data = event.data;
        const ref = data.reference;
        const metadata = data.metadata || {};
        const userId = metadata.userId;
        const planName = metadata.planName;
        const premiumUntil = metadata.premiumUntil;

        if (!userId) {
            console.error("charge.success event metadata has no userId:", data);
            return res.status(400).json({ error: 'Missing userId in transaction metadata' });
        }

        console.log(`✅ Verified charge.success for User: ${userId}, Reference: ${ref}, Plan: ${planName}`);

        if (!admin.apps.length) {
            return res.status(500).json({ error: 'Firebase Admin not initialized' });
        }

        const db = admin.firestore();

        try {
            // Update user settings premium fields
            await db.collection('user_settings').doc(userId).set({
                isPremium: true,
                premiumPlan: planName || 'Premium Plan',
                premiumUntil: premiumUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                subscribedAt: new Date().toISOString(),
                paystackPaymentReference: ref,
                paystackPaymentStatus: 'SUCCESS'
            }, { merge: true });

            console.log(`🎉 Webhook successfully updated premium status for user ${userId}`);
            return res.status(200).json({ success: true, message: 'Premium status updated successfully' });
        } catch (dbErr) {
            console.error(`Firestore error updating premium settings for user ${userId}:`, dbErr);
            return res.status(500).json({ error: dbErr.message });
        }
    }

    return res.status(200).json({ received: true });
}
