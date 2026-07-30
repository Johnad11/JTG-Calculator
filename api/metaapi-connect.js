import admin from 'firebase-admin';
import MetaApi from 'metaapi.cloud-sdk';

// Initialize Firebase Admin SDK if not initialized
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
    // 1. Enable CORS & JSON response type
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

    try {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const token = process.env.METAAPI_TOKEN;
        if (!token) {
            return res.status(500).json({ error: 'Server misconfiguration: METAAPI_TOKEN environment variable is missing in Vercel.' });
        }

        const { userId, login, password, server, platform = 'mt5', accountName } = req.body || {};

        if (!userId || !login || !password || !server) {
            return res.status(400).json({ 
                error: 'Missing required parameters. Please provide userId, login, password (investor password), and server.' 
            });
        }

        // 1.5 Verify user has Diamond Plan tier subscription
        if (admin.apps.length) {
            const db = admin.firestore();
            const userDoc = await db.collection('user_settings').doc(userId).get();
            if (userDoc.exists) {
                const data = userDoc.data();
                const isEmailAdmin = data.email && ["nwabuezejohnad11@gmail.com"].includes(data.email);
                const planTier = data.planTier || (data.isPremium ? 'diamond' : 'free');
                const isPremium = data.isPremium === true || isEmailAdmin;
                
                if (!isPremium || (planTier !== 'diamond' && !isEmailAdmin)) {
                    return res.status(403).json({
                        error: '24/7 Cloud Sync requires a Diamond Plan subscription ($1.50 / ₦2,450 per month). Please upgrade your subscription to Diamond tier.',
                        code: 'DIAMOND_TIER_REQUIRED'
                    });
                }

                // Check cloud sync account count limit (Max 3 for Diamond plan)
                const accountsSnap = await db.collection('accounts').where('userId', '==', userId).get();
                const cloudAccountsCount = accountsSnap.docs.filter(d => d.data().isCloudSync || d.data().source === 'METAAPI_CLOUD_SYNC').length;

                if (cloudAccountsCount >= 3) {
                    return res.status(403).json({
                        error: 'Cloud Sync Limit Reached: Diamond Plan supports a maximum of 3 24/7 Cloud Sync accounts.',
                        code: 'MAX_CLOUD_ACCOUNTS_EXCEEDED'
                    });
                }
            }
        }

        console.log(`🔌 Initializing MetaApi account creation for user ${userId}, login: ${login}, server: ${server}...`);
        
        const api = new MetaApi(token);

        // 2. Check if account already exists on MetaApi to prevent duplication
        let account = null;
        try {
            const accountsResp = await api.metatraderAccountApi.getAccountsWithClassicPagination();
            const existingAccounts = Array.isArray(accountsResp) ? accountsResp : (accountsResp?.items || []);
            account = existingAccounts.find(a => 
                String(a.login).trim() === String(login).trim() && 
                String(a.server).trim().toLowerCase() === String(server).trim().toLowerCase()
            );
        } catch (searchErr) {
            console.warn('⚠️ Could not search existing MetaApi accounts:', searchErr.message);
        }

        if (!account) {
            const accountData = {
                name: accountName || `JTG-${login}`,
                type: 'cloud',
                login: String(login).trim(),
                password: String(password).trim(),
                server: String(server).trim(),
                platform: platform.toLowerCase() === 'mt4' ? 'mt4' : 'mt5',
                magic: 0,
                reliability: 'high'
            };
            account = await api.metatraderAccountApi.createAccount(accountData);
            console.log(`✅ MetaApi Account created with ID: ${account.id}.`);
        } else {
            console.log(`ℹ️ MetaApi Account already exists with ID: ${account.id}.`);
        }

        // 3. Trigger account deployment on MetaApi
        if (account.state !== 'DEPLOYED' && account.state !== 'DEPLOYING') {
            await account.deploy();
        }

        // 4. Update user_settings in Firestore with cloud account metadata
        if (admin.apps.length) {
            const db = admin.firestore();
            await db.collection('user_settings').doc(userId).set({
                metaAccountId: account.id,
                metaAccountLogin: String(login).trim(),
                metaAccountServer: String(server).trim(),
                metaAccountPlatform: platform.toLowerCase() === 'mt4' ? 'mt4' : 'mt5',
                metaAccountState: 'DEPLOYING',
                metaAccountConnectedAt: new Date().toISOString(),
                cloudSyncEnabled: true
            }, { merge: true });
        }

        return res.status(200).json({
            success: true,
            accountId: account.id,
            state: account.state,
            connectionStatus: account.connectionStatus,
            message: 'MetaApi Account provisioned and deployment initiated successfully!'
        });

    } catch (error) {
        console.error('❌ MetaApi Connect Error:', error);
        return res.status(500).json({ 
            error: error.message || 'Failed to connect account to MetaApi Cloud.',
            details: error.details || null
        });
    }
}
