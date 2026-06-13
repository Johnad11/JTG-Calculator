import React, { useState, useMemo } from 'react';
import { Icons } from './Icons';
import StatCard from './StatCard';
import EquityChart from './EquityChart';
import { convertForDisplay } from '../utils/currencyConverter';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    Cell 
} from 'recharts';

const Performance = ({ trades, withdrawals = [], globalBalance, globalInitialBalance, updateGlobalBalance, updateInitialBalance, currencySymbol = '$', currency = 'USD', exchangeRates, activeAccount }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempBalance, setTempBalance] = useState(() => {
        const bal = globalInitialBalance || globalBalance || '';
        return bal;
    });

    const stats = useMemo(() => {
        const total = trades ? trades.length : 0;
        if (total === 0) return { total: 0, winRate: 0, netPnL: 0, growthPct: 0, expectancy: 0, disciplineScore: 0, profitFactor: 0, currentBalance: 0, totalWithdrawals: 0, bestPair: 'N/A', leagueTable: [] };

        const wins = trades.filter(t => t && parseFloat(t.pnl || 0) > 0);
        const losses = trades.filter(t => t && parseFloat(t.pnl || 0) < 0);
        
        const winCount = wins.length;
        const lossCount = losses.length;

        const grossProfitNative = trades.reduce((acc, t) => {
            if (!t) return acc;
            const val = t.pnlNative ? parseFloat(t.pnlNative) : (exchangeRates && exchangeRates[currency] ? convertForDisplay(t.pnl, currency, exchangeRates) : parseFloat(t.pnl || 0));
            return (val > 0 && !isNaN(val)) ? acc + val : acc;
        }, 0);

        const grossLossNative = Math.abs(trades.reduce((acc, t) => {
            if (!t) return acc;
            const val = t.pnlNative ? parseFloat(t.pnlNative) : (exchangeRates && exchangeRates[currency] ? convertForDisplay(t.pnl, currency, exchangeRates) : parseFloat(t.pnl || 0));
            return (val < 0 && !isNaN(val)) ? acc + val : acc;
        }, 0));

        const netPnLNative = (grossProfitNative || 0) - (grossLossNative || 0);
        
        // Discipline Score
        const disciplinedTrades = trades.filter(t => t && t.ruleAdherence === 'Yes').length;
        const disciplineScore = total > 0 ? ((disciplinedTrades / total) * 100).toFixed(1) : 0;

        // Expectancy: (WinRate * AvgWin) - (LossRate * AvgLoss)
        const avgWin = winCount > 0 ? (grossProfitNative / winCount) : 0;
        const avgLoss = lossCount > 0 ? (grossLossNative / lossCount) : 0;
        const winRateVal = total > 0 ? (winCount / total) : 0;
        const lossRateVal = total > 0 ? (lossCount / total) : 0;
        const expectancy = (winRateVal * avgWin) - (lossRateVal * avgLoss);

        // Sharpe Ratio (Simplified)
        const returns = trades.map(t => {
            if (!t) return 0;
            const val = t.pnlNative ? parseFloat(t.pnlNative) : (exchangeRates && exchangeRates[currency] ? convertForDisplay(t.pnl, currency, exchangeRates) : parseFloat(t.pnl || 0));
            return isNaN(val) ? 0 : val;
        });
        const avgReturn = total > 0 ? (returns.reduce((a, b) => a + b, 0) / total) : 0;
        const variance = total > 0 ? (returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / total) : 0;
        const stdDev = Math.sqrt(variance);
        const sharpeRatio = (stdDev > 0.0001 && !isNaN(stdDev)) ? (avgReturn / stdDev).toFixed(2) : 0;

        // League Table (Pairs)
        const pairStats = {};
        trades.forEach(t => { 
            if (!t || !t.pair) return;
            if (!pairStats[t.pair]) pairStats[t.pair] = { pnl: 0, count: 0, wins: 0 }; 
            const pnlVal = t.pnlNative ? parseFloat(t.pnlNative) : (exchangeRates && exchangeRates[currency] ? convertForDisplay(t.pnl, currency, exchangeRates) : parseFloat(t.pnl || 0));
            if (!isNaN(pnlVal)) {
                pairStats[t.pair].pnl += pnlVal; 
                pairStats[t.pair].count++;
                if (pnlVal > 0) pairStats[t.pair].wins++;
            }
        });

        const leagueTable = Object.entries(pairStats).map(([pair, data]) => ({
            pair,
            ...data,
            winRate: data.count > 0 ? ((data.wins / data.count) * 100).toFixed(1) : 0
        })).sort((a, b) => b.pnl - a.pnl);

        const bestPair = leagueTable[0]?.pair || 'N/A';

        // Withdrawals
        const totalWithdrawals = withdrawals ? withdrawals.reduce((acc, w) => acc + parseFloat(w.amount || 0), 0) : 0;

        // Growth
        const startBal = globalInitialBalance ? parseFloat(globalInitialBalance) : parseFloat(globalBalance || 0);
        const growthPct = (startBal > 0) ? (netPnLNative / startBal) * 100 : 0;

        return {
            total,
            wins: winCount,
            loss: lossCount,
            winRate: (winRateVal * 100).toFixed(1),
            netPnL: netPnLNative.toFixed(currency === 'NGN' ? 0 : 2),
            profitFactor: grossLossNative > 0 ? (grossProfitNative / grossLossNative).toFixed(2) : (grossProfitNative > 0 ? 'MAX' : '0.00'),
            expectancy: isNaN(expectancy) ? '0.00' : expectancy.toFixed(2),
            sharpeRatio: isNaN(sharpeRatio) ? '0.00' : sharpeRatio,
            disciplineScore: isNaN(disciplineScore) ? '0.0' : disciplineScore,
            bestPair,
            leagueTable,
            currentBalance: (parseFloat(globalBalance || 0)).toFixed(2),
            growthPct: isNaN(growthPct) ? '0.00' : growthPct.toFixed(2),
            totalWithdrawals: totalWithdrawals.toFixed(2)
        };
    }, [trades, globalBalance, withdrawals, currency, exchangeRates, globalInitialBalance]);

    const heatmapData = useMemo(() => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayStats = days.map(day => ({ name: day, pnl: 0 }));
        const hourStats = Array.from({ length: 24 }, (_, i) => ({ name: `${i}:00`, pnl: 0 }));

        if (trades) {
            trades.forEach(t => {
                if (!t) return;
                const tradeDate = t.closeDate || t.openDate;
                if (!tradeDate) return;
                const date = new Date(tradeDate);
                if (isNaN(date.getTime())) return;

                const pnlVal = t.pnlNative ? parseFloat(t.pnlNative) : (exchangeRates && exchangeRates[currency] ? convertForDisplay(t.pnl, currency, exchangeRates) : parseFloat(t.pnl || 0));
                if (isNaN(pnlVal)) return;
                
                const dayIndex = date.getDay();
                const hourIndex = date.getHours();

                if (dayStats[dayIndex]) dayStats[dayIndex].pnl += pnlVal;
                if (hourStats[hourIndex]) hourStats[hourIndex].pnl += pnlVal;
            });
        }

        return { dayStats, hourStats };
    }, [trades, currency, exchangeRates]);

    const chartData = useMemo(() => {
        if (!trades) return [];
        const startPnLSum = trades.reduce((acc, t) => {
            if (!t) return acc;
            const pnlVal = t.pnlNative ? parseFloat(t.pnlNative) : (exchangeRates && exchangeRates[currency] ? convertForDisplay(t.pnl, currency, exchangeRates) : parseFloat(t.pnl || 0));
            return isNaN(pnlVal) ? acc : acc + pnlVal;
        }, 0);

        const startBalNative = activeAccount?.balance ? parseFloat(activeAccount.balance) - startPnLSum : 0;
        const data = [{
            date: 'Start',
            balance: isNaN(startBalNative) ? 0 : startBalNative
        }];

        let runningBalance = isNaN(startBalNative) ? 0 : startBalNative;
        trades.forEach((t, index) => {
            if (!t) return;
            const pnlVal = t.pnlNative ? parseFloat(t.pnlNative) : (exchangeRates && exchangeRates[currency] ? convertForDisplay(t.pnl, currency, exchangeRates) : parseFloat(t.pnl || 0));
            if (isNaN(pnlVal)) return;
            runningBalance += pnlVal;
            data.push({
                date: t.closeDate ? new Date(t.closeDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : `Trade ${index + 1}`,
                balance: runningBalance
            });
        });

        return data;
    }, [trades, activeAccount, currency, exchangeRates]);

    const saveBalance = () => {
        if (updateInitialBalance) updateInitialBalance(tempBalance);
        else updateGlobalBalance(tempBalance);
        setIsEditing(false);
    };

    return (
        <div className="animate-pop overflow-y-auto custom-scroll p-4 md:p-10 pb-24 md:pb-10 h-full flex flex-col">
            <div className="mb-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-white tracking-wide">Evolution Analytics</h2>
                </div>

                {/* ACCOUNT HEALTH */}
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
                            <div><p className="text-[10px] text-slate-500 uppercase font-bold">Starting</p><p className="text-sm md:text-lg font-mono text-slate-300">{currencySymbol}{parseFloat(globalInitialBalance || globalBalance || 0).toLocaleString(undefined, { minimumFractionDigits: currency === 'NGN' ? 0 : 2, maximumFractionDigits: currency === 'NGN' ? 0 : 2 })}</p></div>
                            <div><p className="text-[10px] text-slate-500 uppercase font-bold">Current</p><p className="text-lg md:text-2xl font-mono text-white font-bold">{currencySymbol}{parseFloat(stats.currentBalance).toLocaleString(undefined, { minimumFractionDigits: currency === 'NGN' ? 0 : 2, maximumFractionDigits: currency === 'NGN' ? 0 : 2 })}</p></div>
                            <div><p className="text-[10px] text-slate-500 uppercase font-bold">Withdrawals</p><p className="text-sm md:text-lg font-mono text-red-400">-{currencySymbol}{parseFloat(stats.totalWithdrawals).toLocaleString(undefined, { minimumFractionDigits: currency === 'NGN' ? 0 : 2, maximumFractionDigits: currency === 'NGN' ? 0 : 2 })}</p></div>
                            <div><p className="text-[10px] text-slate-500 uppercase font-bold">Growth</p><p className={`text-sm md:text-lg font-mono font-bold ${parseFloat(stats.growthPct) >= 0 ? 'text-jtg-green' : 'text-red-500'}`}>{parseFloat(stats.growthPct) > 0 ? '+' : ''}{stats.growthPct}%</p></div>
                        </div>
                    )}
                </div>

                {/* INSTITUTIONAL METRICS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard title="Expectancy" value={`${currencySymbol}${stats.expectancy}`} color="white" />
                    <StatCard title="Sharpe Ratio" value={stats.sharpeRatio} color="white" />
                    <StatCard title="Discipline Score" value={`${stats.disciplineScore}%`} color="emerald" />
                    <StatCard title="Win Rate" value={`${stats.winRate}%`} color="white" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard title="Gross Profit" value={`${currencySymbol}${stats.netPnL}`} color={parseFloat(stats.netPnL) >= 0 ? 'emerald' : 'red'} />
                    <StatCard title="Profit Factor" value={stats.profitFactor} color="white" />
                    <StatCard title="Best Pair" value={stats.bestPair} color="emerald" icon={<span className="text-jtg-green"><Icons.Trophy /></span>} />
                </div>

                {/* CHARTS GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* EQUITY CURVE */}
                    <div className="bg-jtg-card border border-jtg-blue/30 rounded-2xl p-6 shadow-xl flex flex-col h-[400px]">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Icons.Chart /> Equity Curve</h3>
                        <div className="flex-1 w-full">
                            {trades.length > 0 ? <EquityChart data={chartData} currencySymbol={currencySymbol} /> : <NoData />}
                        </div>
                    </div>

                    {/* DAY OF WEEK HEATMAP */}
                    <div className="bg-jtg-card border border-jtg-blue/30 rounded-2xl p-6 shadow-xl flex flex-col h-[400px]">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Icons.Calendar /> Performance by Day</h3>
                        <div className="flex-1 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={heatmapData.dayStats}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#162C99" opacity={0.1} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                                    <YAxis hide />
                                    <Tooltip 
                                        cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-jtg-dark border border-jtg-blue/30 p-2 rounded text-xs font-bold text-white shadow-xl">
                                                        {payload[0].payload.name}: {currencySymbol}{payload[0].value.toLocaleString()}
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar dataKey="pnl">
                                        {heatmapData.dayStats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#1BA657' : '#EF4444'} opacity={0.8} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                    {/* HOUR OF DAY HEATMAP */}
                    <div className="bg-jtg-card border border-jtg-blue/30 rounded-2xl p-6 shadow-xl flex flex-col h-[400px]">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Icons.Clock /> Performance by Hour</h3>
                        <div className="flex-1 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={heatmapData.hourStats}>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 8}} interval={2} />
                                    <YAxis hide />
                                    <Tooltip 
                                        cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-jtg-dark border border-jtg-blue/30 p-2 rounded text-xs font-bold text-white shadow-xl">
                                                        {payload[0].payload.name}: {currencySymbol}{payload[0].value.toLocaleString()}
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar dataKey="pnl">
                                        {heatmapData.hourStats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#1BA657' : '#EF4444'} opacity={0.8} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* ASSET LEAGUE TABLE */}
                    <div className="bg-jtg-card border border-jtg-blue/30 rounded-2xl p-6 shadow-xl flex flex-col h-[400px] overflow-hidden">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Icons.Trophy /> Asset League Table</h3>
                        <div className="flex-1 overflow-y-auto custom-scroll">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-700">
                                        <th className="py-2 text-[10px] text-slate-500 uppercase">Pair</th>
                                        <th className="py-2 text-[10px] text-slate-500 uppercase text-center">Trades</th>
                                        <th className="py-2 text-[10px] text-slate-500 uppercase text-center">WR%</th>
                                        <th className="py-2 text-[10px] text-slate-500 uppercase text-right">Net PnL</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.leagueTable?.map(row => (
                                        <tr key={row.pair} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                                            <td className="py-3 font-bold text-white text-sm">{row.pair}</td>
                                            <td className="py-3 text-center text-xs text-slate-400">{row.count}</td>
                                            <td className="py-3 text-center text-xs text-white">{row.winRate}%</td>
                                            <td className={`py-3 text-right font-mono text-sm ${row.pnl >= 0 ? 'text-jtg-green' : 'text-red-500'}`}>
                                                {row.pnl >= 0 ? '+' : ''}{currencySymbol}{row.pnl.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const NoData = () => (
    <div className="w-full h-full flex flex-col items-center justify-center text-center opacity-50 py-10">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-jtg-green"><Icons.Chart /></div>
        <h3 className="text-lg font-bold text-white">Log trades to see analytics</h3>
        <p className="text-slate-400 text-sm max-w-md mt-2">Your performance visualization will appear here.</p>
    </div>
);

export default React.memo(Performance);
