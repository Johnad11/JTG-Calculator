import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import { Icons } from './Icons';
import JtgPromo from './JtgPromo';
import { LOGO_URL } from '../constants';
import { convertForDisplay } from '../utils/currencyConverter';

const TradeList = ({ trades, deleteTrade, isPremium = false, exportCount = 0, incrementExportCount, currencySymbol = '$', currency = 'USD', exchangeRates }) => {
    const captureRef = useRef(null);
    const [showPremiumModal, setShowPremiumModal] = React.useState(false);

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
                <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2-1-2-1-2 1 2 1zm0-3.5L6 7l6 2.5L18 7l-6-2.5zM2 17l10 5 10-5M2 12l10 5 10-5" fill="url(#g1)" />
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

        try {
            logoBase64 = await toDataURL(LOGO_URL);
        } catch (e) {
            // console.warn("Could not load logo image for canvas, using fallback.");
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
                    <span style="font-size: 20px; font-weight: 800; letter-spacing: 1px;">JTG FX JOURNAL</span>
                </div>
                <span style="font-size: 14px; opacity: 0.6; font-weight: 500;">${new Date().toLocaleDateString()}</span>
            </div>

            <div style="text-align: center; margin-bottom: 40px; position: relative; z-index: 10;">
                <p style="margin: 0; font-size: 14px; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Net Profit / Loss</p>
                <h1 style="margin: 10px 0 0; font-size: 64px; font-weight: 900; color: ${accentColor}; text-shadow: 0 0 30px ${accentColor}40;">
                    ${isWin ? '+' : ''}${currencySymbol}${exchangeRates ? convertForDisplay(trade.pnl, currency, exchangeRates).toFixed(currency === 'NGN' ? 0 : 2) : parseFloat(trade.pnl).toFixed(2)}
                </h1>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; position: relative; z-index: 10;">
                <div style="background: rgba(255,255,255,0.03); padding: 20px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05);">
                    <p style="margin: 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; margin-bottom: 5px;">Pair</p>
                    <p style="margin: 0; font-size: 24px; font-weight: 800;">${trade.pair}</p>
                </div>
                <div style="background: rgba(255,255,255,0.03); padding: 20px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05);">
                    <p style="margin: 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; margin-bottom: 5px;">Strategy</p>
                    <!-- FIXED TEXT CLIPPING: Added Line-Height and Padding -->
                    <p style="margin: 0; font-size: 18px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; line-height: 1.5; padding-bottom: 10px; display: block;">${trade.strategy || 'Standard'}</p>
                </div>
            </div>

            <div style="display: flex; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 25px; position: relative; z-index: 10;">
                <div>
                    <p style="margin: 0; font-size: 12px; color: #64748b;">Type</p>
                    <p style="margin: 5px 0 0; font-size: 16px; font-weight: 600; color: ${trade.type === 'BUY' ? '#1BA657' : '#EF4444'};">${trade.type}</p>
                </div>
                <div style="text-align: right;">
                    <p style="margin: 0; font-size: 12px; color: #64748b;">Visit</p>
                    <p style="margin: 5px 0 0; font-size: 14px; font-weight: 600; opacity: 0.8;">jtg-journals.vercel.app</p>
                </div>
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
            setShowPremiumModal(true);
            return;
        }

        const headers = ["Opened", "Closed", "Strategy", "Pair", "Type", "Lot", "Entry", "Exit", "Outcome", "PnL"];
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
            t.pnl
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

    return (
        <div className="flex flex-col h-full animate-pop overflow-y-auto custom-scroll p-4 md:p-10 pb-24 md:pb-10">
            <div className="bg-jtg-card border border-jtg-blue/30 rounded-2xl p-6 shadow-xl flex-1 flex flex-col mb-8 overflow-hidden min-h-[500px]">
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
                <div className="flex-1 overflow-auto custom-scroll">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead className="sticky top-0 bg-jtg-card z-10 shadow-lg"><tr><th className="p-4 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-700">Opened</th><th className="p-4 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-700">Closed</th><th className="p-4 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-700">Strategy</th><th className="p-4 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-700">Pair</th><th className="p-4 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-700">Type</th><th className="p-4 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-700">Lot</th><th className="p-4 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-700">Entry</th><th className="p-4 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-700">Exit</th><th className="p-4 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-700">Outcome</th><th className="p-4 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-700 text-right">PnL</th><th className="p-4 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-700 text-center">Share</th><th className="p-4 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-700 text-center">Action</th></tr></thead>
                        <tbody>
                            {trades.length === 0 ? (<tr><td colSpan="12" className="p-12 text-center text-slate-500 italic">No trade history found. Go to Journal to add entries.</td></tr>) : (trades.map(trade => (
                                <tr key={trade.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors group">
                                    <td className="p-4 text-xs text-white font-mono">{trade.openDate.split('T')[0]}</td>
                                    <td className="p-4 text-xs text-slate-400 font-mono">{trade.closeDate ? trade.closeDate.split('T')[0] : '-'}</td>
                                    <td className="p-4 text-xs text-white font-medium">{trade.strategy}</td>
                                    <td className="p-4 text-sm font-bold text-white">{trade.pair}</td>
                                    <td className={`p-4 text-xs font-bold ${trade.type === 'BUY' ? 'text-jtg-green' : 'text-red-500'}`}>{trade.type}</td>
                                    <td className="p-4 text-xs text-slate-300 font-mono">{trade.lot}</td>
                                    <td className="p-4 text-xs font-mono text-white">{trade.entry}</td>
                                    <td className="p-4 text-xs font-mono text-slate-400">{trade.exit || '-'}</td>
                                    <td className="p-4"><span className={`text-[10px] font-bold px-2 py-1 rounded border ${trade.outcome.includes('WIN') || trade.outcome.includes('TP') ? 'bg-jtg-green/10 text-jtg-green border-jtg-green/30' : trade.outcome.includes('LOSS') || trade.outcome.includes('SL') ? 'bg-red-500/10 text-red-500 border-red-500/30' : 'bg-slate-700 text-slate-300 border-slate-600'}`}>{trade.outcome}</span></td>
                                    <td className={`p-4 text-sm font-mono font-bold text-right ${parseFloat(trade.pnl) >= 0 ? 'text-jtg-green' : 'text-red-500'}`}>
                                        {parseFloat(trade.pnl) >= 0 ? '+' : ''}{currencySymbol}{exchangeRates ? convertForDisplay(trade.pnl, currency, exchangeRates).toFixed(currency === 'NGN' ? 0 : 2) : parseFloat(trade.pnl).toFixed(2)}
                                    </td>
                                    <td className="p-4 text-center">
                                        <button onClick={() => downloadCard(trade)} className="text-slate-500 hover:text-jtg-green transition-colors"><Icons.Share /></button>
                                    </td>
                                    <td className="p-4 text-center"><button onClick={() => deleteTrade(trade.id)} className="text-slate-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Icons.Trash /></button></td>
                                </tr>
                            )))}
                        </tbody>
                    </table>
                </div>
            </div>
            <JtgPromo />

            {/* UPGRADE MODAL */}
            {showPremiumModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in p-6 text-center">
                    <div className="flex flex-col items-center gap-4 bg-jtg-dark border border-jtg-green/30 p-8 rounded-2xl shadow-2xl max-w-sm">
                        <div className="w-16 h-16 bg-jtg-green/20 rounded-full flex items-center justify-center text-jtg-green mb-2">
                            <Icons.Star className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white mb-2">Limit Reached</h3>
                            <p className="text-slate-400 text-sm mb-6">
                                Free users are limited to 3 data exports. Upgrade to Premium for unlimited access!
                            </p>
                        </div>
                        <button
                            onClick={() => window.open('https://chat.whatsapp.com/Dasf32dLxyQHny6eUADTHg', '_blank')}
                            className="w-full py-3 bg-gradient-to-r from-jtg-green to-emerald-500 text-black font-bold rounded-lg hover:brightness-110 transition shadow-lg flex items-center justify-center gap-2"
                        >
                            <Icons.Star className="w-4 h-4" /> UPGRADE TO PREMIUM
                        </button>
                        <button
                            onClick={() => setShowPremiumModal(false)}
                            className="mt-2 text-slate-500 hover:text-white transition text-sm font-bold"
                        >
                            CLOSE
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TradeList;
