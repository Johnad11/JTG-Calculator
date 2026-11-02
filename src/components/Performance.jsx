import React, { useState, useMemo, useEffect } from 'react';
import { Icons } from './Icons';
import StatCard from './StatCard';
import EquityChart from './EquityChart';
import StreakBadgeWidget from './StreakBadgeWidget';
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

const safeDate = (raw) => {
    if (!raw) return new Date();
    const d = new Date(raw);
    return isNaN(d.getTime()) ? new Date() : d;
};

const safeDateStr = (dateObj) => {
    const d = (dateObj && !isNaN(dateObj.getTime())) ? dateObj : new Date();
    return d.toISOString().split('T')[0];
};

const Performance = ({ trades = [], withdrawals = [], deposits = [], globalBalance, globalInitialBalance, updateGlobalBalance, updateInitialBalance, currencySymbol = '$', currency = 'USD', exchangeRates, activeAccount, userSettings }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempBalance, setTempBalance] = useState(() => {
        const bal = activeAccount?.balance || globalInitialBalance || globalBalance || '';
        return bal;
    });

    useEffect(() => {
        const bal = activeAccount?.balance || globalInitialBalance || globalBalance || '';
        setTempBalance(bal);
    }, [activeAccount?.id, activeAccount?.balance, globalBalance, globalInitialBalance]);

    const stats = useMemo(() => {
        const safeTrades = Array.isArray(trades) ? trades : [];
        const total = safeTrades.length;
        if (total === 0) return { total: 0, winRate: 0, netPnL: 0, growthPct: 0, expectancy: 0, disciplineScore: 0, profitFactor: 0, currentBalance: 0, totalWithdrawals: 0, totalDeposits: 0, bestPair: 'N/A', leagueTable: [] };

        const wins = safeTrades.filter(t => t && parseFloat(t.pnl || 0) > 0);
        const losses = safeTrades.filter(t => t && parseFloat(t.pnl || 0) < 0);
        
        const winCount = wins.length;
        const lossCount = losses.length;

        const grossProfitNative = safeTrades.reduce((acc, t) => {
            if (!t) return acc;
            const val = t.pnlNative ? parseFloat(t.pnlNative) : (exchangeRates && exchangeRates[currency] ? convertForDisplay(t.pnl, currency, exchangeRates) : parseFloat(t.pnl || 0));
            return (val > 0 && !isNaN(val)) ? acc + val : acc;
        }, 0);

        const grossLossNative = Math.abs(safeTrades.reduce((acc, t) => {
            if (!t) return acc;
            const val = t.pnlNative ? parseFloat(t.pnlNative) : (exchangeRates && exchangeRates[currency] ? convertForDisplay(t.pnl, currency, exchangeRates) : parseFloat(t.pnl || 0));
            return (val < 0 && !isNaN(val)) ? acc + val : acc;
        }, 0));

        const netPnLNative = (grossProfitNative || 0) - (grossLossNative || 0);
        
        // Discipline Score
        const disciplinedTrades = safeTrades.filter(t => t && t.ruleAdherence === 'Yes').length;
        const disciplineScore = total > 0 ? ((disciplinedTrades / total) * 100).toFixed(1) : 0;

        // Expectancy: (WinRate * AvgWin) - (LossRate * AvgLoss)
        const avgWin = winCount > 0 ? (grossProfitNative / winCount) : 0;
        const avgLoss = lossCount > 0 ? (grossLossNative / lossCount) : 0;
        const winRateVal = total > 0 ? (winCount / total) : 0;
        const lossRateVal = total > 0 ? (lossCount / total) : 0;
        const expectancy = (winRateVal * avgWin) - (lossRateVal * avgLoss);

        // Sharpe Ratio (Simplified)
        const returns = safeTrades.map(t => {
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
        safeTrades.forEach(t => { 
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
        const safeWithdrawals = Array.isArray(withdrawals) ? withdrawals : [];
        const totalWithdrawals = safeWithdrawals.reduce((acc, w) => acc + parseFloat(w?.amount || 0), 0);

        // Deposits
        const safeDeposits = Array.isArray(deposits) ? deposits : [];
        const totalDeposits = safeDeposits.reduce((acc, d) => acc + parseFloat(d?.amount || 0), 0);

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
            currentBalance: (parseFloat(activeAccount?.balance || globalBalance || 0)).toFixed(2),
            growthPct: isNaN(growthPct) ? '0.00' : growthPct.toFixed(2),
            totalWithdrawals: totalWithdrawals.toFixed(2),
            totalDeposits: totalDeposits.toFixed(2)
        };
    }, [trades, globalBalance, withdrawals, deposits, currency, exchangeRates, globalInitialBalance, activeAccount]);

    const heatmapData = useMemo(() => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayStats = days.map(day => ({ name: day, pnl: 0 }));
        const hourStats = Array.from({ length: 24 }, (_, i) => ({ name: `${i}:00`, pnl: 0 }));

        if (Array.isArray(trades)) {
            trades.forEach(t => {
                if (!t) return;
                const tradeDate = t.closeDate || t.openDate;
                if (!tradeDate) return;
                const date = safeDate(tradeDate);
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
        const events = [];

        // 1. Gather trade events
        if (Array.isArray(trades)) {
            trades.forEach((t, index) => {
                if (!t) return;
                const pnlVal = t.pnlNative ? parseFloat(t.pnlNative) : (exchangeRates && exchangeRates[currency] ? convertForDisplay(t.pnl, currency, exchangeRates) : parseFloat(t.pnl || 0));
                if (isNaN(pnlVal)) return;
                const evtDate = safeDate(t.closeDate || t.openDate);
                events.push({
                    date: evtDate,
                    amount: pnlVal,
                    label: t.closeDate && !isNaN(new Date(t.closeDate).getTime()) ? new Date(t.closeDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : `Trade ${index + 1}`
                });
            });
        }

        // 2. Gather deposit events
        if (Array.isArray(deposits)) {
            deposits.forEach((d, index) => {
                if (!d) return;
                const amountVal = parseFloat(d.amount || 0);
                if (isNaN(amountVal)) return;
                events.push({
                    date: safeDate(d.date),
                    amount: amountVal,
                    label: d.note ? `Deposit: ${d.note}` : `Deposit ${index + 1}`
                });
            });
        }

        // 3. Gather withdrawal events
        if (Array.isArray(withdrawals)) {
            withdrawals.forEach((w, index) => {
                if (!w) return;
                const amountVal = parseFloat(w.amount || 0);
                if (isNaN(amountVal)) return;
                events.push({
                    date: safeDate(w.date),
                    amount: -amountVal,
                    label: w.note ? `Withdrawal: ${w.note}` : `Withdrawal ${index + 1}`
                });
            });
        }

        // 4. Sort all events chronologically (ascending)
        events.sort((a, b) => a.date - b.date);

        // 5. Initialize chart data with start point
        const startBal = globalInitialBalance ? parseFloat(globalInitialBalance) : parseFloat(globalBalance || 0);
        const firstDate = (events[0] && !isNaN(events[0].date.getTime())) ? events[0].date : new Date();
        const data = [{
            date: 'Start',
            rawDate: safeDateStr(firstDate),
            timestamp: firstDate.getTime(),
            balance: isNaN(startBal) ? 0 : startBal
        }];

        let runningBalance = isNaN(startBal) ? 0 : startBal;
        events.forEach(evt => {
            runningBalance += evt.amount;
            data.push({
                date: evt.label,
                rawDate: safeDateStr(evt.date),
                timestamp: evt.date.getTime(),
                balance: runningBalance
            });
        });

        return data;
    }, [trades, deposits, withdrawals, globalInitialBalance, globalBalance, currency, exchangeRates]);

    const saveBalance = () => {
        if (updateInitialBalance) updateInitialBalance(tempBalance);
        else updateGlobalBalance(tempBalance);
        setIsEditing(false);
    };

    return (
        <div className="animate-pop overflow-y-auto custom-scroll p-4 md:p-10 pb-24 md:pb-10 h-full flex flex-col">
            <div className="mb-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-main-theme tracking-wide">Evolution Analytics</h2>
                </div>

                {/* ACCOUNT HEALTH */}
                <div className="bento-card p-6 md:p-8 mb-8 rounded-3xl relative overflow-hidden text-main-theme">
                    <div className="flex justify-between items-center mb-5">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-jtg-blue/15 flex items-center justify-center text-jtg-blue">
                                <Icons.Briefcase />
                            </div>
                            <h2 className="text-lg md:text-xl font-black text-main-theme">Account Health</h2>
                        </div>
                        {!isEditing && globalBalance && (
                            <button onClick={() => setIsEditing(true)} className="px-3 py-1.5 rounded-full bg-input-theme border border-theme text-xs text-jtg-green hover:bg-jtg-green hover:text-white font-bold transition-all">
                                Edit Balance
                            </button>
                        )}
                    </div>

                    {!globalBalance || isEditing ? (
                        <div className="flex gap-3 items-end">
                            <div className="flex-1">
                                <label className="text-[10px] text-muted-theme uppercase font-bold block mb-1">Set Starting Balance</label>
                                <input type="number" value={tempBalance} onChange={e => setTempBalance(e.target.value)} className="w-full bg-input-theme border border-theme rounded-2xl p-3 text-main-theme font-mono font-bold outline-none focus:ring-2 focus:ring-jtg-blue/40" placeholder="e.g. 10000" />
                            </div>
                            <button onClick={saveBalance} className="bg-jtg-green text-white px-6 py-3 rounded-full text-xs font-extrabold hover:bg-emerald-600 transition shadow-md">SAVE</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                            <div className="p-3 bg-input-theme/50 rounded-2xl border border-theme/60">
                                <p className="text-[10px] text-muted-theme uppercase font-bold tracking-wider mb-1">Starting</p>
                                <p className="text-sm md:text-base font-mono text-main-theme font-bold">{currencySymbol}{parseFloat(globalInitialBalance || globalBalance || 0).toLocaleString(undefined, { minimumFractionDigits: currency === 'NGN' ? 0 : 2, maximumFractionDigits: currency === 'NGN' ? 0 : 2 })}</p>
                            </div>
                            <div className="p-3 bg-input-theme/50 rounded-2xl border border-theme/60">
                                <p className="text-[10px] text-muted-theme uppercase font-bold tracking-wider mb-1">Deposits</p>
                                <p className="text-sm md:text-base font-mono text-emerald-600 font-bold">+{currencySymbol}{parseFloat(stats.totalDeposits).toLocaleString(undefined, { minimumFractionDigits: currency === 'NGN' ? 0 : 2, maximumFractionDigits: currency === 'NGN' ? 0 : 2 })}</p>
                            </div>
                            <div className="p-3 bg-input-theme/50 rounded-2xl border border-theme/60">
                                <p className="text-[10px] text-muted-theme uppercase font-bold tracking-wider mb-1">Withdrawals</p>
                                <p className="text-sm md:text-base font-mono text-red-500 font-bold">-{currencySymbol}{parseFloat(stats.totalWithdrawals).toLocaleString(undefined, { minimumFractionDigits: currency === 'NGN' ? 0 : 2, maximumFractionDigits: currency === 'NGN' ? 0 : 2 })}</p>
                            </div>
                            <div className="p-3 bg-input-theme/50 rounded-2xl border border-theme/60">
                                <p className="text-[10px] text-muted-theme uppercase font-bold tracking-wider mb-1">Current Balance</p>
                                <p className="text-base md:text-xl font-mono text-main-theme font-black">{currencySymbol}{parseFloat(stats.currentBalance).toLocaleString(undefined, { minimumFractionDigits: currency === 'NGN' ? 0 : 2, maximumFractionDigits: currency === 'NGN' ? 0 : 2 })}</p>
                            </div>
                            <div className="p-3 bg-input-theme/50 rounded-2xl border border-theme/60">
                                <p className="text-[10px] text-muted-theme uppercase font-bold tracking-wider mb-1">Net Growth</p>
                                <p className={`text-sm md:text-base font-mono font-black ${parseFloat(stats.growthPct) >= 0 ? 'text-jtg-green' : 'text-red-500'}`}>{parseFloat(stats.growthPct) > 0 ? '+' : ''}{stats.growthPct}%</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* MONTHLY PROFIT TARGET & STREAK BADGES */}
                <div className="grid grid-cols-1 gap-6 mb-8">
                    {/* Monthly Profit Goal Progress Bar */}
                    <div className="bento-card p-6 md:p-7 rounded-3xl">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-500">
                                    <Icons.Target className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-main-theme font-extrabold text-sm uppercase tracking-wider">Monthly Profit Goal</h4>
                                    <p className="text-[11px] text-muted-theme">Target: {currencySymbol}{parseFloat(userSettings?.monthlyTarget || 1000).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="text-left sm:text-right">
                                <span className={`text-base font-black font-mono ${parseFloat(stats.netPnL || 0) >= parseFloat(userSettings?.monthlyTarget || 1000) ? 'text-jtg-green' : 'text-jtg-blue'}`}>
                                    {currencySymbol}{parseFloat(stats.netPnL || 0).toLocaleString()} / {currencySymbol}{parseFloat(userSettings?.monthlyTarget || 1000).toLocaleString()}
                                </span>
                                <span className="text-[10px] font-mono font-extrabold text-muted-theme block uppercase">
                                    {Math.min(Math.max((parseFloat(stats.netPnL || 0) / parseFloat(userSettings?.monthlyTarget || 1000)) * 100, 0), 100).toFixed(1)}% Achieved
                                </span>
                            </div>
                        </div>
                        
                        <div className="w-full bg-input-theme h-3 rounded-full overflow-hidden p-0.5 border border-theme">
                            <div 
                                className="bg-gradient-to-r from-jtg-blue via-emerald-400 to-jtg-green h-full rounded-full transition-all duration-1000 shadow-sm"
                                style={{ width: `${Math.min(Math.max((parseFloat(stats.netPnL || 0) / parseFloat(userSettings?.monthlyTarget || 1000)) * 100, 0), 100)}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* INSTITUTIONAL METRICS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard title="Expectancy" value={`${currencySymbol}${stats.expectancy}`} color="white" />
                    <StatCard title="Sharpe Ratio" value={stats.sharpeRatio} color="white" />
                    <StatCard title="Discipline Score" value={`${stats.disciplineScore}%`} color="emerald" trend={`+${stats.disciplineScore}%`} />
                    <StatCard title="Win Rate" value={`${stats.winRate}%`} color="white" trend={`${stats.winRate}%`} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard title="Gross Profit" value={`${currencySymbol}${stats.netPnL}`} color={parseFloat(stats.netPnL) >= 0 ? 'emerald' : 'red'} />
                    <StatCard title="Profit Factor" value={stats.profitFactor} color="white" />
                    <StatCard title="Best Pair" value={stats.bestPair} color="emerald" icon={<span className="text-jtg-green"><Icons.Trophy /></span>} />
                </div>

                {/* CHARTS GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* EQUITY CURVE */}
                    <div className="bento-card p-6 md:p-7 rounded-3xl flex flex-col h-[400px]">
                        <h3 className="text-base font-extrabold text-main-theme mb-4 flex items-center gap-2"><Icons.Chart /> Equity Curve</h3>
                        <div className="flex-1 w-full">
                            {trades.length > 0 ? <EquityChart data={chartData} currencySymbol={currencySymbol} /> : <NoData />}
                        </div>
                    </div>

                    {/* DAY OF WEEK HEATMAP */}
                    <div className="bento-card p-6 md:p-7 rounded-3xl flex flex-col h-[400px]">
                        <h3 className="text-base font-extrabold text-main-theme mb-4 flex items-center gap-2"><Icons.Calendar /> Performance by Day</h3>
                        <div className="flex-1 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={heatmapData.dayStats}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-jtg-border)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--color-text-muted)', fontSize: 10}} />
                                    <YAxis hide />
                                    <Tooltip 
                                        cursor={{fill: 'rgba(0,0,0,0.03)'}}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-card-theme border border-theme p-2 rounded text-xs font-bold text-main-theme shadow-xl">
                                                        {payload[0].payload.name}: {currencySymbol}{payload[0].value.toLocaleString()}
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar dataKey="pnl">
                                        {heatmapData.dayStats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#1BA657' : '#EF4444'} opacity={0.85} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                    {/* HOUR OF DAY HEATMAP */}
                    <div className="bg-card-theme border border-theme rounded-2xl p-6 shadow-xl flex flex-col h-[400px]">
                        <h3 className="text-lg font-bold text-main-theme mb-4 flex items-center gap-2"><Icons.Clock /> Performance by Hour</h3>
                        <div className="flex-1 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={heatmapData.hourStats}>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--color-text-muted)', fontSize: 8}} interval={2} />
                                    <YAxis hide />
                                    <Tooltip 
                                        cursor={{fill: 'rgba(0,0,0,0.03)'}}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-card-theme border border-theme p-2 rounded text-xs font-bold text-main-theme shadow-xl">
                                                        {payload[0].payload.name}: {currencySymbol}{payload[0].value.toLocaleString()}
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar dataKey="pnl">
                                        {heatmapData.hourStats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#1BA657' : '#EF4444'} opacity={0.85} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* ASSET LEAGUE TABLE */}
                    <div className="bento-card p-6 md:p-7 rounded-3xl flex flex-col h-[400px] overflow-hidden">
                        <h3 className="text-base font-extrabold text-main-theme mb-4 flex items-center gap-2"><Icons.Trophy /> Asset League Table</h3>
                        <div className="flex-1 overflow-y-auto custom-scroll">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-theme">
                                        <th className="py-2 text-[10px] text-muted-theme uppercase">Pair</th>
                                        <th className="py-2 text-[10px] text-muted-theme uppercase text-center">Trades</th>
                                        <th className="py-2 text-[10px] text-muted-theme uppercase text-center">WR%</th>
                                        <th className="py-2 text-[10px] text-muted-theme uppercase text-right">Net PnL</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.leagueTable?.map(row => (
                                        <tr key={row.pair} className="border-b border-theme/50 hover:bg-input-theme transition">
                                            <td className="py-3 font-bold text-main-theme text-sm">{row.pair}</td>
                                            <td className="py-3 text-center text-xs text-muted-theme">{row.count}</td>
                                            <td className="py-3 text-center text-xs text-main-theme">{row.winRate}%</td>
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

                {/* Trading Streak Milestones (Last Card on Analytics) */}
                <div className="mb-8">
                    <StreakBadgeWidget trades={trades} showDetails={true} />
                </div>
            </div>
        </div>
    );
};

const NoData = () => (
    <div className="w-full h-full flex flex-col items-center justify-center text-center opacity-50 py-10">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-jtg-green"><Icons.Chart /></div>
        <h3 className="text-lg font-bold text-slate-800">Log trades to see analytics</h3>
        <p className="text-slate-500 text-sm max-w-md mt-2">Your performance visualization will appear here.</p>
    </div>
);

export default React.memo(Performance);
