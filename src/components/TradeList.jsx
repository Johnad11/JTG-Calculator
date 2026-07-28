import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import { Icons } from './Icons';
import { LOGO_URL } from '../constants';
import { convertForDisplay } from '../utils/currencyConverter';

const TradeRow = ({ trade, currencySymbol, currency, getEmotionColor, downloadCard, deleteTrade }) => {
    const [expanded, setExpanded] = React.useState(false);
    const isWin = parseFloat(trade.pnl) >= 0;

    return (
        <div className="bg-input-theme border border-theme rounded-xl p-4 shadow-sm hover:border-jtg-blue/40 transition duration-300">
            {/* Clickable Header Bar */}
            <div 
                onClick={() => setExpanded(!expanded)} 
                className="flex items-center justify-between cursor-pointer"
            >
                {/* Left: Pair + Direction Arrow */}
                <div className="flex items-center gap-2 min-w-[100px]">
                    <span className="text-sm md:text-base font-black text-main-theme tracking-wide uppercase">{trade.pair}</span>
                    {trade.type === 'BUY' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-jtg-green shrink-0"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-red-500 shrink-0"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
                    )}
                </div>

                {/* Center: Date */}
                <div className="text-center flex-1">
                    <span className="text-xs md:text-sm text-muted-theme font-mono font-bold">
                        {trade.openDate.split('T')[0]}
                    </span>
                </div>

                {/* Right: PnL + Caret */}
                <div className="flex items-center gap-3">
                    <span className={`text-xs md:text-sm font-mono font-black ${isWin ? 'text-jtg-green' : 'text-red-500'}`}>
                        {isWin ? '+' : ''}{currencySymbol}{trade.pnlNative ? parseFloat(trade.pnlNative).toLocaleString(undefined, { minimumFractionDigits: currency === 'NGN' ? 0 : 2, maximumFractionDigits: currency === 'NGN' ? 0 : 2 }) : parseFloat(trade.pnl).toLocaleString()}
                    </span>
                    <span className="text-muted-theme transition-transform duration-200 text-xs" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        ▼
                    </span>
                </div>
            </div>

            {/* Expanded Content */}
            {expanded && (
                <div className="mt-4 pt-4 border-t border-theme grid grid-cols-2 md:grid-cols-4 gap-4 text-muted-theme text-xs animate-fade-in">
                    <div>
                        <p className="text-[10px] font-bold text-muted-theme uppercase tracking-widest mb-1">Closed Date</p>
                        <p className="font-mono text-main-theme text-sm font-semibold">{trade.closeDate ? trade.closeDate.split('T')[0] : '-'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-muted-theme uppercase tracking-widest mb-1">Strategy Used</p>
                        <p className="text-main-theme text-sm font-semibold">{trade.strategy || 'Standard'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-muted-theme uppercase tracking-widest mb-1">Lot Size</p>
                        <p className="font-mono text-main-theme text-sm font-bold">{trade.lot}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-muted-theme uppercase tracking-widest mb-1">Dominant Emotion</p>
                        <p className={`text-sm font-bold ${getEmotionColor(trade.emotion)}`}>{trade.emotion || '-'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-muted-theme uppercase tracking-widest mb-1">Setup Quality</p>
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded inline-block mt-0.5 ${trade.setupQuality === 'A+' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-input-theme text-main-theme'}`}>
                            {trade.setupQuality || '-'}
                        </span>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-muted-theme uppercase tracking-widest mb-1">Rule Adherence</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded inline-block mt-0.5 ${trade.ruleAdherence === 'Yes' ? 'bg-emerald-500/20 text-jtg-green border border-emerald-500/30' : 'bg-red-500/20 text-red-500 border border-red-500/30'}`}>
                            {trade.ruleAdherence === 'Yes' ? '✅ Followed Rules' : '❌ Broke Rules'}
                        </span>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-muted-theme uppercase tracking-widest mb-1">Trade Outcome</p>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded inline-block mt-0.5 border ${trade.outcome.includes('WIN') || trade.outcome.includes('TP') ? 'bg-emerald-500/20 text-jtg-green border-emerald-500/30' : trade.outcome.includes('LOSS') || trade.outcome.includes('SL') ? 'bg-red-500/20 text-red-500 border-red-500/30' : 'bg-input-theme text-main-theme border-theme'}`}>
                            {trade.outcome}
                        </span>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-muted-theme uppercase tracking-widest mb-1">Total PnL</p>
                        <span className={`text-sm md:text-base font-mono font-black ${isWin ? 'text-jtg-green' : 'text-red-500'}`}>
                            {isWin ? '+' : ''}{currencySymbol}{trade.pnlNative ? parseFloat(trade.pnlNative).toLocaleString(undefined, { minimumFractionDigits: currency === 'NGN' ? 0 : 2, maximumFractionDigits: currency === 'NGN' ? 0 : 2 }) : parseFloat(trade.pnl).toLocaleString()}
                        </span>
                    </div>
                    
                    {/* Actions Row */}
                    <div className="col-span-2 md:col-span-4 flex justify-end gap-3 pt-4 border-t border-theme">
                        <button 
                            onClick={(e) => { e.stopPropagation(); downloadCard(trade); }} 
                            className="px-4 py-2 bg-jtg-blue/10 hover:bg-jtg-blue text-jtg-blue hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 active:scale-95 border border-jtg-blue/20"
                            title="Share Trade Card"
                        >
                            <Icons.Share className="w-4 h-4" />
                            <span>Share Card</span>
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); deleteTrade(trade.id); }} 
                            className="px-4 py-2 bg-red-500/10 hover:bg-red-500 border border-red-500/30 text-red-500 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 active:scale-95"
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
        const logoSvg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="45" height="45" viewBox="0 0 24 24" fill="none">
                <defs>
                    <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1BA657" />
                        <stop offset="100%" stopColor="#162C99" />
                    </linearGradient>
                </defs>
                <path d="M12 2L2 7l10 5 10-5-10-5-10-5zm0 9l2-1-2-1-2 1 2 1zm0-3.5L6 7l6 2.5L18 7l-6-2.5zM2 17l10 5 10-5M2 12l10 5 10-5" fill="url(#g1)" />
            </svg>
        `;

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
            // fallback logo SVG
        }

        try {
            qrBase64 = await toDataURL('https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://jtgjournal.johnadtradersgroup.name.ng');
        } catch (e) {
            // fallback QR
        }

        const element = document.createElement('div');
        element.style.cssText = `
            background: #FFFFFF;
            width: 720px;
            height: 420px;
            padding: 38px 42px;
            border-radius: 28px;
            font-family: 'News Cycle', 'Inter', system-ui, sans-serif;
            color: #0F172A;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
            overflow: hidden;
            border: 1px solid #E2E8F0;
            box-shadow: 0 30px 60px -15px rgba(15, 23, 42, 0.2);
            box-sizing: border-box;
        `;

        const isWin = parseFloat(trade.pnl) >= 0;
        const pnlColor = isWin ? '#1BA657' : '#EF4444';

        const logoHtml = logoBase64
            ? `<img src="${logoBase64}" style="width: 48px; height: 48px; object-fit: contain;" />`
            : logoSvg;

        // Calculate approximate R:R if SL and TP available
        let rrText = '1 : 2.0';
        if (trade.entry && trade.sl && trade.tp) {
            const risk = Math.abs(parseFloat(trade.entry) - parseFloat(trade.sl));
            const reward = Math.abs(parseFloat(trade.tp) - parseFloat(trade.entry));
            if (risk > 0) rrText = `1 : ${(reward / risk).toFixed(1)}`;
        }

        const rawPnl = trade.pnlNative ? parseFloat(trade.pnlNative) : parseFloat(trade.pnl);
        const formattedPnlVal = Math.abs(rawPnl).toLocaleString(undefined, { minimumFractionDigits: currency === 'NGN' ? 0 : 2, maximumFractionDigits: currency === 'NGN' ? 0 : 2 });
        const displayPnlText = `${isWin ? '+' : '-'}${currencySymbol}${formattedPnlVal}`;

        element.innerHTML = `
            <!-- Background Dual Curved Swoops -->
            <svg width="720" height="420" viewBox="0 0 720 420" fill="none" xmlns="http://www.w3.org/2000/svg" style="position: absolute; top: 0; right: 0; width: 720px; height: 420px; z-index: 1; pointer-events: none;">
                <!-- Outer Green Accent Arc -->
                <path d="M 410 0 C 515 80 640 280 570 420 L 720 420 L 720 0 Z" fill="#1BA657" />
                <!-- Inner Deep Brand Blue Swoop -->
                <path d="M 435 0 C 525 90 600 300 515 420 L 720 420 L 720 0 Z" fill="#162C99" />
            </svg>

            <!-- INNOVATIVE GRAPHICS & METRICS ON BLUE RIGHT SWOOP -->
            <div style="position: absolute; top: 32px; right: 30px; width: 210px; height: 356px; z-index: 10; display: flex; flex-direction: column; justify-content: space-between; align-items: flex-end; box-sizing: border-box; pointer-events: none;">
                <!-- Top Right Watermark Badge (Solid Minimalist) -->
                <div style="display: flex; align-items: center; gap: 7px; background: #0B194D; border: 1.5px solid #1BA657; padding: 6px 14px; border-radius: 20px; box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);">
                    <span style="width: 7px; height: 7px; border-radius: 50%; background: #1BA657; box-shadow: 0 0 8px #1BA657;"></span>
                    <span style="font-size: 10px; font-weight: 800; color: #FFFFFF; letter-spacing: 1.2px; text-transform: uppercase;">VERIFIED LOG</span>
                </div>

                <!-- Center Candlestick / Equity Trend Illustration -->
                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
                    <svg width="170" height="95" viewBox="0 0 170 95" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <!-- Wicks & Candlestick Bodies -->
                        <line x1="20" y1="50" x2="20" y2="85" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
                        <rect x="15" y="58" width="10" height="18" rx="2" fill="#EF4444" opacity="0.95"/>

                        <line x1="50" y1="35" x2="50" y2="75" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
                        <rect x="45" y="42" width="10" height="22" rx="2" fill="#1BA657"/>

                        <line x1="80" y1="20" x2="80" y2="60" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
                        <rect x="75" y="28" width="10" height="20" rx="2" fill="#1BA657"/>

                        <line x1="110" y1="12" x2="110" y2="48" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
                        <rect x="105" y="18" width="10" height="18" rx="2" fill="#1BA657"/>

                        <line x1="140" y1="4" x2="140" y2="38" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
                        <rect x="135" y="8" width="10" height="20" rx="2" fill="#1BA657"/>

                        <!-- Glowing Trend Line -->
                        <path d="M 10 78 Q 50 68 80 38 T 155 12" stroke="#1BA657" stroke-width="3.5" stroke-linecap="round" fill="none"/>
                    </svg>
                </div>

                <!-- Bottom Analytics Badges (Solid Minimalist) -->
                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                    <div style="background: #0B194D; border: 1.5px solid #1BA657; padding: 8px 18px; border-radius: 16px; text-align: center; box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3); min-width: 140px;">
                        <p style="margin: 0; font-size: 9px; color: rgba(255, 255, 255, 0.85); text-transform: uppercase; font-weight: 800; letter-spacing: 1px;">R:R TARGET RATIO</p>
                        <p style="margin: 2px 0 0; font-size: 18px; font-weight: 900; color: #FFFFFF; font-family: monospace; letter-spacing: 1px;">${rrText}</p>
                    </div>
                    <span style="font-size: 9px; color: rgba(255, 255, 255, 0.8); font-weight: 800; letter-spacing: 1px; text-transform: uppercase; margin-top: 4px;">INSTITUTIONAL ENTRY</span>
                </div>
            </div>

            <!-- Left Side White Content Area -->
            <!-- Header -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; position: relative; z-index: 10; width: 390px;">
                <div style="display: flex; align-items: center; gap: 14px;">
                    ${logoHtml}
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-size: 24px; font-weight: 900; letter-spacing: 0.5px; color: #162C99; line-height: 1.1;">JTG FX JOURNAL</span>
                        <span style="font-size: 11px; color: #1BA657; font-weight: 800; letter-spacing: 0.5px; margin-top: 3px;">VERIFIED TRADER: @${(username || 'GUEST').toUpperCase()}</span>
                    </div>
                </div>
            </div>

            <!-- Main Details Body -->
            <div style="position: relative; z-index: 10; width: 390px; margin-top: 6px;">
                <!-- PnL Headline -->
                <div style="margin-bottom: 16px;">
                    <p style="margin: 0; font-size: 11px; color: #64748B; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700;">Trade Net Profit / Loss</p>
                    <h1 style="margin: 2px 0 0; font-size: 46px; font-weight: 900; color: ${pnlColor}; line-height: 1.1;">
                        ${displayPnlText}
                    </h1>
                </div>

                <!-- Stats Grid - NO TEXT CLIPPING GUARANTEED -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; background: #F8FAFC; padding: 16px; border-radius: 16px; border: 1.5px solid #E2E8F0; box-sizing: border-box;">
                    <div style="display: flex; flex-direction: column;">
                        <p style="margin: 0; font-size: 10px; color: #64748B; text-transform: uppercase; font-weight: 700;">Instrument</p>
                        <p style="margin: 3px 0 0; font-size: 18px; font-weight: 900; color: #0F172A; line-height: 1.3;">${trade.pair}</p>
                    </div>
                    <div style="display: flex; flex-direction: column;">
                        <p style="margin: 0; font-size: 10px; color: #64748B; text-transform: uppercase; font-weight: 700;">Type / Lot</p>
                        <p style="margin: 3px 0 0; font-size: 16px; font-weight: 800; color: ${trade.type === 'BUY' ? '#1BA657' : '#EF4444'}; line-height: 1.3;">${trade.type} (${trade.lot})</p>
                    </div>
                    <div style="display: flex; flex-direction: column;">
                        <p style="margin: 0; font-size: 10px; color: #64748B; text-transform: uppercase; font-weight: 700;">Strategy</p>
                        <p style="margin: 3px 0 0; font-size: 14px; font-weight: 800; color: #334155; line-height: 1.35; padding-bottom: 2px;">${trade.strategy || 'Standard'}</p>
                    </div>
                    <div style="display: flex; flex-direction: column;">
                        <p style="margin: 0; font-size: 10px; color: #64748B; text-transform: uppercase; font-weight: 700;">Execution Date</p>
                        <p style="margin: 3px 0 0; font-size: 14px; font-weight: 800; color: #334155; line-height: 1.35; padding-bottom: 2px;">${trade.openDate ? trade.openDate.split('T')[0] : ''}</p>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div style="display: flex; justify-content: space-between; align-items: flex-end; position: relative; z-index: 10; width: 390px; border-top: 1px solid #E2E8F0; padding-top: 12px; margin-top: 6px;">
                <div style="display: flex; flex-direction: column;">
                    <span style="font-size: 10px; font-weight: 800; color: #162C99; text-transform: uppercase; letter-spacing: 0.5px;">Verified Journal Entry</span>
                    <span style="font-size: 9px; color: #64748B; font-weight: 600;">jtgjournal.johnadtradersgroup.name.ng</span>
                </div>

                ${qrBase64 ? `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <img src="${qrBase64}" style="width: 44px; height: 44px; border-radius: 6px; border: 1.5px solid #1BA657; background: white; padding: 2px;" />
                        <span style="font-size: 8px; color: #475569; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; width: 48px; line-height: 1.2;">Scan to Verify</span>
                    </div>
                ` : ''}
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
            t.pnlNative || t.pnl
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
            case 'Confident': return 'text-emerald-600';
            case 'Calm': return 'text-jtg-green';
            case 'Anxious': return 'text-amber-600';
            case 'FOMO': return 'text-orange-600';
            case 'Greedy': return 'text-red-600';
            case 'Fearful': return 'text-purple-600';
            default: return 'text-slate-500';
        }
    };

    return (
        <div className="flex flex-col h-full animate-pop overflow-y-auto custom-scroll p-4 md:p-10 pb-24 md:pb-10">
            <div className="bg-card-theme border border-theme rounded-2xl p-6 shadow-xl flex flex-col mb-8 min-h-[500px] text-main-theme">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-6">
                        <h2 className="text-2xl font-bold text-main-theme tracking-wide flex items-center gap-3">
                            <span className="text-jtg-green"><Icons.List /></span> Trade History
                        </h2>
                        <div className="flex flex-col items-center">
                            <button
                                onClick={handleExportCSV}
                                className="bg-emerald-50 hover:bg-emerald-100 text-jtg-green border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 group"
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
                    <div className="bg-jtg-blue/10 px-4 py-2 rounded-full border border-jtg-blue/20">
                        <span className="text-jtg-blue font-bold font-mono">{trades.length}</span> <span className="text-slate-500 text-xs uppercase font-semibold">Records</span>
                    </div>
                </div>
                <div className="flex-1 space-y-4">
                    {trades.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 italic">No trade history found. Go to Journal to add entries.</div>
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
