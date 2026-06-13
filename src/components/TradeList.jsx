import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import { Icons } from './Icons';
import { LOGO_URL } from '../constants';
import { convertForDisplay } from '../utils/currencyConverter';

const TradeRow = ({ trade, currencySymbol, currency, getEmotionColor, downloadCard, deleteTrade }) => {
    const [expanded, setExpanded] = React.useState(false);
    const isWin = parseFloat(trade.pnl) >= 0;

    return (
        <div className="bg-jtg-input/40 border border-jtg-blue/20 rounded-xl p-4 shadow-md hover:border-jtg-blue/40 transition duration-300">
            {/* Clickable Header Bar */}
            <div 
                onClick={() => setExpanded(!expanded)} 
                className="flex items-center justify-between cursor-pointer"
            >
                {/* Left: Pair + Direction Arrow */}
                <div className="flex items-center gap-2 min-w-[100px]">
                    <span className="text-sm md:text-base font-black text-white tracking-wide uppercase">{trade.pair}</span>
                    {trade.type === 'BUY' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-jtg-green shrink-0"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-red-500 shrink-0"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
                    )}
                </div>

                {/* Center: Date */}
                <div className="text-center flex-1">
                    <span className="text-xs md:text-sm text-slate-300 font-mono font-bold">
                        {trade.openDate.split('T')[0]}
                    </span>
                </div>

                {/* Right: PnL + Caret */}
                <div className="flex items-center gap-3">
                    <span className={`text-xs md:text-sm font-mono font-black ${isWin ? 'text-jtg-green' : 'text-red-500'}`}>
                        {isWin ? '+' : ''}{currencySymbol}{trade.pnlNative ? parseFloat(trade.pnlNative).toLocaleString(undefined, { minimumFractionDigits: currency === 'NGN' ? 0 : 2, maximumFractionDigits: currency === 'NGN' ? 0 : 2 }) : parseFloat(trade.pnl).toLocaleString()}
                    </span>
                    <span className="text-slate-400 hover:text-white transition-transform duration-200 text-xs" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        ▼
                    </span>
                </div>
            </div>

            {/* Expanded Content */}
            {expanded && (
                <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-4 text-slate-400 text-xs animate-fade-in">
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Closed Date</p>
                        <p className="font-mono text-white text-sm font-semibold">{trade.closeDate ? trade.closeDate.split('T')[0] : '-'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Strategy Used</p>
                        <p className="text-white text-sm font-semibold">{trade.strategy || 'Standard'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Lot Size</p>
                        <p className="font-mono text-white text-sm font-bold">{trade.lot}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Dominant Emotion</p>
                        <p className={`text-sm font-bold ${getEmotionColor(trade.emotion)}`}>{trade.emotion || '-'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Setup Quality</p>
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded inline-block mt-0.5 ${trade.setupQuality === 'A+' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' : 'bg-slate-700 text-slate-300'}`}>
                            {trade.setupQuality || '-'}
                        </span>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Rule Adherence</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded inline-block mt-0.5 ${trade.ruleAdherence === 'Yes' ? 'bg-jtg-green/20 text-jtg-green' : 'bg-red-500/20 text-red-500'}`}>
                            {trade.ruleAdherence === 'Yes' ? '✅ Followed Rules' : '❌ Broke Rules'}
                        </span>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Trade Outcome</p>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded inline-block mt-0.5 border ${trade.outcome.includes('WIN') || trade.outcome.includes('TP') ? 'bg-jtg-green/10 text-jtg-green border-jtg-green/30' : trade.outcome.includes('LOSS') || trade.outcome.includes('SL') ? 'bg-red-500/10 text-red-500 border-red-500/30' : 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                            {trade.outcome}
                        </span>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total PnL</p>
                        <span className={`text-sm md:text-base font-mono font-black ${isWin ? 'text-jtg-green' : 'text-red-500'}`}>
                            {isWin ? '+' : ''}{currencySymbol}{trade.pnlNative ? parseFloat(trade.pnlNative).toLocaleString(undefined, { minimumFractionDigits: currency === 'NGN' ? 0 : 2, maximumFractionDigits: currency === 'NGN' ? 0 : 2 }) : parseFloat(trade.pnl).toLocaleString()}
                        </span>
                    </div>
                    
                    {/* Actions Row */}
                    <div className="col-span-2 md:col-span-4 flex justify-end gap-3 pt-4 border-t border-slate-800/50">
                        <button 
                            onClick={(e) => { e.stopPropagation(); downloadCard(trade); }} 
                            className="px-4 py-2 bg-jtg-blue/10 hover:bg-jtg-blue/20 border border-jtg-blue/30 text-jtg-green hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 active:scale-95"
                            title="Share Trade Card"
                        >
                            <Icons.Share className="w-4 h-4" />
                            <span>Share Card</span>
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); deleteTrade(trade.id); }} 
                            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 active:scale-95"
                            title="Delete Trade Log"
                        >
                            <Icons.Trash className="w-4 h-4" />
                            <span>Delete Log</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const TradeList = ({ trades, deleteTrade, isPremium = false, exportCount = 0, incrementExportCount, currencySymbol = '$', currency = 'USD', exchangeRates, username, activeAccountId, activeAccount, triggerUpgrade }) => {
    const captureRef = useRef(null);

    const downloadCard = async (trade) => {
        let logoBase64 = '';
        // Fallback SVG string (already base64 encoded for safety or inline)
        const logoSvg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="none">
                <defs>
                    <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1BA657" />
                        <stop offset="100%" stopColor="#162C99" />
                    </linearGradient>
                </defs>
                <path d="M12 2L2 7l10 5 10-5-10-5-10-5zm0 9l2-1-2-1-2 1 2 1zm0-3.5L6 7l6 2.5L18 7l-6-2.5zM2 17l10 5 10-5M2 12l10 5 10-5" fill="url(#g1)" />
            </svg>
        `;

        // Helper to convert image URL to base64
        const toDataURL = url => fetch(url)
            .then(response => response.blob())
            .then(blob => new Promise((resolve, reject) => {
                const reader = new FileReader()
                reader.onloadend = () => resolve(reader.result)
                reader.onerror = reject
                reader.readAsDataURL(blob)
            }));

        let qrBase64 = '';
        try {
            logoBase64 = await toDataURL(LOGO_URL);
        } catch (e) {
            // console.warn("Could not load logo image for canvas, using fallback.");
        }

        try {
            qrBase64 = await toDataURL('https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://jtg-journals.vercel.app');
        } catch (e) {
            // console.warn("Could not fetch QR code base64, using fallback text.");
        }

        const element = document.createElement('div');
        element.style.cssText = `
            background: radial-gradient(circle at top right, #111633 0%, #0a0e29 100%);
            width: 600px;
            padding: 50px;
            border-radius: 30px;
            font-family: 'Inter', sans-serif;
            color: white;
            display: flex;
            flex-direction: column;
            gap: 0;
            position: relative;
            overflow: hidden;
            border: 1px solid #162C99;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        `;

        const isWin = parseFloat(trade.pnl) >= 0;
        const accentColor = isWin ? '#1BA657' : '#EF4444';

        const logoHtml = logoBase64
            ? `<img src="${logoBase64}" style="width: 50px; height: 50px; object-fit: contain;" />`
            : logoSvg;

        element.innerHTML = `
            <div style="position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; background: ${accentColor}; opacity: 0.15; filter: blur(60px); border-radius: 50%;"></div>
            <div style="position: absolute; bottom: -50px; left: -50px; width: 150px; height: 150px; background: #162C99; opacity: 0.15; filter: blur(50px); border-radius: 50%;"></div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; position: relative; z-index: 10;">
                <div style="display: flex; align-items: center; gap: 15px;">
                    ${logoHtml}
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-size: 20px; font-weight: 800; letter-spacing: 1px;">JTG FX JOURNAL</span>
                        <span style="font-size: 10px; color: ${accentColor}; font-weight: 700; letter-spacing: 0.5px; opacity: 0.9;">VERIFIED TRADER: @${username || 'GUEST'}</span>
                    </div>
                </div>
                <span style="font-size: 14px; opacity: 0.6; font-weight: 500;">${new Date().toLocaleDateString()}</span>
            </div>

            <div style="text-align: center; margin-bottom: 40px; position: relative; z-index: 10;">
                <p style="margin: 0; font-size: 14px; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Net Profit / Loss</p>
                <h1 style="margin: 10px 0 0; font-size: 64px; font-weight: 900; color: ${accentColor}; text-shadow: 0 0 30px ${accentColor}40;">
                    ${isWin ? '+' : ''}${currencySymbol}${trade.pnlNative ? parseFloat(trade.pnlNative).toFixed(currency === 'NGN' ? 0 : 2) : parseFloat(trade.pnl).toFixed(2)}
                </h1>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; position: relative; z-index: 10;">
                <div style="background: rgba(255,255,255,0.03); padding: 20px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05);">
                    <p style="margin: 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; margin-bottom: 5px;">Pair</p>
                    <p style="margin: 0; font-size: 24px; font-weight: 800;">${trade.pair}</p>
                </div>
                <div style="background: rgba(255,255,255,0.03); padding: 20px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05);">
                    <p style="margin: 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; margin-bottom: 5px;">Strategy</p>
                    <p style="margin: 0; font-size: 18px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; line-height: 1.5; padding-bottom: 10px; display: block;">${trade.strategy || 'Standard'}</p>
                </div>
            </div>

            <div style="display: flex; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 25px; position: relative; z-index: 10;">
                <div>
                    <p style="margin: 0; font-size: 12px; color: #64748b;">Type</p>
                    <p style="margin: 5px 0 0; font-size: 16px; font-weight: 600; color: ${trade.type === 'BUY' ? '#1BA657' : '#EF4444'};">${trade.type}</p>
                </div>
                ${qrBase64 ? `
                    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                        <img src="${qrBase64}" style="width: 50px; height: 50px; border-radius: 6px; border: 1.5px solid #1BA657; background: white; padding: 2px;" />
                        <span style="font-size: 8px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Scan to Journal</span>
                    </div>
                ` : `
                    <div style="text-align: right;">
                        <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Tracked Via</p>
                        <p style="margin: 5px 0 0; font-size: 14px; font-weight: 700; color: #1BA657; opacity: 0.9; letter-spacing: 0.5px;">jtg-journals.vercel.app</p>
                    </div>
                `}
            </div>

        `;

        document.body.appendChild(element);
        const canvas = await html2canvas(element, { backgroundColor: null, scale: 2, useCORS: true });
        document.body.removeChild(element);

        const link = document.createElement('a');
        link.download = `JTG_Trade_${trade.pair}_${trade.id}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    const handleExportCSV = () => {
        if (trades.length === 0) {
            alert("No trades to export.");
            return;
        }

        if (!isPremium && exportCount >= 3) {
            triggerUpgrade();
            return;
        }

        const headers = ["Opened", "Closed", "Strategy", "Pair", "Type", "Lot", "Entry", "Exit", "Outcome", "Emotion", "Setup Qual", "Disciplined", "PnL"];
        const rows = trades.map(t => [
            t.openDate ? t.openDate.split('T')[0] : '',
            t.closeDate ? t.closeDate.split('T')[0] : '-',
            t.strategy || 'Standard',
            t.pair,
            t.type,
            t.lot,
            t.entry,
            t.exit || '-',
            t.outcome,
            t.emotion || '-',
            t.setupQuality || '-',
            t.ruleAdherence || '-',
            t.pnlNative || t.pnl // Use native PnL if available for CSV export
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.map(val => `"${val}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `JTG_Trade_Export_${new Date().getTime()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (!isPremium && incrementExportCount) {
            incrementExportCount();
        }
    };

    const getEmotionColor = (emotion) => {
        switch (emotion) {
            case 'Confident': return 'text-emerald-400';
            case 'Calm': return 'text-jtg-green';
            case 'Anxious': return 'text-yellow-400';
            case 'FOMO': return 'text-orange-400';
            case 'Greedy': return 'text-red-400';
            case 'Fearful': return 'text-purple-400';
            default: return 'text-slate-400';
        }
    };

    return (
        <div className="flex flex-col h-full animate-pop overflow-y-auto custom-scroll p-4 md:p-10 pb-24 md:pb-10">
            <div className="bg-jtg-card border border-jtg-blue/30 rounded-2xl p-6 shadow-xl flex flex-col mb-8 min-h-[500px]">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-6">
                        <h2 className="text-2xl font-bold text-white tracking-wide flex items-center gap-3">
                            <span className="text-jtg-green"><Icons.List /></span> Trade History
                        </h2>
                        <div className="flex flex-col items-center">
                            <button
                                onClick={handleExportCSV}
                                className="bg-jtg-green/10 hover:bg-jtg-green/20 text-jtg-green border border-jtg-green/30 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 group"
                                title="Export to CSV"
                            >
                                <Icons.Download />
                                <span className="hidden sm:inline">EXPORT CSV</span>
                            </button>
                            {!isPremium && (
                                <span className="text-[9px] text-slate-500 font-bold mt-1 uppercase tracking-tighter">
                                    {Math.max(0, 3 - exportCount)} FREE EXPORTS LEFT
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="bg-jtg-blue/20 px-4 py-2 rounded-full border border-jtg-blue/40">
                        <span className="text-white font-bold font-mono">{trades.length}</span> <span className="text-slate-400 text-xs uppercase">Records</span>
                    </div>
                </div>
                <div className="flex-1 space-y-4">
                    {trades.length === 0 ? (
                        <div className="p-12 text-center text-slate-500 italic">No trade history found. Go to Journal to add entries.</div>
                    ) : (
                        [...trades].reverse().map(trade => (
                            <TradeRow 
                                key={trade.id} 
                                trade={trade} 
                                currencySymbol={currencySymbol} 
                                currency={currency} 
                                getEmotionColor={getEmotionColor} 
                                downloadCard={downloadCard} 
                                deleteTrade={deleteTrade} 
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default React.memo(TradeList);
