import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import JtgPromo from './JtgPromo';
import { ASSETS } from '../constants';
import { convertForDisplay, convertForStorage } from '../utils/currencyConverter';

const Calculator = ({ globalBalance, currencySymbol = '$', currency = 'USD', exchangeRates, ratesLoading = false }) => {
    // Convert global balance from USD to selected currency for display
    const displayBalance = exchangeRates && globalBalance
        ? convertForDisplay(globalBalance, currency, exchangeRates)
        : globalBalance || 100000;

    const [balance, setBalance] = useState(displayBalance);

    // Update local balance when global balance or currency changes
    useEffect(() => {
        if (globalBalance && exchangeRates) {
            const converted = convertForDisplay(globalBalance, currency, exchangeRates);
            setBalance(converted);
        } else if (globalBalance) {
            setBalance(globalBalance);
        }
    }, [globalBalance, currency, exchangeRates]);

    const [riskMode, setRiskMode] = useState('percent');
    const [riskValue, setRiskValue] = useState(1.0);
    const [assetClass, setAssetClass] = useState('indices');
    const [pair, setPair] = useState('US30');
    const [entryPrice, setEntryPrice] = useState('');
    const [stopLoss, setStopLoss] = useState('');
    const [takeProfit, setTakeProfit] = useState('');
    const [result, setResult] = useState(null);

    useEffect(() => { setPair(ASSETS[assetClass].pairs[0]); setResult(null); }, [assetClass]);

    const calculate = () => {
        if (!entryPrice || !stopLoss || !balance) return;
        const riskDollars = riskMode === 'percent' ? balance * (riskValue / 100) : parseFloat(riskValue);
        const entry = parseFloat(entryPrice);
        const sl = parseFloat(stopLoss);
        const tp = takeProfit ? parseFloat(takeProfit) : null;
        const dist = Math.abs(entry - sl);

        let contractSize = ASSETS[assetClass]?.contract || 1;

        // CUSTOM OVERRIDES FOR SPECIAL PAIRS
        if (pair.includes('XAU')) contractSize = 100;
        else if (pair.includes('XAG')) contractSize = 5000;

        let lot = 0;
        if (pair.includes('JPY') && assetClass === 'forex') lot = riskDollars / (dist * 100 * 6.8);
        else lot = riskDollars / (dist * contractSize);

        let profit = null; let rr = null;
        if (tp) {
            const reward = Math.abs(tp - entry);
            rr = (reward / dist).toFixed(2);
            profit = (riskDollars * (reward / dist)).toFixed(2);
        }
        setResult({ lot: lot.toFixed(2), risk: riskDollars.toFixed(2), rr: rr, profit: profit });
    };

    useEffect(() => {
        if (entryPrice && stopLoss && balance) {
            const t = setTimeout(calculate, 300);
            return () => clearTimeout(t);
        }
    }, [balance, riskMode, riskValue, entryPrice, stopLoss, takeProfit, pair]);

    return (
        <div id="calculator-container" className="flex flex-col h-full overflow-y-auto custom-scroll p-4 md:p-10 pb-24 md:pb-10">
            {ratesLoading && currency !== 'USD' && (
                <div className="mb-4 p-3 bg-jtg-blue/20 border border-jtg-blue/40 rounded-lg text-center">
                    <p className="text-xs text-slate-300">Loading exchange rates...</p>
                </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pop mb-auto">
                <div className="lg:col-span-7 space-y-8">
                    <div className="flex gap-2 p-1.5 bg-jtg-input rounded-xl overflow-x-auto shadow-inner border border-jtg-blue/30 no-scrollbar">
                        {Object.keys(ASSETS).map(key => (
                            <button key={key} onClick={() => setAssetClass(key)}
                                className={`flex-1 py-3 px-4 rounded-lg text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${assetClass === key ? 'bg-gradient-to-r from-jtg-blue to-blue-700 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                                {ASSETS[key].label}
                            </button>
                        ))}
                    </div>
                    <div className="bg-jtg-card border border-jtg-blue/30 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-jtg-green to-jtg-blue"></div>
                        <div className="mb-8">
                            <label className="text-xs font-bold text-slate-400 uppercase mb-3 block tracking-wider">Instrument</label>
                            <div className="relative">
                                <select value={pair} onChange={(e) => setPair(e.target.value)} className="w-full bg-jtg-input border border-jtg-blue/40 text-white text-lg font-medium rounded-xl p-4 pr-10 focus:ring-2 focus:ring-jtg-green/50 outline-none appearance-none">
                                    {ASSETS[assetClass].pairs.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"><Icons.ChevronDown /></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6 mb-8">
                            <div><label className="text-xs font-bold text-slate-400 uppercase mb-3 block">Balance (Required)</label><input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} className="w-full bg-jtg-input border border-jtg-blue/40 rounded-xl p-4 text-white font-mono text-lg font-medium focus:ring-2 focus:ring-jtg-green/50 outline-none" required /></div>
                            <div><label className="text-xs font-bold text-slate-400 uppercase mb-3 block">Risk</label><div className="flex bg-jtg-input border border-jtg-blue/40 rounded-xl overflow-hidden"><input type="number" value={riskValue} onChange={(e) => setRiskValue(e.target.value)} className="w-full bg-transparent p-4 text-white font-mono text-lg font-medium outline-none z-10" /><button onClick={() => setRiskMode(riskMode === 'percent' ? 'usd' : 'percent')} className="bg-jtg-blue/20 border-l border-jtg-blue/40 px-6 text-sm font-bold text-jtg-green hover:bg-jtg-blue/40 transition">{riskMode === 'percent' ? '%' : currencySymbol}</button></div></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div><label className="text-xs font-bold text-jtg-green uppercase">Entry</label><input type="number" placeholder="0.00" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} className="w-full bg-jtg-input border border-jtg-blue/40 rounded-xl p-4 text-white font-mono focus:ring-2 focus:ring-jtg-green/50 outline-none" /></div>
                            <div><label className="text-xs font-bold text-red-500 uppercase">Stop Loss</label><input type="number" placeholder="0.00" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} className="w-full bg-jtg-input border border-jtg-blue/40 rounded-xl p-4 text-white font-mono focus:ring-2 focus:ring-red-500/50 outline-none" /></div>
                            <div><label className="text-xs font-bold text-slate-400 uppercase">TP (Opt)</label><input type="number" placeholder="Optional" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} className="w-full bg-jtg-input border border-jtg-blue/40 rounded-xl p-4 text-white font-mono focus:ring-2 focus:ring-slate-500 outline-none" /></div>
                        </div>
                        <button onClick={calculate} className="w-full mt-10 bg-gradient-to-r from-jtg-green to-emerald-600 hover:from-emerald-600 hover:to-jtg-green text-white font-bold uppercase tracking-widest py-5 rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm">Calculate Position</button>
                    </div>
                </div>
                <div className="lg:col-span-5 flex flex-col gap-8">
                    <div className="bg-gradient-to-b from-jtg-card to-jtg-dark border border-jtg-blue/30 rounded-2xl p-10 text-center relative overflow-hidden shadow-2xl min-h-[350px] flex flex-col justify-center items-center">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1 bg-jtg-green shadow-[0_0_50px_rgba(27,166,87,0.6)]"></div>
                        {result ? (
                            <div className="animate-pop w-full">
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em] mb-4">Recommended Position</p>
                                <div className="text-8xl font-black text-white tracking-tighter drop-shadow-2xl mb-4 leading-none">{result.lot}</div>
                                <div className="inline-block bg-jtg-green/10 text-jtg-green border border-jtg-green/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-10">Standard Lots</div>
                                <div className="w-full h-px bg-jtg-blue/30 mb-8"></div>
                                <div className="flex justify-between items-center w-full px-2 mb-6">
                                    <div className="text-left"><p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Risk</p><p className="text-xl font-bold text-red-500 font-mono">{currencySymbol}{result.risk}</p></div>
                                    {result.profit && <div className="text-right"><p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Gain</p><p className="text-xl font-bold text-jtg-green font-mono">+{currencySymbol}{result.profit}</p></div>}
                                </div>
                                {result.rr && <div className="w-full bg-slate-800/40 rounded-xl p-4 border border-slate-700/50 flex justify-between items-center"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-jtg-green"></div><span className="text-slate-400 text-xs font-bold uppercase">R:R</span></div><span className="text-white font-mono text-xl font-bold">1 : {result.rr}</span></div>}
                            </div>
                        ) : (
                            <div className="opacity-20 flex flex-col items-center"><div className="w-24 h-24 border-4 border-slate-700 rounded-full flex items-center justify-center mb-6"><span className="text-4xl text-slate-600">--</span></div><p className="text-sm font-medium tracking-wide">Awaiting Details</p></div>
                        )}
                    </div>
                </div>
            </div>
            <JtgPromo />
        </div>
    );
};

export default Calculator;
