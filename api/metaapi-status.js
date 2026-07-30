import admin from 'firebase-admin';
import MetaApi from 'metaapi.cloud-sdk';

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
    const origin = req.headers.origin;
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { userId } = req.query.userId ? req.query : (req.body || {});
    if (!userId) {
        return res.status(400).json({ error: 'Missing required parameter: userId' });
    }

    const token = process.env.METAAPI_TOKEN;
    if (!token) {
        return res.status(500).json({ error: 'Server misconfiguration: METAAPI_TOKEN is missing.' });
    }

    if (!admin.apps.length) {
        return res.status(500).json({ error: 'Firebase Admin not initialized.' });
    }

    const db = admin.firestore();
    const userDocRef = db.collection('user_settings').doc(userId);

    try {
        const userDoc = await userDocRef.get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User settings not found.' });
        }

        const userData = userDoc.data();
        const metaAccountId = userData.metaAccountId;

        if (!metaAccountId) {
            return res.status(200).json({ connected: false, message: 'No MetaApi account connected.' });
        }

        const api = new MetaApi(token);

        // Disconnect / Delete account if DELETE method requested
        if (req.method === 'DELETE') {
            console.log(`🗑️ Deleting MetaApi account ${metaAccountId} for user ${userId}...`);
            try {
                const account = await api.metatraderAccountApi.getAccount(metaAccountId);
                await account.undeploy();
                await account.remove();
            } catch (err) {
                console.warn(`⚠️ Warning during account removal: ${err.message}`);
            }

            await userDocRef.set({
                metaAccountId: admin.firestore.FieldValue.delete(),
                metaAccountLogin: admin.firestore.FieldValue.delete(),
                metaAccountServer: admin.firestore.FieldValue.delete(),
                metaAccountPlatform: admin.firestore.FieldValue.delete(),
                metaAccountState: 'DISCONNECTED',
                cloudSyncEnabled: false
            }, { merge: true });

            return res.status(200).json({ success: true, message: 'MetaApi account disconnected and removed.' });
        }

        // GET status
        const account = await api.metatraderAccountApi.getAccount(metaAccountId);

        return res.status(200).json({
            connected: true,
            accountId: account.id,
            state: account.state,
            connectionStatus: account.connectionStatus,
            login: account.login,
            server: account.server,
            platform: account.platform,
            name: account.name
        });

    } catch (error) {
        console.error('❌ MetaApi Status Error:', error);
        return res.status(500).json({ error: error.message || 'Failed to check account status.' });
    }
}
