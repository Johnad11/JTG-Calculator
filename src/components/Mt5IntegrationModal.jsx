import React, { useState, useEffect } from 'react';
import { db } from '../firebase';

// ============================================================================
// INLINE HIGH-PERFORMANCE SVG ICONS (Zero-dependency & completely scalable)
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

// ============================================================================
// MAIN COMPONENT DEFINITION
// ============================================================================

const Mt5IntegrationModal = ({ user, isPremium = false, triggerUpgrade, close }) => {
    const [syncKey, setSyncKey] = useState('');
    const [isRevealed, setIsRevealed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [openAccordion, setOpenAccordion] = useState('steps'); // 'features', 'steps', 'broker'

    useEffect(() => {
        if (!user || !isPremium) {
            setLoading(false);
            return;
        }
        
        const fetchKey = async () => {
            try {
                setLoading(true);
                const doc = await db.collection('user_settings').doc(user.uid).get();
                if (doc.exists) {
                    setSyncKey(doc.data().mt5SyncKey || '');
                }
            } catch (err) {
                console.error("Error fetching sync key:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchKey();
    }, [user, isPremium]);

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
            setIsRevealed(true); // Reveal immediately on generation for ease of copying
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
        setTimeout(() => {
            setCopied(false);
        }, 2000);
    };

    const getMaskedKey = () => {
        if (!syncKey) return "No key generated";
        if (isRevealed) return syncKey;
        
        const parts = syncKey.split('-');
        if (parts.length >= 3) {
            return `${parts[0]}-••••••••-••••`;
        }
        return "JTG-••••-••••";
    };

    const hasKey = !!syncKey;

    // ========================================================================
    // RENDER: PREMIUM LOCKED PAYWALL SCREEN
    // ========================================================================
    if (!isPremium) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
                <div className="bg-[#0b0f26]/95 border border-[#162C99]/50 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col relative animate-pop backdrop-blur-xl">
                    
                    {/* Close Button absolute top-right */}
                    <button 
                        onClick={close} 
                        className="absolute top-4 right-4 text-slate-400 hover:text-white hover:bg-[#111633]/60 p-1.5 rounded-lg transition-all"
                        aria-label="Close"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>

                    {/* Paywall Header */}
                    <div className="bg-gradient-to-r from-[#1BA657]/15 to-[#162C99]/20 p-6 border-b border-[#162C99]/25 flex flex-col items-center text-center gap-1.5">
                        <div className="relative p-3 bg-[#111633] border border-[#162C99]/40 text-[#1BA657] rounded-full shadow-[0_0_20px_rgba(27,166,87,0.2)]">
                            <LockIcon className="w-6 h-6 animate-pulse" />
                            <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-[8px] w-4 h-4 rounded-full flex items-center justify-center border border-jtg-dark font-extrabold shadow-md">★</span>
                        </div>
                        <h2 className="text-white font-extrabold text-xl tracking-wide mt-2 uppercase flex items-center gap-2">
                            MT5 Auto-Sync integration
                        </h2>
                        <span className="bg-[#1BA657]/10 border border-[#1BA657]/30 text-[#1BA657] text-[9px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full">
                            PRO TIER EXCLUSIVE
                        </span>
                    </div>

                    {/* Feature Selling Points */}
                    <div className="p-6 flex flex-col gap-4">
                        <p className="text-slate-300 text-xs text-center leading-relaxed max-w-sm mx-auto mb-1">
                            Unlock automated real-time trade journaling. Connect your PC terminal directly to your web application, eliminating manual data logging forever!
                        </p>

                        <div className="flex flex-col gap-3">
                            <div className="bg-[#111633]/60 border border-[#162C99]/20 rounded-xl p-3 flex gap-3 items-start hover:border-[#1BA657]/30 transition-all duration-300">
                                <div className="p-2 bg-[#1BA657]/10 rounded-lg text-[#1BA657] shrink-0">
                                    <PremiumStarIcon className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col">
                                    <h4 className="text-white font-bold text-xs uppercase tracking-wide">Neon-Glow Vector HUD Overlay</h4>
                                    <span className="text-slate-400 text-[11px] leading-relaxed mt-0.5">High-tech foreground chart companion with customized electric green HUD layout drawing graphics directly on your candles.</span>
                                </div>
                            </div>

                            <div className="bg-[#111633]/60 border border-[#162C99]/20 rounded-xl p-3 flex gap-3 items-start hover:border-[#1BA657]/30 transition-all duration-300">
                                <div className="p-2 bg-[#1BA657]/10 rounded-lg text-[#1BA657] shrink-0">
                                    <KeyIcon className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col">
                                    <h4 className="text-white font-bold text-xs uppercase tracking-wide">6 High-Value Tab Spaces</h4>
                                    <span className="text-slate-400 text-[11px] leading-relaxed mt-0.5">DASH overview, STAT analytics, CAL performance calendar, LOGS historical ledger, RISK dynamic position size planner, and JTG syncing console on-chart.</span>
                                </div>
                            </div>

                            <div className="bg-[#111633]/60 border border-[#162C99]/20 rounded-xl p-3 flex gap-3 items-start hover:border-[#1BA657]/30 transition-all duration-300">
                                <div className="p-2 bg-[#1BA657]/10 rounded-lg text-[#1BA657] shrink-0">
                                    <RefreshCwIcon className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col">
                                    <h4 className="text-white font-bold text-xs uppercase tracking-wide">Automatic 5s Real-Time Sync</h4>
                                    <span className="text-slate-400 text-[11px] leading-relaxed mt-0.5">Your trades sync from your terminal inside MT5 onto your cloud dashboard. Zero lag, zero delays.</span>
                                </div>
                            </div>
                        </div>

                        {/* Paywall CTA Trigger Upgrade */}
                        <div className="flex flex-col gap-2 mt-4">
                            <button
                                onClick={() => {
                                    close();
                                    triggerUpgrade();
                                }}
                                className="w-full py-3.5 bg-gradient-to-r from-[#1BA657] to-emerald-400 hover:from-[#158C47] hover:to-emerald-500 active:scale-[0.98] text-black font-extrabold text-xs tracking-wider rounded-xl transition-all duration-200 shadow-lg shadow-[#1BA657]/10 flex items-center justify-center gap-2 uppercase"
                            >
                                <LockIcon className="w-4 h-4" />
                                Unlock MT5 Auto-Sync (₦800/mo)
                            </button>
                            <p className="text-[10px] text-slate-500 text-center">
                                Unlock trial/subscription options starting with a 14-day free trial.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ========================================================================
    // RENDER: PREMIUM UNLOCKED DEV Setup & Instructions Dashboard
    // ========================================================================
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-[#0b0f26]/95 border border-[#162C99]/50 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col relative animate-pop backdrop-blur-xl">
                
                {/* Close Button absolute top-right */}
                <button 
                    onClick={close} 
                    className="absolute top-4 right-4 text-slate-400 hover:text-white hover:bg-[#111633]/60 p-1.5 rounded-lg transition-all"
                    aria-label="Close"
                >
                    <XIcon className="w-5 h-5" />
                </button>

                {/* Unlocked Header */}
                <div className="bg-gradient-to-r from-[#1BA657]/10 to-[#162C99]/10 p-6 border-b border-[#162C99]/20 flex flex-col gap-1 pr-14">
                    <h2 className="text-white font-extrabold text-xl flex items-center gap-2.5">
                        <div className="p-2 bg-[#1BA657]/15 rounded-xl border border-[#1BA657]/30 text-[#1BA657] shadow-[0_0_15px_rgba(27,166,87,0.15)] animate-pulse">
                            <PremiumStarIcon className="w-5 h-5" />
                        </div>
                        MetaTrader 5 Auto-Sync
                    </h2>
                    <span className="text-[10px] text-[#1BA657] font-bold tracking-widest uppercase pl-12 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#1BA657] animate-ping"></span>
                        Premium Integration Active
                    </span>
                </div>

                {/* Dashboard Core Body Scrollable */}
                <div className="p-6 flex flex-col gap-6 overflow-y-auto max-h-[70vh] custom-scroll">
                    
                    {/* TOP SECTION: Sync Status Indicator & Live Sync Key Setup */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
                        
                        {/* Status Capsule Indicator */}
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

                        {/* Sync Key Handler */}
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
                            
                            <div className="flex items-center justify-between bg-[#0a0e29] border border-[#162C99]/30 rounded-xl p-3 transition-all duration-300 focus-within:border-[#1BA657]/50">
                                {loading ? (
                                    <div className="text-slate-500 font-mono text-xs w-full text-center py-1 flex items-center justify-center gap-2">
                                        <RefreshCwIcon className="w-3.5 h-3.5 animate-spin text-[#1BA657]" />
                                        <span>Fetching configurations...</span>
                                    </div>
                                ) : (
                                    <>
                                        <span className={`font-mono text-xs tracking-widest flex-1 overflow-x-auto custom-scroll pr-2 select-all select-none ${hasKey ? 'text-white font-bold' : 'text-slate-500 italic font-medium'}`}>
                                            {getMaskedKey()}
                                        </span>
                                        {hasKey && (
                                            <button 
                                                onClick={() => setIsRevealed(!isRevealed)}
                                                className="text-slate-400 hover:text-white transition p-1.5 hover:bg-[#111633] rounded-lg border border-transparent hover:border-[#162C99]/30 ml-1.5"
                                                title={isRevealed ? "Hide Key" : "Reveal Key"}
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
                                    className="py-2.5 bg-[#1BA657] hover:bg-[#158C47] active:scale-[0.98] disabled:opacity-50 text-black font-extrabold text-[11px] rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-md shadow-[#1BA657]/5 uppercase"
                                >
                                    <RefreshCwIcon className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                                    {hasKey ? 'Regenerate' : 'Generate Key'}
                                </button>

                                <button
                                    onClick={handleCopyKey}
                                    disabled={!hasKey}
                                    className="py-2.5 border border-[#1BA657] text-[#1BA657] hover:bg-[#1BA657]/10 active:scale-[0.98] disabled:opacity-30 font-extrabold text-[11px] rounded-lg transition-all flex items-center justify-center gap-1.5 uppercase"
                                >
                                    <CopyIcon className="w-3.5 h-3.5" />
                                    {copied ? 'Copied! ✅' : 'Copy Key'}
                                </button>
                            </div>
                        </div>

                    </div>

                    {/* INTERMEDIATE: Security Alert Warning Callout */}
                    <div className="flex gap-3 text-yellow-400 bg-yellow-950/20 border border-yellow-900/30 p-4 rounded-xl text-xs leading-relaxed">
                        <AlertTriangleIcon className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5 animate-pulse" />
                        <div className="flex flex-col gap-0.5">
                            <span className="font-bold uppercase tracking-wider text-[9px] text-yellow-500">Security Warning</span>
                            <span>Do not share this key with anyone. It acts as your server authorization credentials. Regenerate if compromised.</span>
                        </div>
                    </div>

                    {/* SECTION 2: Premium Asset Downloads (.ex5 & readme) */}
                    <div className="bg-[#111633]/45 border border-[#162C99]/25 rounded-xl p-5 flex flex-col gap-4">
                        <div>
                            <h3 className="text-white text-xs font-bold uppercase tracking-wider">1. Premium Downloads Package</h3>
                            <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">Download your premium automated files. These static binaries allow your local computer terminal inside MT5 to establish server handshakes.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* EA Binary Download Card */}
                            <a 
                                href="/JTG_Journal_EA.ex5" 
                                download="JTG_Journal_EA.ex5"
                                className="group flex flex-col justify-between bg-[#0f142b] border border-[#162C99]/30 hover:border-[#1BA657]/60 hover:bg-[#121835] rounded-xl p-4 transition-all duration-300"
                            >
                                <div className="flex items-start justify-between gap-2.5">
                                    <div className="flex flex-col">
                                        <span className="bg-[#1BA657]/15 text-[#1BA657] border border-[#1BA657]/20 text-[9px] font-bold px-2 py-0.5 rounded-full w-max">EX5 BINARY</span>
                                        <h4 className="text-white font-extrabold text-sm mt-2 group-hover:text-[#1BA657] transition-all">JTG_Journal_EA.ex5</h4>
                                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">Compiled Expert Advisor program for MetaTrader 5 on PC. Integrates neon HUD dashboard.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs font-bold text-[#1BA657] mt-4 pt-2.5 border-t border-[#162C99]/15">
                                    <DownloadIcon className="w-3.5 h-3.5 animate-bounce" />
                                    <span>Download EA File</span>
                                </div>
                            </a>

                            {/* Instruction Readme Download Card */}
                            <a 
                                href="/JTG_EA_Readme.txt" 
                                download="JTG_EA_Readme.txt"
                                className="group flex flex-col justify-between bg-[#0f142b] border border-[#162C99]/30 hover:border-[#1BA657]/60 hover:bg-[#121835] rounded-xl p-4 transition-all duration-300"
                            >
                                <div className="flex items-start justify-between gap-2.5">
                                    <div className="flex flex-col">
                                        <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[9px] font-bold px-2 py-0.5 rounded-full w-max">ASCII TXT</span>
                                        <h4 className="text-white font-extrabold text-sm mt-2 group-hover:text-[#1BA657] transition-all">JTG_EA_Readme.txt</h4>
                                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">Comprehensive manual featuring broker whitelisting details, key inputs & feature list.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs font-bold text-[#1BA657] mt-4 pt-2.5 border-t border-[#162C99]/15">
                                    <DownloadIcon className="w-3.5 h-3.5" />
                                    <span>Download Setup Manual</span>
                                </div>
                            </a>
                        </div>
                    </div>

                    {/* SECTION 3: Step-by-Step Accordion Instructions */}
                    <div className="flex flex-col gap-3">
                        <h3 className="text-white text-xs font-bold uppercase tracking-wider px-1">2. Interactive Configuration Manual</h3>
                        
                        <div className="border border-[#162C99]/25 rounded-xl overflow-hidden bg-[#0c102a]/60">
                            
                            {/* Accordion 1: On-Chart Features */}
                            <div className="border-b border-[#162C99]/20">
                                <button 
                                    onClick={() => setOpenAccordion(openAccordion === 'features' ? null : 'features')}
                                    className="w-full px-5 py-4 flex justify-between items-center text-left text-white hover:bg-[#111633]/60 transition-all font-bold text-xs uppercase tracking-wide"
                                >
                                    <span className="flex items-center gap-2">
                                        <span className="text-[#1BA657]">A.</span> On-Chart Features & Visual Panels
                                    </span>
                                    {openAccordion === 'features' ? <ChevronUpIcon className="w-4 h-4 text-[#1BA657]" /> : <ChevronDownIcon className="w-4 h-4 text-slate-500" />}
                                </button>
                                
                                {openAccordion === 'features' && (
                                    <div className="px-5 pb-5 text-slate-300 text-xs leading-relaxed flex flex-col gap-3.5 border-t border-[#162C99]/10 pt-4 bg-[#111633]/20">
                                        <p>The JTG Evolution Expert Advisor (EA) is a fully customized chart HUD dashboard. Features include:</p>
                                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] list-disc list-inside pl-1 text-slate-400">
                                            <li><strong className="text-slate-200">CCanvas Rendering:</strong> Custom foreground HUD displaying growth metrics directly on your charts.</li>
                                            <li><strong className="text-slate-200">Minimizable UI:</strong> Double-click the <code className="bg-slate-900 px-1 py-0.5 text-[#1BA657] font-mono rounded">[-]</code> capsule button to compress the EA layout to a tiny pill.</li>
                                            <li><strong className="text-slate-200">DASH balance curve:</strong> Dynamic net profit display, active win rate (%), and historical equity curves.</li>
                                            <li><strong className="text-slate-200">STAT Analytics:</strong> Sharpe ratio, profit factors, mathematical expectancy, and session heatmaps.</li>
                                            <li><strong className="text-slate-200">CAL Performance Calendar:</strong> 31-day visual calendar grid highlighting winning days in green, loss days in red, and neutral in gray.</li>
                                            <li><strong className="text-slate-200">RISK Calculator:</strong> Live risk percentage sizing with Stop Loss line clicking tool.</li>
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Accordion 2: Linking Steps */}
                            <div className="border-b border-[#162C99]/20">
                                <button 
                                    onClick={() => setOpenAccordion(openAccordion === 'steps' ? null : 'steps')}
                                    className="w-full px-5 py-4 flex justify-between items-center text-left text-white hover:bg-[#111633]/60 transition-all font-bold text-xs uppercase tracking-wide"
                                >
                                    <span className="flex items-center gap-2">
                                        <span className="text-[#1BA657]">B.</span> Web Application Terminal Linking Steps
                                    </span>
                                    {openAccordion === 'steps' ? <ChevronUpIcon className="w-4 h-4 text-[#1BA657]" /> : <ChevronDownIcon className="w-4 h-4 text-slate-500" />}
                                </button>
                                
                                {openAccordion === 'steps' && (
                                    <div className="px-5 pb-5 text-slate-300 text-xs leading-relaxed flex flex-col gap-4 border-t border-[#162C99]/10 pt-4 bg-[#111633]/20">
                                        <div className="flex gap-3">
                                            <div className="bg-[#1BA657]/10 text-[#1BA657] border border-[#1BA657]/20 w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-[10px]">1</div>
                                            <div>
                                                <h5 className="font-extrabold text-white text-xs uppercase">Copy Your Sync Key</h5>
                                                <p className="text-[11px] text-slate-400 mt-0.5">Use the key generator at the top of this modal to copy your unique private sync key.</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <div className="bg-[#1BA657]/10 text-[#1BA657] border border-[#1BA657]/20 w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-[10px]">2</div>
                                            <div>
                                                <h5 className="font-extrabold text-white text-xs uppercase">Allow WebRequests in MetaTrader 5</h5>
                                                <p className="text-[11px] text-slate-400 mt-0.5">
                                                    Inside MT5, go to: <strong className="text-slate-200">Tools -&gt; Options</strong>. Click the <strong className="text-slate-200">Expert Advisors</strong> tab. Check <strong className="text-slate-200">"Allow WebRequest for listed URL:"</strong>. Double-click the <code className="bg-slate-900 px-1 py-0.5 text-[#1BA657] font-mono rounded">+</code> and paste:
                                                    <code className="block bg-slate-900 border border-[#162C99]/20 p-2 font-mono text-[#1BA657] rounded-lg mt-2 text-center text-xs select-all">https://jtg-journals.vercel.app</code>
                                                    Click OK.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <div className="bg-[#1BA657]/10 text-[#1BA657] border border-[#1BA657]/20 w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-[10px]">3</div>
                                            <div>
                                                <h5 className="font-extrabold text-white text-xs uppercase">Deploy the EA on a Live Chart</h5>
                                                <p className="text-[11px] text-slate-400 mt-0.5">
                                                    Drag and drop the <code className="text-slate-200">JTG_Journal_EA.ex5</code> file from your MT5 Navigator (<kbd className="bg-slate-900 border border-slate-700 px-1 text-[10px] rounded font-sans">Ctrl+N</kbd>) onto any active instrument chart. Select the <strong className="text-slate-200">Inputs</strong> tab. In the <code className="text-slate-200">InpTerminalKey</code> property, paste your sync key. Click OK.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <div className="bg-[#1BA657]/10 text-[#1BA657] border border-[#1BA657]/20 w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-[10px]">4</div>
                                            <div>
                                                <h5 className="font-extrabold text-white text-xs uppercase">Handshake Verification</h5>
                                                <p className="text-[11px] text-slate-400 mt-0.5">Click the "JTG" connection tab on the on-chart HUD dashboard. Confirm sync shows green "Success" status. Open or close trades will now replicate inside your web journal automatically in under 5 seconds.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Accordion 3: Broker Policies */}
                            <div>
                                <button 
                                    onClick={() => setOpenAccordion(openAccordion === 'broker' ? null : 'broker')}
                                    className="w-full px-5 py-4 flex justify-between items-center text-left text-white hover:bg-[#111633]/60 transition-all font-bold text-xs uppercase tracking-wide"
                                >
                                    <span className="flex items-center gap-2">
                                        <span className="text-[#1BA657]">C.</span> Critical Broker & Prop Firm Warning
                                    </span>
                                    {openAccordion === 'broker' ? <ChevronUpIcon className="w-4 h-4 text-[#1BA657]" /> : <ChevronDownIcon className="w-4 h-4 text-slate-500" />}
                                </button>
                                
                                {openAccordion === 'broker' && (
                                    <div className="px-5 pb-5 text-slate-300 text-xs leading-relaxed flex flex-col gap-3.5 border-t border-[#162C99]/10 pt-4 bg-[#111633]/20">
                                        <div className="flex gap-3 text-red-400 bg-red-950/20 border border-red-900/30 p-4 rounded-xl text-[11px] leading-relaxed">
                                            <AlertTriangleIcon className="w-4 h-4 text-red-500 shrink-0 mt-0.5 animate-pulse" />
                                            <div className="flex flex-col gap-1">
                                                <span className="font-extrabold uppercase tracking-wider text-[9px] text-red-500">PROHIBITED EA COMPLIANCE NOTE</span>
                                                <p className="text-slate-300 font-medium">WARNING: Do NOT run this EA if your broker prohibits automated Expert Advisors or external network connections. Read your broker's guidelines before whitelisting.</p>
                                                <p className="text-slate-400 leading-relaxed mt-1">Some proprietary firm evaluation accounts ban direct WebRequests or count them as unauthorized connections. Ensure prop firm compliance prior to activation on live funded accounts.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>

                    {/* SECTION 4: Interactive Client Care & Community Support Channels */}
                    <div className="bg-[#111633]/30 border border-[#162C99]/20 rounded-xl p-5 flex flex-col gap-4">
                        <div>
                            <h3 className="text-white text-xs font-bold uppercase tracking-wider">3. Customer Care & Official Communities</h3>
                            <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">Need technical help configuring whitelists, network connections, or setting up key handshakes? Connect directly with our team or our active trader group.</p>
                        </div>

                        <div className="flex justify-center mt-2">
                            {/* Discord Community */}
                            <a 
                                href="https://discord.gg/TkP8dR74"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-[#5865F2] hover:bg-[#4752C4] active:scale-[0.98] text-white font-extrabold text-xs tracking-wider rounded-xl transition-all duration-200 shadow-md shadow-[#5865F2]/10 uppercase"
                            >
                                <DiscordIcon className="w-4.5 h-4.5" />
                                Discord Ecosystem Server
                            </a>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Mt5IntegrationModal;
