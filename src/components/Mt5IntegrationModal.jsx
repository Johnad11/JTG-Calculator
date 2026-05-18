import React, { useState, useEffect } from 'react';
import { db } from '../firebase';

// Inline Lucide-Equivalent SVG Icons for robust performance and zero-dependency compilation
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

const Mt5IntegrationModal = ({ user, close }) => {
    const [syncKey, setSyncKey] = useState('');
    const [isRevealed, setIsRevealed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!user) return;
        
        const fetchKey = async () => {
            try {
                setLoading(true);
                const doc = await db.collection('users').doc(user.uid).collection('settings').doc('integration').get();
                if (doc.exists) {
                    setSyncKey(doc.data().syncKey || '');
                }
            } catch (err) {
                console.error("Error fetching sync key:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchKey();
    }, [user]);

    const handleGenerateKey = async () => {
        if (!user) return;
        setIsGenerating(true);
        try {
            // Generate logic: JTG- + 8 char alphanumeric + - + 4 char alphanumeric
            const part1 = Math.random().toString(36).substring(2, 10).toUpperCase();
            const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
            const newKey = `JTG-${part1}-${part2}`;

            await db.collection('users').doc(user.uid).collection('settings').doc('integration').set({
                syncKey: newKey,
                generatedAt: new Date().toISOString()
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

    // Mask key helper: JTG-••••••••-••••
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-[#111633]/95 border border-[#162C99]/40 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col relative animate-pop backdrop-blur-xl">
                {/* Close Button absolute top-right */}
                <button 
                    onClick={close} 
                    className="absolute top-4 right-4 text-slate-400 hover:text-white hover:bg-[#0a0e29]/60 p-1.5 rounded-lg transition-all"
                    aria-label="Close"
                >
                    <XIcon className="w-5 h-5" />
                </button>

                {/* Header Section */}
                <div className="bg-gradient-to-r from-[#1BA657]/10 to-[#162C99]/10 p-6 border-b border-[#162C99]/20 flex flex-col gap-1 pr-14">
                    <h2 className="text-white font-bold text-xl flex items-center gap-2.5">
                        <div className="p-2 bg-[#1BA657]/15 rounded-xl border border-[#1BA657]/30 text-[#1BA657] shadow-[0_0_15px_rgba(27,166,87,0.15)]">
                            <KeyIcon className="w-5 h-5" />
                        </div>
                        MetaTrader 5 Auto-Sync
                    </h2>
                    <span className="text-[11px] text-[#1BA657] font-semibold tracking-wider uppercase pl-11">
                        EA INTEGRATION PANEL
                    </span>
                </div>

                {/* Body Content */}
                <div className="p-6 flex flex-col gap-5">
                    {/* Explanation */}
                    <p className="text-slate-300 text-sm leading-relaxed">
                        Automate your journaling. Paste your unique Sync Key into the JTG MT5 EA to automatically push your trade history directly to this dashboard.
                    </p>

                    {/* Status Indicator */}
                    <div className="flex items-center justify-between bg-[#0a0e29]/75 border border-[#162C99]/20 rounded-xl p-3.5 shadow-inner">
                        <div className="flex items-center gap-2.5">
                            <span className={`h-3 w-3 rounded-full relative flex`}>
                                {hasKey && (
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1BA657] opacity-75"></span>
                                )}
                                <span className={`relative inline-flex rounded-full h-3 w-3 ${hasKey ? 'bg-[#1BA657]' : 'bg-slate-600'}`}></span>
                            </span>
                            <span className="text-xs font-bold text-slate-200 tracking-wide">
                                {hasKey ? 'Status: Ready for EA' : 'Status: Disconnected'}
                            </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono uppercase bg-slate-950/40 px-2 py-0.5 rounded border border-slate-900">
                            {hasKey ? 'MT5 ACTIVE' : 'NO EA LINK'}
                        </span>
                    </div>

                    {/* Key Display Area */}
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                Your Sync Key
                            </label>
                            {hasKey && (
                                <span className="text-[10px] font-semibold text-slate-500 font-mono">
                                    {isRevealed ? 'REVEALED' : 'HIDDEN'}
                                </span>
                            )}
                        </div>
                        
                        <div className="flex items-center justify-between bg-[#0a0e29] border border-[#162C99]/30 rounded-xl p-4 shadow-inner group transition-all duration-300 focus-within:border-[#1BA657]/50">
                            {loading ? (
                                <div className="text-slate-500 font-mono text-sm w-full text-center py-0.5 animate-pulse flex items-center justify-center gap-2">
                                    <RefreshCwIcon className="w-3.5 h-3.5 animate-spin text-[#1BA657]" />
                                    <span>Fetching integration settings...</span>
                                </div>
                            ) : (
                                <>
                                    <span className={`font-mono text-sm tracking-widest flex-1 select-all select-none overflow-x-auto custom-scroll pr-2 ${hasKey ? 'text-white font-bold' : 'text-slate-500 italic font-medium'}`}>
                                        {getMaskedKey()}
                                    </span>
                                    {hasKey && (
                                        <button 
                                            onClick={() => setIsRevealed(!isRevealed)}
                                            className="text-slate-400 hover:text-white transition p-2 hover:bg-[#111633] rounded-lg border border-transparent hover:border-[#162C99]/30 ml-2"
                                            title={isRevealed ? "Hide Key" : "Reveal Key"}
                                        >
                                            {isRevealed ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Warning Note */}
                    <div className="flex gap-3 text-red-400 bg-red-950/20 border border-red-900/30 p-4 rounded-xl text-xs leading-relaxed">
                        <AlertTriangleIcon className="w-4 h-4 text-red-500 shrink-0 mt-0.5 animate-pulse" />
                        <div className="flex flex-col gap-0.5">
                            <span className="font-bold uppercase tracking-wider text-[10px] text-red-500">Security Warning</span>
                            <span>Keep this key private. Do not share it. If compromised, generate a new one immediately to revoke access.</span>
                        </div>
                    </div>

                    {/* CTA Actions */}
                    <div className="flex flex-col gap-2.5 mt-2">
                        <button
                            onClick={handleGenerateKey}
                            disabled={isGenerating || loading}
                            className="w-full py-3.5 bg-[#1BA657] hover:bg-[#158C47] active:scale-[0.98] disabled:opacity-50 text-black font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-[#1BA657]/10"
                        >
                            <RefreshCwIcon className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                            {hasKey ? 'Generate New Sync Key' : 'Generate Sync Key'}
                        </button>

                        {hasKey && (
                            <button
                                onClick={handleCopyKey}
                                className="w-full py-3.5 border border-[#1BA657] text-[#1BA657] hover:bg-[#1BA657]/10 active:scale-[0.98] font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                <CopyIcon className="w-4 h-4" />
                                {copied ? 'Copied! ✅' : 'Copy Key'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Mt5IntegrationModal;
