import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import JtgPromo from './JtgPromo';
import { ASSETS } from '../constants';
import { convertForDisplay, convertForStorage } from '../utils/currencyConverter';

const Calculator = ({ globalBalance, currencySymbol = '$', currency = 'USD', exchangeRates, ratesLoading = false, activeAccount }) => {
    // Global balance is now stored in account's native currency
    const displayBalance = globalBalance 
        ? parseFloat(globalBalance).toFixed(2) 
        : "100000.00";

    const [balance, setBalance] = useState(displayBalance);

    // Update local balance when global balance or currency changes
    useEffect(() => {
        if (globalBalance) {
            setBalance(parseFloat(globalBalance).toFixed(2));
        }
    }, [globalBalance]);

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
        
        // Risk in account currency (e.g. NGN)
        const riskInAccountCurrency = riskMode === 'percent' ? balance * (riskValue / 100) : parseFloat(riskValue);
        
        // IMPORTANT: Convert risk to BASE_CURRENCY (USD) for lot calculation
        // Forex lot formulas standardized for USD base unless the pair itself is specified in account currency
        const riskDollars = convertForStorage(riskInAccountCurrency, currency, exchangeRates);
        
        const entry = parseFloat(entryPrice);
        const sl = parseFloat(stopLoss);
        const tp = takeProfit ? parseFloat(takeProfit) : null;
        const dist = Math.abs(entry - sl);

        let contractSize = ASSETS[assetClass]?.contract || 1;

        // CUSTOM OVERRIDES FOR SPECIAL PAIRS
        if (pair.includes('XAU')) contractSize = 100;
        else if (pair.includes('XAG')) contractSize = 5000;

        let lot = 0;
        if (pair.includes('JPY') && assetClass === 'forex') {
            const jpyRate = exchangeRates && exchangeRates['JPY'] ? exchangeRates['JPY'] : 155.0;
            lot = riskDollars / (dist * (contractSize / jpyRate));
        } else lot = riskDollars / (dist * contractSize);

        let profitInUSD = null; let rr = null;
        if (tp) {
            const reward = Math.abs(tp - entry);
            rr = (reward / dist).toFixed(2);
            profitInUSD = (riskDollars * (reward / dist)).toFixed(2);
        }
        
        // Convert profit back to account currency for display
        const profit = profitInUSD ? convertForDisplay(profitInUSD, currency, exchangeRates).toFixed(currency === 'NGN' ? 0 : 2) : null;
        const displayRisk = riskInAccountCurrency.toFixed(currency === 'NGN' ? 0 : 2);

        setResult({ lot: lot.toFixed(2), risk: displayRisk, rr: rr, profit: profit });
    };

    useEffect(() => {
        if (entryPrice && stopLoss && balance) {
            const t = setTimeout(calculate, 300);
            return () => clearTimeout(t);
        }
    }, [balance, riskMode, riskValue, entryPrice, stopLoss, takeProfit, pair]);

    return (
        <div id="calculator-container" className="flex flex-col p-4 md:p-10 pb-24 md:pb-10 h-full overflow-y-auto custom-scroll">
            {ratesLoading && currency !== 'USD' && (
                <div className="mb-4 p-3 bg-jtg-blue/20 border border-jtg-blue/40 rounded-lg text-center flex items-center justify-center gap-2">
                    <p className="text-xs text-muted-theme">Loading live exchange rates...</p>
                </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pop mb-auto">
                <div className="lg:col-span-7 space-y-8">
                    <div className="flex gap-2 p-1.5 bg-input-theme rounded-xl overflow-x-auto shadow-inner border border-theme no-scrollbar">
                        {Object.keys(ASSETS).map(key => (
                            <button key={key} onClick={() => setAssetClass(key)}
                                className={`flex-1 py-3 px-4 rounded-lg text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${assetClass === key ? 'bg-jtg-blue text-white shadow-md' : 'text-muted-theme hover:text-main-theme'}`}>
                                {ASSETS[key].label}
                            </button>
                        ))}
                    </div>
                    <div className="bg-card-theme border border-theme rounded-2xl p-8 shadow-xl relative overflow-hidden text-main-theme">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-jtg-green to-jtg-blue"></div>
                        <div className="mb-8">
                            <label className="text-xs font-bold text-muted-theme uppercase mb-3 block tracking-wider">Instrument</label>
                            <div className="relative">
                                <select id="calculator-instrument-select" value={pair} onChange={(e) => setPair(e.target.value)} className="w-full bg-input-theme border border-theme text-main-theme text-lg font-medium rounded-xl p-4 pr-10 focus:ring-2 focus:ring-jtg-green/50 outline-none appearance-none">
                                    {ASSETS[assetClass].pairs.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><Icons.ChevronDown /></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6 mb-8">
                            <div><label className="text-xs font-bold text-muted-theme uppercase mb-3 block">Balance (Required)</label><input id="calculator-balance-input" type="number" value={balance} onChange={(e) => setBalance(e.target.value)} className="w-full bg-input-theme border border-theme rounded-xl p-4 text-main-theme font-mono text-lg font-medium focus:ring-2 focus:ring-jtg-green/50 outline-none" required /></div>
                            <div><label className="text-xs font-bold text-muted-theme uppercase mb-3 block">Risk</label><div className="flex bg-input-theme border border-theme rounded-xl overflow-hidden"><input id="calculator-risk-input" type="number" value={riskValue} onChange={(e) => setRiskValue(e.target.value)} className="w-full bg-transparent p-4 text-main-theme font-mono text-lg font-medium outline-none z-10" /><button id="calculator-risk-toggle-btn" onClick={() => setRiskMode(riskMode === 'percent' ? 'usd' : 'percent')} className="bg-jtg-blue/10 border-l border-theme px-6 text-sm font-bold text-jtg-blue hover:bg-jtg-blue/20 transition">{riskMode === 'percent' ? '%' : currencySymbol}</button></div></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div><label className="text-xs font-bold text-jtg-green uppercase">Entry</label><input id="calculator-entry-input" type="number" placeholder="0.00" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} className="w-full bg-input-theme border border-theme rounded-xl p-4 text-main-theme font-mono focus:ring-2 focus:ring-jtg-green/50 outline-none" /></div>
                            <div><label className="text-xs font-bold text-red-500 uppercase">Stop Loss</label><input id="calculator-sl-input" type="number" placeholder="0.00" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} className="w-full bg-input-theme border border-theme rounded-xl p-4 text-main-theme font-mono focus:ring-2 focus:ring-red-500/50 outline-none" /></div>
                            <div><label className="text-xs font-bold text-muted-theme uppercase">TP (Opt)</label><input id="calculator-tp-input" type="number" placeholder="Optional" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} className="w-full bg-input-theme border border-theme rounded-xl p-4 text-main-theme font-mono focus:ring-2 focus:ring-slate-400 outline-none" /></div>
                        </div>
                        <button id="calculator-calculate-btn" onClick={calculate} className="w-full mt-10 bg-jtg-blue hover:bg-[#12227a] text-white font-bold uppercase tracking-widest py-5 rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm">Calculate Position</button>
                    </div>
                </div>
                <div className="lg:col-span-5 flex flex-col gap-8">
                    <div id="calculator-lot-result-card" className="bg-card-theme border border-theme rounded-2xl p-10 text-center relative overflow-hidden shadow-xl min-h-[350px] flex flex-col justify-center items-center text-main-theme">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1 bg-jtg-green shadow-[0_0_20px_rgba(27,166,87,0.4)]"></div>
                        {result ? (
                            <div className="animate-pop w-full">
                                <p className="text-muted-theme text-xs font-bold uppercase tracking-[0.3em] mb-4">Recommended Position</p>
                                <div className="text-8xl font-black text-main-theme tracking-tighter mb-4 leading-none">{result.lot}</div>
                                <div className="inline-block bg-emerald-500/20 text-jtg-green border border-emerald-500/30 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-10">Standard Lots</div>
                                <div className="w-full h-px bg-theme mb-8"></div>
                                <div className="flex justify-between items-center w-full px-2 mb-6">
                                    <div className="text-left"><p className="text-muted-theme text-[10px] font-bold uppercase mb-1">Risk</p><p className="text-xl font-bold text-red-500 font-mono">{currencySymbol}{result.risk}</p></div>
                                    {result.profit && <div className="text-right"><p className="text-muted-theme text-[10px] font-bold uppercase mb-1">Gain</p><p className="text-xl font-bold text-jtg-green font-mono">+{currencySymbol}{result.profit}</p></div>}
                                </div>
                                {result.rr && <div className="w-full bg-input-theme rounded-xl p-4 border border-theme flex justify-between items-center"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-jtg-green"></div><span className="text-muted-theme text-xs font-bold uppercase">R:R</span></div><span className="text-main-theme font-mono text-xl font-bold">1 : {result.rr}</span></div>}
                            </div>
                        ) : (
                            <div className="opacity-40 flex flex-col items-center"><div className="w-24 h-24 border-4 border-theme rounded-full flex items-center justify-center mb-6"><span className="text-4xl text-muted-theme">--</span></div><p className="text-sm font-medium tracking-wide text-muted-theme">Awaiting Details</p></div>
                        )}
                    </div>
                </div>
            </div>
            <JtgPromo />
        </div>
    );
};

export default React.memo(Calculator);
