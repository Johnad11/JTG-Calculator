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
    // 1. Enable CORS dynamically to support credentials and client origins
    const origin = req.headers.origin;
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Content-Type, Authorization'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    if (!idToken) {
        return res.status(401).json({ error: 'Missing ID Token' });
    }

    try {
        if (admin.apps.length) {
            await admin.auth().verifyIdToken(idToken);
        } else {
            console.warn("⚠️ Firebase Admin not initialized, skipping token verification in development.");
        }
    } catch (authError) {
        console.error("Error verifying ID Token in Chat API:", authError);
        return res.status(401).json({ error: 'Unauthorized: Invalid ID Token' });
    }

    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Messages array is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ 
            error: 'Gemini API Key is not configured on the server.',
            fallback: true
        });
    }

    try {
        // Map messages to Gemini REST API contents format
        // Gemini contents roles are: "user" and "model"
        const contents = messages.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents,
                systemInstruction: {
                    parts: [{
                        text: "You are the JTG Ecosystem AI Assistant. You answer user questions about the JTG Journal, MT5 Auto-Sync, calculations, and prop firms. Keep answers helpful and concise (maximum 3-4 sentences). For complex technical questions, account setup errors, custom EA code requests, or billing/payment issues, always refer the user to our Discord server: https://discord.gg/TkP8dR74"
                    }]
                },
                generationConfig: {
                    maxOutputTokens: 300,
                    temperature: 0.7
                }
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            console.error("Gemini API Error details:", errData);
            throw new Error(`Gemini API responded with status ${response.status}`);
        }

        const data = await response.json();
        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";
        
        return res.status(200).json({ reply: replyText });
    } catch (err) {
        console.error("Error in AI Chat handler:", err);
        return res.status(500).json({ error: err.message });
    }
}
