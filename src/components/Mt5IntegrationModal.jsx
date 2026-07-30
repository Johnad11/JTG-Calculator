import React, { useState, useEffect } from 'react';
import { db } from '../firebase';

// ============================================================================
// INLINE SVG ICONS
// ============================================================================

const LockIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);

const KeyIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
);

const CopyIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
);

const RefreshCwIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
        <path d="M16 16h5v5" />
    </svg>
);

const EyeIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const EyeOffIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
        <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
        <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
);

const AlertTriangleIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1="12" x2="12" y1="9" y2="13" />
        <line x1="12" x2="12.01" y1="17" y2="17" />
    </svg>
);

const XIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" x2="6" y1="6" y2="18" />
        <line x1="6" x2="18" y1="6" y2="18" />
    </svg>
);

const DownloadIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
);

const DiscordIcon = ({ className }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
    </svg>
);

const PremiumStarIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
);

const ChevronDownIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

const ChevronUpIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="18 15 12 9 6 15" />
    </svg>
);

const CloudIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.5 19x-9 0a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    </svg>
);

// ============================================================================
// MAIN COMPONENT DEFINITION
// ============================================================================

const Mt5IntegrationModal = ({ user, isPremium = false, userSettings, triggerUpgrade, close }) => {
    const isEmailAdmin = (user?.email && user.email.toLowerCase() === "nwabuezejohnad11@gmail.com") || (userSettings?.username && userSettings.username.toLowerCase() === "nwabuezejohnad11");
    const initialTier = isEmailAdmin ? 'diamond' : (userSettings?.planTier || (isPremium ? 'gold' : 'free'));

    const [activeTab, setActiveTab] = useState('cloud');
    
    // EA State
    const [syncKey, setSyncKey] = useState('');
    const [isRevealed, setIsRevealed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [openAccordion, setOpenAccordion] = useState('steps');

    // Cloud 24/7 State
    const [cloudPlatform, setCloudPlatform] = useState('mt5');
    const [cloudServer, setCloudServer] = useState('');
    const [cloudLogin, setCloudLogin] = useState('');
    const [cloudPassword, setCloudPassword] = useState('');
    const [cloudName, setCloudName] = useState('');
    const [cloudStatus, setCloudStatus] = useState(null);
    const [isConnectingCloud, setIsConnectingCloud] = useState(false);
    const [isSyncingCloud, setIsSyncingCloud] = useState(false);
    const [userPlanTier, setUserPlanTier] = useState(initialTier);
    const [cloudFeedback, setCloudFeedback] = useState(null);
    const [showCloudPassword, setShowCloudPassword] = useState(false);

    useEffect(() => {
        if (!user || !isPremium) {
            setLoading(false);
            return;
        }
        
        const fetchUserData = async () => {
            try {
                setLoading(true);
                const doc = await db.collection('user_settings').doc(user.uid).get();
                if (doc.exists) {
                    const data = doc.data();
                    const isAdmin = isEmailAdmin || (data.email && data.email.toLowerCase() === "nwabuezejohnad11@gmail.com") || (data.username && data.username.toLowerCase() === "nwabuezejohnad11");
                    const tier = isAdmin ? 'diamond' : (data.planTier || 'gold');
                    setUserPlanTier(tier);

                    setSyncKey(data.mt5SyncKey || '');
                    if (data.metaAccountId) {
                        setCloudStatus({
                            connected: true,
                            accountId: data.metaAccountId,
                            login: data.metaAccountLogin || 'Connected',
                            server: data.metaAccountServer || 'MT Cloud',
                            platform: data.metaAccountPlatform || 'mt5',
                            state: data.metaAccountState || 'CONNECTED',
                            lastSync: data.lastSyncTimeStr || 'Pending'
                        });
                    }
                }
            } catch (err) {
                console.error("Error fetching integration settings:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [user, isPremium]);

    // Handle Cloud 24/7 Account Connect
    const handleConnectCloud = async (e) => {
        e.preventDefault();
        if (!cloudServer || !cloudLogin || !cloudPassword) {
            setCloudFeedback({ type: 'error', message: 'Please fill in Broker Server, Account Number, and Investor Password.' });
            return;
        }

        setIsConnectingCloud(true);
        setCloudFeedback({ type: 'info', message: 'Provisioning MetaApi Cloud Instance... (this may take ~10-15 seconds)' });

        try {
            const res = await fetch('/api/metaapi-connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.uid,
                    login: cloudLogin,
                    password: cloudPassword,
                    server: cloudServer,
                    platform: cloudPlatform,
                    accountName: cloudName || `JTG-${cloudLogin}`
                })
            });

            const data = await res.json();
            if (!res.ok || data.error) {
                throw new Error(data.error || 'Failed to connect MetaApi cloud account.');
            }

            setCloudFeedback({ type: 'success', message: '🎉 Account connected! Deploying 24/7 cloud sync instance...' });
            setCloudStatus({
                connected: true,
                accountId: data.accountId,
                login: cloudLogin,
                server: cloudServer,
                platform: cloudPlatform,
                state: data.state || 'DEPLOYING'
            });

            // Trigger an initial sync shortly after
            setTimeout(() => {
                handleSyncCloudNow();
            }, 3000);

        } catch (err) {
            console.error('Cloud Connect Error:', err);
            setCloudFeedback({ type: 'error', message: err.message });
        } finally {
            setIsConnectingCloud(false);
        }
    };

    // Handle Manual Trigger Sync Now for Cloud Account
    const handleSyncCloudNow = async () => {
        setIsSyncingCloud(true);
        setCloudFeedback({ type: 'info', message: 'Fetching latest trades from MT4/MT5 Cloud...' });

        try {
            const res = await fetch('/api/metaapi-sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.uid })
            });

            const data = await res.json();
            if (!res.ok || data.error) {
                throw new Error(data.error || 'Sync failed.');
            }

            setCloudFeedback({ 
                type: 'success', 
                message: `✅ Successfully synced ${data.syncedCount || 0} trades! Balance: $${data.balance || 0}` 
            });

            if (cloudStatus) {
                setCloudStatus(prev => ({ ...prev, lastSync: data.lastSyncTime || 'Just now', state: 'CONNECTED' }));
            }

        } catch (err) {
            console.error('Cloud Sync Error:', err);
            setCloudFeedback({ type: 'error', message: err.message });
        } finally {
            setIsSyncingCloud(false);
        }
    };

    // Handle Disconnect Cloud Account
    const handleDisconnectCloud = async () => {
        if (!window.confirm('Are you sure you want to disconnect your 24/7 cloud sync account?')) return;
        setIsConnectingCloud(true);
        try {
            const res = await fetch(`/api/metaapi-status?userId=${user.uid}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                setCloudStatus(null);
                setCloudFeedback({ type: 'success', message: 'Cloud account disconnected successfully.' });
            }
        } catch (err) {
            setCloudFeedback({ type: 'error', message: err.message });
        } finally {
            setIsConnectingCloud(false);
        }
    };

    const handleGenerateKey = async () => {
        if (!user) return;
        setIsGenerating(true);
        try {
            const part1 = Math.random().toString(36).substring(2, 10).toUpperCase();
            const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
            const newKey = `JTG-${part1}-${part2}`;

            await db.collection('user_settings').doc(user.uid).set({
                mt5SyncKey: newKey,
                mt5SyncKeyGeneratedAt: new Date().toISOString()
            }, { merge: true });

            setSyncKey(newKey);
            setIsRevealed(true);
        } catch (err) {
            console.error("Error generating sync key:", err);
            alert("Failed to generate sync key: " + err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopyKey = () => {
        if (!syncKey) return;
        navigator.clipboard.writeText(syncKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getMaskedKey = () => {
        if (!syncKey) return "No key generated";
        if (isRevealed) return syncKey;
        const parts = syncKey.split('-');
        if (parts.length >= 3) return `${parts[0]}-••••••••-••••`;
        return "JTG-••••-••••";
    };

    const hasKey = !!syncKey;

    // ========================================================================
    // RENDER: PAYWALL SCREEN FOR NON-PREMIUM USERS
    // ========================================================================
    if (!isPremium) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
                <div className="bg-[#0b0f26]/95 border border-[#162C99]/50 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col relative animate-pop backdrop-blur-xl">
                    <button 
                        onClick={close} 
                        className="absolute top-4 right-4 text-slate-400 hover:text-white hover:bg-[#111633]/60 p-1.5 rounded-lg transition-all"
                        aria-label="Close"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>

                    <div className="bg-gradient-to-r from-[#1BA657]/15 to-[#162C99]/20 p-6 border-b border-[#162C99]/25 flex flex-col items-center text-center gap-1.5">
                        <div className="relative p-3 bg-[#111633] border border-[#162C99]/40 text-[#1BA657] rounded-full shadow-[0_0_20px_rgba(27,166,87,0.2)]">
                            <LockIcon className="w-6 h-6 animate-pulse" />
                            <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-[8px] w-4 h-4 rounded-full flex items-center justify-center border border-jtg-dark font-extrabold shadow-md">★</span>
                        </div>
                        <h2 className="text-white font-extrabold text-xl tracking-wide mt-2 uppercase flex items-center gap-2">
                            MT4 / MT5 Auto-Sync
                        </h2>
                        <span className="bg-[#1BA657]/10 border border-[#1BA657]/30 text-[#1BA657] text-[9px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full">
                            PRO TIER EXCLUSIVE
                        </span>
                    </div>

                    <div className="p-6 flex flex-col gap-4">
                        <p className="text-slate-300 text-xs text-center leading-relaxed max-w-sm mx-auto mb-1">
                            Unlock automated real-time trade journaling. Connect your account via 24/7 Cloud Sync (No PC needed) or via desktop MT5 EA.
                        </p>

                        <div className="flex flex-col gap-3">
                            <div className="bg-[#111633]/60 border border-[#162C99]/20 rounded-xl p-3 flex gap-3 items-start">
                                <div className="p-2 bg-[#1BA657]/10 rounded-lg text-[#1BA657] shrink-0">
                                    <PremiumStarIcon className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col">
                                    <h4 className="text-white font-bold text-xs uppercase tracking-wide">24/7 Cloud Sync (No PC Needed)</h4>
                                    <span className="text-slate-400 text-[11px] leading-relaxed mt-0.5">Connect via Read-Only Investor Password. Your trades sync 24/7 even when your laptop and phone are turned off.</span>
                                </div>
                            </div>

                            <div className="bg-[#111633]/60 border border-[#162C99]/20 rounded-xl p-3 flex gap-3 items-start">
                                <div className="p-2 bg-[#1BA657]/10 rounded-lg text-[#1BA657] shrink-0">
                                    <KeyIcon className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col">
                                    <h4 className="text-white font-bold text-xs uppercase tracking-wide">Desktop MT5 Expert Advisor</h4>
                                    <span className="text-slate-400 text-[11px] leading-relaxed mt-0.5">Custom electric green chart HUD dashboard with on-chart risk calculators and session heatmaps.</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 mt-4">
                            <button
                                onClick={() => { close(); triggerUpgrade(); }}
                                className="w-full py-3.5 bg-gradient-to-r from-[#1BA657] to-emerald-400 hover:from-[#158C47] hover:to-emerald-500 active:scale-[0.98] text-black font-extrabold text-xs tracking-wider rounded-xl transition-all duration-200 shadow-lg shadow-[#1BA657]/10 flex items-center justify-center gap-2 uppercase"
                            >
                                <LockIcon className="w-4 h-4" />
                                Unlock Auto-Sync (₦800/mo)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ========================================================================
    // RENDER: UNLOCKED DEV DASHBOARD (2 TABS: CLOUD 24/7 vs EA DESKTOP)
    // ========================================================================
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-[#0b0f26]/95 border border-[#162C99]/50 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col relative animate-pop backdrop-blur-xl">
                
                {/* Close Button */}
                <button 
                    onClick={close} 
                    className="absolute top-4 right-4 text-slate-400 hover:text-white hover:bg-[#111633]/60 p-1.5 rounded-lg transition-all"
                    aria-label="Close"
                >
                    <XIcon className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="bg-gradient-to-r from-[#1BA657]/10 to-[#162C99]/10 p-6 border-b border-[#162C99]/20 flex flex-col gap-3 pr-14">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-[#1BA657]/15 rounded-xl border border-[#1BA657]/30 text-[#1BA657] shadow-[0_0_15px_rgba(27,166,87,0.15)] animate-pulse">
                            <PremiumStarIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-white font-extrabold text-xl">MetaTrader Auto-Sync Center</h2>
                            <span className="text-[10px] text-[#1BA657] font-bold tracking-widest uppercase flex items-center gap-1.5 mt-0.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#1BA657] animate-ping"></span>
                                PRO Tier Active
                            </span>
                        </div>
                    </div>

                    {/* TWO-TAB NAVIGATOR */}
                    <div className="flex bg-[#0a0e29] p-1 rounded-xl border border-[#162C99]/30 mt-1">
                        <button
                            onClick={() => setActiveTab('cloud')}
                            className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                activeTab === 'cloud' 
                                    ? 'bg-[#1BA657] text-black shadow-md font-extrabold' 
                                    : 'text-slate-400 hover:text-white hover:bg-[#111633]'
                            }`}
                        >
                            <span>☁️ 24/7 Cloud Sync</span>
                            <span className="bg-black/20 text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase">No PC Needed</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('ea')}
                            className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                activeTab === 'ea' 
                                    ? 'bg-[#1BA657] text-black shadow-md font-extrabold' 
                                    : 'text-slate-400 hover:text-white hover:bg-[#111633]'
                            }`}
                        >
                            <span>🖥️ Desktop MT5 EA</span>
                            <span className="bg-black/20 text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase">On-Chart HUD</span>
                        </button>
                    </div>
                </div>

                {/* Body Content */}
                <div className="p-6 flex flex-col gap-6 overflow-y-auto max-h-[70vh] custom-scroll">
                    
                    {/* ==================================================================== */}
                    {/* TAB 1: 24/7 CLOUD SYNC (NO PC REQUIRED)                             */}
                    {/* ==================================================================== */}
                    {activeTab === 'cloud' && (
                        <div className="flex flex-col gap-5">
                            {/* Diamond Tier Upgrade Lock Banner */}
                            {userPlanTier !== 'diamond' && (
                                <div className="bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border border-cyan-500/40 p-5 rounded-2xl flex flex-col gap-3 shadow-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-xl shrink-0">
                                            <LockIcon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-extrabold text-sm uppercase">Diamond Tier Feature</h4>
                                            <p className="text-slate-300 text-xs mt-0.5 leading-relaxed">
                                                You are currently on the Gold Plan (Desktop MT5 EA). Upgrade to Diamond ($1.50 / ₦2,450 per month) to enable 24/7 Cloud Sync without keeping a PC running!
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { close(); triggerUpgrade(); }}
                                        className="w-full py-3 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition shadow-md flex items-center justify-center gap-2"
                                    >
                                        <span>Upgrade to Diamond Tier ($1.50 / ₦2,450/mo)</span>
                                    </button>
                                </div>
                            )}

                            {/* Feedback Banner */}
                            {cloudFeedback && (
                                <div className={`p-4 rounded-xl border text-xs font-medium flex items-center justify-between gap-3 ${
                                    cloudFeedback.type === 'error' ? 'bg-red-950/40 border-red-900/50 text-red-300' :
                                    cloudFeedback.type === 'success' ? 'bg-emerald-950/40 border-emerald-900/50 text-emerald-300' :
                                    'bg-blue-950/40 border-blue-900/50 text-blue-300 animate-pulse'
                                }`}>
                                    <span>{cloudFeedback.message}</span>
                                    <button onClick={() => setCloudFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
                                </div>
                            )}

                            {/* Connected Account Status Card */}
                            {cloudStatus && cloudStatus.connected ? (
                                <div className="bg-[#111633]/70 border border-[#1BA657]/40 rounded-xl p-5 flex flex-col gap-4 shadow-lg shadow-[#1BA657]/5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-3 w-3 rounded-full bg-[#1BA657] animate-ping relative">
                                                <span className="h-3 w-3 rounded-full bg-[#1BA657] absolute inset-0"></span>
                                            </div>
                                            <div>
                                                <h4 className="text-white font-extrabold text-sm uppercase tracking-wide">
                                                    Connected ({cloudStatus.platform.toUpperCase()}) - {cloudStatus.login}
                                                </h4>
                                                <p className="text-[11px] text-slate-400">Server: <strong className="text-slate-200">{cloudStatus.server}</strong></p>
                                            </div>
                                        </div>
                                        <span className="bg-[#1BA657]/15 border border-[#1BA657]/30 text-[#1BA657] text-[10px] font-extrabold px-3 py-1 rounded-full uppercase">
                                            24/7 ACTIVE
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-slate-400 bg-[#0a0e29] p-3 rounded-lg border border-[#162C99]/20 font-mono">
                                        <span>Last Auto-Sync: <strong className="text-white">{cloudStatus.lastSync || 'Active'}</strong></span>
                                        <span>Status: <strong className="text-[#1BA657]">{cloudStatus.state}</strong></span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mt-1">
                                        <button
                                            onClick={handleSyncCloudNow}
                                            disabled={isSyncingCloud}
                                            className="py-3 bg-[#1BA657] hover:bg-[#158C47] text-black font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2 uppercase shadow-md"
                                        >
                                            <RefreshCwIcon className={`w-4 h-4 ${isSyncingCloud ? 'animate-spin' : ''}`} />
                                            {isSyncingCloud ? 'Syncing...' : 'Sync Trades Now'}
                                        </button>

                                        <button
                                            onClick={handleDisconnectCloud}
                                            disabled={isConnectingCloud}
                                            className="py-3 border border-red-500/40 text-red-400 hover:bg-red-500/10 font-bold text-xs rounded-xl transition-all uppercase"
                                        >
                                            Disconnect Account
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* Cloud Account Setup Form */
                                <form onSubmit={handleConnectCloud} className="bg-[#111633]/45 border border-[#162C99]/25 rounded-xl p-5 flex flex-col gap-4">
                                    <div>
                                        <h3 className="text-white text-sm font-extrabold uppercase tracking-wider flex items-center gap-2">
                                            <span>Connect MT4/MT5 Cloud Account</span>
                                        </h3>
                                        <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                                            Enter your trading account details with your <strong>Investor (Read-Only) Password</strong>. Your trades will auto-sync 24/7 without needing a PC!
                                        </p>
                                    </div>

                                    {/* Platform selector */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-bold text-slate-300 uppercase">Trading Platform</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setCloudPlatform('mt5')}
                                                className={`py-2.5 rounded-lg text-xs font-bold border transition-all ${
                                                    cloudPlatform === 'mt5' 
                                                        ? 'bg-[#162C99] border-[#1BA657] text-white' 
                                                        : 'bg-[#0a0e29] border-[#162C99]/30 text-slate-400 hover:text-white'
                                                }`}
                                            >
                                                MetaTrader 5 (MT5)
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setCloudPlatform('mt4')}
                                                className={`py-2.5 rounded-lg text-xs font-bold border transition-all ${
                                                    cloudPlatform === 'mt4' 
                                                        ? 'bg-[#162C99] border-[#1BA657] text-white' 
                                                        : 'bg-[#0a0e29] border-[#162C99]/30 text-slate-400 hover:text-white'
                                                }`}
                                            >
                                                MetaTrader 4 (MT4)
                                            </button>
                                        </div>
                                    </div>

                                    {/* Broker Server */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-bold text-slate-300 uppercase">
                                            Broker Server Name <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. ICMarketsSC-Live01 or Deriv-Server"
                                            value={cloudServer}
                                            onChange={(e) => setCloudServer(e.target.value)}
                                            className="bg-[#0a0e29] border border-[#162C99]/40 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#1BA657] transition"
                                        />
                                        <span className="text-[10px] text-slate-500">Must match the exact server name shown on your MT4/MT5 login window.</span>
                                    </div>

                                    {/* Account Login Number & Investor Password */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[11px] font-bold text-slate-300 uppercase">
                                                Account Login # <span className="text-red-400">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                required
                                                placeholder="e.g. 1234567"
                                                value={cloudLogin}
                                                onChange={(e) => setCloudLogin(e.target.value)}
                                                className="bg-[#0a0e29] border border-[#162C99]/40 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#1BA657] transition font-mono"
                                            />
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[11px] font-bold text-slate-300 uppercase">
                                                Investor Password <span className="text-red-400">*</span>
                                            </label>
                                            <div className="relative flex items-center">
                                                <input
                                                    type={showCloudPassword ? 'text' : 'password'}
                                                    required
                                                    placeholder="Read-Only Password"
                                                    value={cloudPassword}
                                                    onChange={(e) => setCloudPassword(e.target.value)}
                                                    className="w-full bg-[#0a0e29] border border-[#162C99]/40 rounded-xl p-3 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#1BA657] transition font-mono"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCloudPassword(!showCloudPassword)}
                                                    className="absolute right-3 text-slate-400 hover:text-white"
                                                >
                                                    {showCloudPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Security Notice */}
                                    <div className="flex gap-2.5 text-slate-400 bg-[#0a0e29] border border-[#162C99]/20 p-3 rounded-xl text-[11px] leading-relaxed">
                                        <LockIcon className="w-4 h-4 text-[#1BA657] shrink-0 mt-0.5" />
                                        <span>
                                            <strong>Safe & Read-Only:</strong> Investor passwords only grant permission to <em>read</em> trade history. It is impossible to execute trades or withdraw funds with an investor password.
                                        </span>
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={isConnectingCloud}
                                        className="w-full py-3.5 bg-gradient-to-r from-[#1BA657] to-emerald-400 hover:from-[#158C47] hover:to-emerald-500 text-black font-extrabold text-xs tracking-wider rounded-xl transition-all duration-200 shadow-lg shadow-[#1BA657]/10 flex items-center justify-center gap-2 uppercase mt-2 disabled:opacity-50"
                                    >
                                        <RefreshCwIcon className={`w-4 h-4 ${isConnectingCloud ? 'animate-spin' : ''}`} />
                                        {isConnectingCloud ? 'Connecting to MetaApi Cloud...' : 'Connect 24/7 Cloud Sync'}
                                    </button>
                                </form>
                            )}
                        </div>
                    )}

                    {/* ==================================================================== */}
                    {/* TAB 2: DESKTOP MT5 EA INTEGRATION                                    */}
                    {/* ==================================================================== */}
                    {activeTab === 'ea' && (
                        <div className="flex flex-col gap-6">
                            {/* Sync Status & Key Handler */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
                                <div className="md:col-span-5 bg-[#111633]/70 border border-[#162C99]/30 rounded-xl p-4 flex flex-col justify-between shadow-inner">
                                    <div>
                                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Terminal Connection</span>
                                        <div className="flex items-center gap-2.5 mt-2">
                                            <span className="h-3 w-3 rounded-full relative flex shrink-0">
                                                {hasKey && (
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1BA657] opacity-75"></span>
                                                )}
                                                <span className={`relative inline-flex rounded-full h-3 w-3 ${hasKey ? 'bg-[#1BA657]' : 'bg-slate-600'}`}></span>
                                            </span>
                                            <span className="text-sm font-extrabold text-slate-200 tracking-wide uppercase">
                                                {hasKey ? 'Sync Ready' : 'Sync Disconnected'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4 pt-3 border-t border-[#162C99]/20 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                                        <span>TYPE: MT5 EA CONNECT</span>
                                        <span className="bg-slate-950/60 px-2 py-0.5 rounded border border-slate-900 text-[#1BA657]">
                                            {hasKey ? 'PRO LIVE' : 'NO LINK'}
                                        </span>
                                    </div>
                                </div>

                                <div className="md:col-span-7 flex flex-col gap-2 bg-[#111633]/30 border border-[#162C99]/15 rounded-xl p-4 shadow-inner">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                                            Your Private Sync Key
                                        </label>
                                        {hasKey && (
                                            <span className="text-[9px] font-semibold text-slate-500 font-mono">
                                                {isRevealed ? 'REVEALED' : 'HIDDEN'}
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center justify-between bg-[#0a0e29] border border-[#162C99]/30 rounded-xl p-3">
                                        {loading ? (
                                            <div className="text-slate-500 font-mono text-xs w-full text-center py-1 flex items-center justify-center gap-2">
                                                <RefreshCwIcon className="w-3.5 h-3.5 animate-spin text-[#1BA657]" />
                                                <span>Loading key...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="font-mono text-xs tracking-widest flex-1 overflow-x-auto text-white font-bold select-all">
                                                    {getMaskedKey()}
                                                </span>
                                                {hasKey && (
                                                    <button 
                                                        onClick={() => setIsRevealed(!isRevealed)}
                                                        className="text-slate-400 hover:text-white transition p-1.5 ml-1.5"
                                                    >
                                                        {isRevealed ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mt-1">
                                        <button
                                            onClick={handleGenerateKey}
                                            disabled={isGenerating || loading}
                                            className="py-2.5 bg-[#1BA657] hover:bg-[#158C47] text-black font-extrabold text-[11px] rounded-lg transition-all flex items-center justify-center gap-1.5 uppercase"
                                        >
                                            <RefreshCwIcon className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                                            {hasKey ? 'Regenerate' : 'Generate Key'}
                                        </button>

                                        <button
                                            onClick={handleCopyKey}
                                            disabled={!hasKey}
                                            className="py-2.5 border border-[#1BA657] text-[#1BA657] hover:bg-[#1BA657]/10 font-extrabold text-[11px] rounded-lg transition-all flex items-center justify-center gap-1.5 uppercase"
                                        >
                                            <CopyIcon className="w-3.5 h-3.5" />
                                            {copied ? 'Copied! ✅' : 'Copy Key'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Download Package */}
                            <div className="bg-[#111633]/45 border border-[#162C99]/25 rounded-xl p-5 flex flex-col gap-4">
                                <h3 className="text-white text-xs font-bold uppercase tracking-wider">EA Download Package</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <a 
                                        href="/JTG_Journal_EA.ex5" 
                                        download="JTG_Journal_EA.ex5"
                                        className="group flex flex-col justify-between bg-[#0f142b] border border-[#162C99]/30 hover:border-[#1BA657]/60 rounded-xl p-4 transition-all"
                                    >
                                        <div>
                                            <span className="bg-[#1BA657]/15 text-[#1BA657] text-[9px] font-bold px-2 py-0.5 rounded-full">EX5 BINARY</span>
                                            <h4 className="text-white font-extrabold text-sm mt-2">JTG_Journal_EA.ex5</h4>
                                            <p className="text-[11px] text-slate-400 mt-1">Compiled Expert Advisor with on-chart HUD.</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#1BA657] mt-4 pt-2 border-t border-[#162C99]/15">
                                            <DownloadIcon className="w-3.5 h-3.5" />
                                            <span>Download EA File</span>
                                        </div>
                                    </a>

                                    <a 
                                        href="/JTG_EA_Readme.txt" 
                                        download="JTG_EA_Readme.txt"
                                        className="group flex flex-col justify-between bg-[#0f142b] border border-[#162C99]/30 hover:border-[#1BA657]/60 rounded-xl p-4 transition-all"
                                    >
                                        <div>
                                            <span className="bg-slate-800 text-slate-300 text-[9px] font-bold px-2 py-0.5 rounded-full">ASCII TXT</span>
                                            <h4 className="text-white font-extrabold text-sm mt-2">JTG_EA_Readme.txt</h4>
                                            <p className="text-[11px] text-slate-400 mt-1">Whitelisting setup manual.</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#1BA657] mt-4 pt-2 border-t border-[#162C99]/15">
                                            <DownloadIcon className="w-3.5 h-3.5" />
                                            <span>Download Manual</span>
                                        </div>
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Discord Support */}
                    <div className="bg-[#111633]/30 border border-[#162C99]/20 rounded-xl p-4 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-400 text-xs font-medium">Need setup assistance or broker whitelist help?</span>
                            <a 
                                href="https://discord.gg/TkP8dR74"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-1.5 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-xs rounded-lg transition"
                            >
                                <DiscordIcon className="w-4 h-4" />
                                Discord Server
                            </a>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Mt5IntegrationModal;
