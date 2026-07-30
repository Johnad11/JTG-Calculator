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
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { userId } = req.body || req.query || {};
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

    try {
        // 1. Fetch user settings from Firestore
        const userDocRef = db.collection('user_settings').doc(userId);
        const userDoc = await userDocRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User settings document not found.' });
        }

        const userData = userDoc.data();
        const metaAccountId = userData.metaAccountId;

        if (!metaAccountId) {
            return res.status(400).json({ 
                error: 'No MetaApi cloud account connected for this user.',
                hint: 'Please connect your MT4/MT5 account in Account Settings first.'
            });
        }

        console.log(`🔄 Syncing cloud trades for user ${userId} (MetaApi ID: ${metaAccountId})...`);

        const api = new MetaApi(token);
        const account = await api.metatraderAccountApi.getAccount(metaAccountId);

        if (account.state !== 'DEPLOYED') {
            console.log(`⏳ Account ${metaAccountId} state is ${account.state}. Redeploying or waiting...`);
            if (account.state === 'UNDEPLOYED') {
                await account.deploy();
            }
            return res.status(202).json({ 
                status: 'CONNECTING',
                message: `Account is currently ${account.state}. Syncing will commence once fully connected.` 
            });
        }

        // 2. Connect via RPC to fetch live data
        const connection = account.getRPCConnection();
        await connection.connect();
        await connection.waitSynchronized();

        // 3. Fetch account information and deal history
        const accountInfo = await connection.getAccountInformation();
        
        // Fetch deals from last 1 year or start of account
        const startTime = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        const deals = await connection.getDeals(startTime, new Date());

        console.log(`📊 Retrieved ${deals.length} total deals from MetaApi for account ${accountInfo.login}`);

        // 4. Format deals into JTG Journal trade format
        const formattedTrades = [];
        const balanceTransactions = [];

        for (const deal of deals) {
            if (deal.type === 'DEAL_TYPE_BALANCE') {
                balanceTransactions.push({
                    ticket: deal.id,
                    amount: deal.profit,
                    time: Math.floor(new Date(deal.time).getTime() / 1000)
                });
            } else if (deal.entryType === 'DEAL_ENTRY_OUT' || deal.entryType === 'DEAL_ENTRY_INOUT' || deal.entryType === 'DEAL_ENTRY_OUT_BY') {
                const netProfit = (deal.profit || 0) + (deal.commission || 0) + (deal.swap || 0);
                formattedTrades.push({
                    ticket: deal.id,
                    symbol: deal.symbol || 'UNKNOWN',
                    volume: deal.volume || 0,
                    pnl: Math.round(netProfit * 100) / 100,
                    closeTime: Math.floor(new Date(deal.time).getTime() / 1000),
                    type: deal.type === 'DEAL_TYPE_BUY' ? 0 : 1
                });
            }
        }

        // 5. Save/merge trade history into user's Firestore trade journal
        const lastSyncTimeStr = new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
        
        await userDocRef.set({
            metaAccountState: 'CONNECTED',
            lastCloudSyncAt: new Date().toISOString(),
            lastSyncTimeStr: lastSyncTimeStr,
            broker: accountInfo.broker || userData.metaAccountServer || 'MT5 Cloud',
            currency: accountInfo.currency || 'USD',
            balance: accountInfo.balance || 0,
            equity: accountInfo.equity || 0,
            marginFree: accountInfo.freeMargin || 0
        }, { merge: true });

        // Batch save trades into trades subcollection or doc
        if (formattedTrades.length > 0) {
            const batch = db.batch();
            const tradesRef = db.collection('users').doc(userId).collection('trades');

            for (const trade of formattedTrades) {
                const tradeDocRef = tradesRef.doc(String(trade.ticket));
                batch.set(tradeDocRef, {
                    ...trade,
                    source: 'METAAPI_CLOUD_SYNC',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            }

            await batch.commit();
            console.log(`💾 Successfully committed ${formattedTrades.length} cloud trades to Firestore for user ${userId}`);
        }

        return res.status(200).json({
            success: true,
            syncedCount: formattedTrades.length,
            balance: accountInfo.balance,
            equity: accountInfo.equity,
            currency: accountInfo.currency,
            lastSyncTime: lastSyncTimeStr,
            message: `Successfully synced ${formattedTrades.length} trades from MT4/MT5 Cloud!`
        });

    } catch (error) {
        console.error('❌ MetaApi Sync Error:', error);
        return res.status(500).json({ 
            error: error.message || 'Failed to sync trades from MetaApi Cloud.',
            details: error.details || null
        });
    }
}
