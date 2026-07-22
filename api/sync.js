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
    // 1. Enable CORS dynamically to allow credentials
    const origin = req.headers.origin;
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
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
        let metadata = null;
        let trades = [];
        let balanceTransactions = [];

        if (req.body && !Array.isArray(req.body) && req.body.metadata) {
            metadata = req.body.metadata;
            trades = req.body.trades || [];
            balanceTransactions = req.body.balance_transactions || [];
        } else if (Array.isArray(req.body)) {
            trades = req.body;
        } else {
            return res.status(400).json({ error: 'Request body must be a JSON array of trades or a rich sync payload object' });
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
        const userData = userDoc.data();
        console.log(`✅ Authenticated User ID: ${userId}`);

        // 3. Verify JTG Premium subscription status
        const isEmailPremium = userData.email && ["nwabuezejohnad11@gmail.com"].includes(userData.email);
        const isPremium = userData.isPremium === true || isEmailPremium;
        let isSubscriptionValid = false;

        if (userData.premiumUntil) {
            const expiryDate = new Date(userData.premiumUntil);
            isSubscriptionValid = expiryDate > new Date() || isEmailPremium;
        } else if (isPremium) {
            // Legacy premium or manual administrative grant without a set expiry
            isSubscriptionValid = true;
        }

        if (!isPremium || !isSubscriptionValid) {
            console.warn(`⛔ Unauthorized Sync Request: User ${userId} does not have active premium privileges.`);
            return res.status(403).json({
                error: 'Premium Subscription Required',
                message: 'Auto-Sync is a premium JTG Ecosystem feature. Please unlock the premium tier (14-day free trial, Monthly ₦800, Quarterly ₦2,100, or Annual ₦8,000) inside the JTG Journal Web App to enable automated terminal syncing.'
            });
        }

        // 3. Resolve or Create Dedicated Personal Account
        let accountId = '';
        let accountRef = null;

        // Sort balance transactions chronologically by time
        const sortedTx = Array.isArray(balanceTransactions)
            ? [...balanceTransactions].sort((a, b) => (a.time || 0) - (b.time || 0))
            : [];
        
        let firstDepositTicket = null;
        const firstDepositTx = sortedTx.find(tx => parseFloat(tx.amount || 0) > 0);
        if (firstDepositTx) {
            firstDepositTicket = firstDepositTx.ticket;
        }

        if (metadata && metadata.login && metadata.broker) {
            const login = String(metadata.login);
            const broker = String(metadata.broker);

            console.log(`🔍 Resolving dedicated account for login: ${login}, broker: ${broker}`);
            const accountsSnapshot = await db.collection('accounts')
                .where('userId', '==', userId)
                .where('mt5Login', '==', login)
                .where('mt5Broker', '==', broker)
                .limit(1)
                .get();

            if (!accountsSnapshot.empty) {
                accountRef = accountsSnapshot.docs[0].ref;
                accountId = accountsSnapshot.docs[0].id;
                console.log(`✅ Resolved existing dedicated account ID: ${accountId}`);
            } else {
                let initialBalance = 0;
                if (firstDepositTx) {
                    initialBalance = parseFloat(firstDepositTx.amount || 0);
                    console.log(`✨ Set starting/initial balance to first MT5 deposit: ${initialBalance}`);
                } else {
                    // Fallback to balance - netPnL if no deposits are present
                    let netPnL = 0;
                    for (const trade of trades) {
                        netPnL += parseFloat(trade.pnl || 0);
                    }
                    const currentBalance = parseFloat(metadata.balance || 0);
                    initialBalance = currentBalance - netPnL;
                    console.log(`✨ Fallback starting/initial balance computed as: ${initialBalance}`);
                }

                const currentBalance = parseFloat(metadata.balance || 0);

                console.log(`✨ Creating dedicated personal account for MT5 - ${broker} (${login})`);
                const newAccountDoc = {
                    name: `MT5 - ${broker} (${login})`,
                    type: "Personal",
                    currency: metadata.currency || "USD",
                    balance: currentBalance.toFixed(2),
                    initialBalance: initialBalance.toFixed(2),
                    mt5Login: login,
                    mt5Broker: broker,
                    userId: userId,
                    createdAt: new Date().toISOString()
                };

                const newAccountRef = await db.collection('accounts').add(newAccountDoc);
                accountId = newAccountRef.id;
                accountRef = newAccountRef;
                console.log(`✅ Created dedicated account ID: ${accountId}`);
            }

            // Update account's balance to match current terminal balance
            console.log(`🔄 Updating live balance on account ${accountId} to ${metadata.balance}`);
            await accountRef.update({
                balance: parseFloat(metadata.balance || 0).toFixed(2)
            });
        } else {
            // Fallback for old format or missing metadata
            console.log(`⚠️ Missing MT5 metadata. Resolving default sync account.`);
            const accountsSnapshot = await db.collection('accounts')
                .where('userId', '==', userId)
                .limit(1)
                .get();

            if (!accountsSnapshot.empty) {
                accountId = accountsSnapshot.docs[0].id;
            } else {
                const newAccountRef = await db.collection('accounts').add({
                    name: "MT5 Auto-Sync Account",
                    currency: "USD",
                    balance: "10000.00",
                    userId: userId,
                    createdAt: new Date().toISOString()
                });
                accountId = newAccountRef.id;
            }
        }

        // 4. Batch write trades and balance transactions to avoid multiple round-trips
        const batch = db.batch();
        let syncedCount = 0;
        let withdrawalCount = 0;

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
                currency: (metadata && metadata.currency) || "USD",
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

        // 5. Batch write deposits and withdrawals from balance transactions
        let depositCount = 0;
        for (const tx of sortedTx) {
            const amountVal = parseFloat(tx.amount || 0);
            if (amountVal > 0) {
                // Skip the first deposit since it's designated as the initial/starting balance
                if (tx.ticket === firstDepositTicket) {
                    console.log(`ℹ️ Skipping first deposit (ticket ${tx.ticket}) in sync batch as it's registered as starting balance.`);
                    continue;
                }
                const depositId = `mt5_d_${tx.ticket}`;
                const depositRef = db.collection('deposits').doc(depositId);

                const newDeposit = {
                    userId: userId,
                    accountId: accountId,
                    amount: amountVal,
                    displayAmount: amountVal,
                    currency: (metadata && metadata.currency) || "USD",
                    note: "Synced deposit from MT5",
                    date: new Date((tx.time || Date.now() / 1000) * 1000).toISOString(),
                    createdAt: new Date().toISOString(),
                    type: 'DEPOSIT'
                };

                batch.set(depositRef, newDeposit, { merge: true });
                depositCount++;
            } else if (amountVal < 0) {
                const withdrawalId = `mt5_w_${tx.ticket}`;
                const withdrawalRef = db.collection('withdrawals').doc(withdrawalId);
                const absAmount = Math.abs(amountVal);

                const newWithdrawal = {
                    userId: userId,
                    accountId: accountId,
                    amount: absAmount,
                    displayAmount: absAmount,
                    currency: (metadata && metadata.currency) || "USD",
                    note: "Synced withdrawal from MT5",
                    date: new Date((tx.time || Date.now() / 1000) * 1000).toISOString(),
                    createdAt: new Date().toISOString(),
                    type: 'WITHDRAWAL'
                };

                batch.set(withdrawalRef, newWithdrawal, { merge: true });
                withdrawalCount++;
            }
        }

        await batch.commit();
        console.log(`🎉 Successfully synced ${syncedCount} trades, ${depositCount} deposits, and ${withdrawalCount} withdrawals for User ID: ${userId}`);

        return res.status(200).json({ 
            success: true, 
            message: `Synced ${syncedCount} trades, ${depositCount} deposits, and ${withdrawalCount} withdrawals successfully.` 
        });

    } catch (error) {
        console.error("❌ Sync Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
