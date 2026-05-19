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
    } else {
        console.warn("⚠️ Firebase Admin environment variables are missing! Serverless Sync is in dry-run mode.");
    }
}

export default async function handler(req, res) {
    // 1. Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Sync-Key'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const syncKey = req.headers['x-sync-key'];
    if (!syncKey) {
        return res.status(400).json({ error: 'Missing X-Sync-Key header' });
    }

    if (!admin.apps.length) {
        return res.status(500).json({ 
            error: 'Server configuration error. Firebase Admin is not initialized.',
            hint: 'Please check that FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables are configured on Vercel.'
        });
    }

    const db = admin.firestore();

    try {
        const trades = req.body;
        if (!Array.isArray(trades)) {
            return res.status(400).json({ error: 'Request body must be a JSON array of trades' });
        }

        // 2. Authenticate the user by matching their mt5SyncKey
        console.log(`🔍 Authenticating sync request with key prefix: ${syncKey.substring(0, 8)}...`);
        const userSettingsSnapshot = await db.collection('user_settings')
            .where('mt5SyncKey', '==', syncKey)
            .limit(1)
            .get();

        if (userSettingsSnapshot.empty) {
            return res.status(401).json({ error: 'Invalid or unauthorized Sync Key' });
        }

        const userDoc = userSettingsSnapshot.docs[0];
        const userId = userDoc.id;
        console.log(`✅ Authenticated User ID: ${userId}`);

        // 3. Find or create a default MT5 account for this user to tie the trades to
        const accountsSnapshot = await db.collection('accounts')
            .where('userId', '==', userId)
            .limit(1)
            .get();

        let accountId = '';
        if (!accountsSnapshot.empty) {
            accountId = accountsSnapshot.docs[0].id;
        } else {
            // Create a default sync account if they have none
            const newAccountRef = await db.collection('accounts').add({
                name: "MT5 Auto-Sync Account",
                currency: "USD",
                balance: "10000.00",
                userId: userId,
                createdAt: new Date().toISOString()
            });
            accountId = newAccountRef.id;
        }

        // 4. Batch write trades to avoid multiple round-trips
        const batch = db.batch();
        let syncedCount = 0;

        for (const trade of trades) {
            if (!trade.ticket) continue;

            const tradeId = `mt5_${trade.ticket}`;
            const tradeRef = db.collection('trades').doc(tradeId);

            // Determine outcome
            const pnlVal = parseFloat(trade.pnl || 0);
            let outcome = 'BREAKEVEN';
            if (pnlVal > 0) outcome = 'MANUAL WIN';
            else if (pnlVal < 0) outcome = 'MANUAL LOSS';

            // Map MT5 deal to JTG Trade schema
            const newTrade = {
                id: trade.ticket,
                pair: trade.symbol || 'NAS100',
                type: trade.type === 1 ? 'SELL' : 'BUY', // MT5 deal type: 0 = Buy, 1 = Sell
                lot: parseFloat(trade.volume || 0.1),
                pnl: pnlVal,
                pnlNative: pnlVal,
                exchangeRate: 1,
                currency: "USD",
                entry: 0,
                exit: 0,
                sl: 0,
                tp: 0,
                outcome: outcome,
                openDate: new Date((trade.closeTime || Date.now() / 1000) * 1000).toISOString(),
                closeDate: new Date((trade.closeTime || Date.now() / 1000) * 1000).toISOString(),
                notes: "Synced automatically from JTG MT5 EA",
                userId: userId,
                accountId: accountId
            };

            batch.set(tradeRef, newTrade, { merge: true });
            syncedCount++;
        }

        await batch.commit();
        console.log(`🎉 Successfully synced ${syncedCount} trades for User ID: ${userId}`);

        return res.status(200).json({ 
            success: true, 
            message: `Synced ${syncedCount} trades successfully.` 
        });

    } catch (error) {
        console.error("❌ Sync Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
