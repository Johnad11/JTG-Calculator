import React, { useState, useMemo } from 'react';
import { Icons } from './Icons';
import JtgPromo from './JtgPromo';
import StatCard from './StatCard';
import { convertForDisplay } from '../utils/currencyConverter';

const Performance = ({ trades, withdrawals = [], globalBalance, globalInitialBalance, updateGlobalBalance, updateInitialBalance, currencySymbol = '$', currency = 'USD', exchangeRates }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempBalance, setTempBalance] = useState(globalInitialBalance || globalBalance || '');

    const stats = useMemo(() => {
        const total = trades.length;
        const wins = trades.filter(t => parseFloat(t.pnl) > 0).length;
        const grossProfit = trades.reduce((acc, t) => parseFloat(t.pnl) > 0 ? acc + parseFloat(t.pnl) : acc, 0);
        const grossLoss = Math.abs(trades.reduce((acc, t) => parseFloat(t.pnl) < 0 ? acc + parseFloat(t.pnl) : acc, 0));
        const netPnL = grossProfit - grossLoss;
        const pairStats = {};
        trades.forEach(t => { if (!pairStats[t.pair]) pairStats[t.pair] = 0; pairStats[t.pair] += parseFloat(t.pnl); });
        let bestPair = '-'; let maxPnL = -Infinity;
        Object.entries(pairStats).forEach(([pair, pnl]) => { if (pnl > maxPnL) { maxPnL = pnl; bestPair = pair; } });
        if (Object.keys(pairStats).length === 0) bestPair = 'N/A';

        // Withdrawal Calc
        const totalWithdrawals = withdrawals.reduce((acc, w) => acc + parseFloat(w.amount), 0);

        // Growth Calc
        let currentBalance = parseFloat(globalBalance || 0);
        let growthPct = 0;

        if (globalInitialBalance || globalBalance) {
            const startBal = globalInitialBalance ? parseFloat(globalInitialBalance) : parseFloat(globalBalance);
            if (startBal > 0) {
                growthPct = (netPnL / startBal) * 100;
            }
        }

        return {
            total,
            wins,
            loss: total - wins,
            winRate: total > 0 ? ((wins / total) * 100).toFixed(1) : 0,
            netPnL: netPnL.toFixed(2),
            profitFactor: grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : (grossProfit > 0 ? 'MAX' : '0.00'),
            bestPair,
            currentBalance: currentBalance.toFixed(2),
            growthPct: growthPct.toFixed(2),
            totalWithdrawals: totalWithdrawals.toFixed(2)
        };
    }, [trades, globalBalance, withdrawals]);

    const saveBalance = () => {
        if (updateInitialBalance) {
            updateInitialBalance(tempBalance);
        } else {
            updateGlobalBalance(tempBalance); // fallback
        }
        setIsEditing(false);
    };

    return (
        <div className="animate-pop overflow-y-auto custom-scroll p-4 md:p-10 pb-24 md:pb-10 h-full flex flex-col">
            <div className="mb-auto">

                {/* ACCOUNT HEALTH SECTION */}
                <div className="bg-jtg-card border border-jtg-blue/30 rounded-2xl p-6 mb-8 shadow-xl relative overflow-hidden">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2"><Icons.Briefcase /> Account Health</h2>
                        {!isEditing && globalBalance && <button onClick={() => setIsEditing(true)} className="text-xs text-jtg-green hover:text-white"><Icons.Edit /></button>}
                    </div>

                    {!globalBalance || isEditing ? (
                        <div className="flex gap-2 items-end">
                            <div className="flex-1">
                                <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Set Starting Balance</label>
                                <input type="number" value={tempBalance} onChange={e => setTempBalance(e.target.value)} className="w-full bg-jtg-input border border-jtg-blue/40 rounded-lg p-2 text-white outline-none" placeholder="e.g. 10000" />
                            </div>
                            <button onClick={saveBalance} className="bg-jtg-green text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-emerald-600 transition">SAVE</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div><p className="text-[10px] text-slate-500 uppercase font-bold">Starting</p><p className="text-sm md:text-lg font-mono text-slate-300">{currencySymbol}{exchangeRates ? convertForDisplay(globalInitialBalance || globalBalance, currency, exchangeRates).toFixed(currency === 'NGN' ? 0 : 2) : parseFloat(globalInitialBalance || globalBalance).toLocaleString()}</p></div>
                            <div><p className="text-[10px] text-slate-500 uppercase font-bold">Current</p><p className="text-lg md:text-2xl font-mono text-white font-bold">{currencySymbol}{exchangeRates ? convertForDisplay(stats.currentBalance, currency, exchangeRates).toFixed(currency === 'NGN' ? 0 : 2) : parseFloat(stats.currentBalance).toLocaleString()}</p></div>
                            <div><p className="text-[10px] text-slate-500 uppercase font-bold">Withdrawals</p><p className="text-sm md:text-lg font-mono text-red-400">-{currencySymbol}{exchangeRates ? convertForDisplay(stats.totalWithdrawals, currency, exchangeRates).toFixed(currency === 'NGN' ? 0 : 2) : parseFloat(stats.totalWithdrawals).toLocaleString()}</p></div>
                            <div><p className="text-[10px] text-slate-500 uppercase font-bold">Growth</p><p className={`text-sm md:text-lg font-mono font-bold ${stats.growthPct >= 0 ? 'text-jtg-green' : 'text-red-500'}`}>{stats.growthPct > 0 ? '+' : ''}{stats.growthPct}%</p></div>
                        </div>
                    )}
                </div>

                <h2 className="text-3xl font-bold text-white mb-8 tracking-wide">Performance Data</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard title="Net PnL" value={`${currencySymbol}${exchangeRates ? convertForDisplay(stats.netPnL, currency, exchangeRates).toFixed(currency === 'NGN' ? 0 : 2) : stats.netPnL}`} color={parseFloat(stats.netPnL) >= 0 ? 'emerald' : 'red'} />
                    <StatCard title="Win Rate" value={`${stats.winRate}%`} color="white" />
                    <StatCard title="Profit Factor" value={stats.profitFactor} color="white" />
                    <StatCard title="Top Pair" value={stats.bestPair} color="emerald" icon={<span className="text-jtg-green"><Icons.Trophy /></span>} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <StatCard title="Total Trades" value={stats.total} color="white" />
                    <StatCard title="Winning Trades" value={stats.wins} color="emerald" icon={<span className="text-jtg-green"><Icons.ThumbsUp /></span>} />
                    <StatCard title="Losing Trades" value={stats.loss} color="red" icon={<span className="text-red-500"><Icons.ThumbsDown /></span>} />
                </div>
                <div className="bg-jtg-card border border-jtg-blue/30 rounded-2xl p-8 shadow-xl flex flex-col items-center justify-center min-h-[300px] mb-8">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4"><span className="text-jtg-green"><Icons.Chart /></span></div>
                    <h3 className="text-lg font-bold text-white">Equity Curve Visualizer</h3>
                    <p className="text-slate-400 text-sm max-w-md text-center mt-2">Log more trades to generate your consistency graph.</p>
                </div>
            </div>
            <JtgPromo />
        </div>
    );
};

export default Performance;
