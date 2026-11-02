import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { ASSETS } from '../constants';
import { convertForDisplay, convertForStorage } from '../utils/currencyConverter';

const Calculator = ({ globalBalance, currencySymbol = '$', currency = 'USD', exchangeRates, ratesLoading = false, activeAccount, username, user }) => {
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
            {/* Welcome Greeting Block (Moved from left panel) */}
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-black text-main-theme tracking-tight">
                    Welcome, <span className="text-jtg-green">{username ? `@${username}` : (user?.email ? user.email.split('@')[0] : 'Trader')}</span>!
                </h1>
                <p className="text-xs text-muted-theme mt-1.5 font-medium italic tracking-wide">
                    "Discipline is not a constraint — it's your edge. Journal every trade, master every pattern."
                </p>
            </div>

            {ratesLoading && currency !== 'USD' && (
                <div className="mb-4 p-3 bg-jtg-blue/20 border border-jtg-blue/40 rounded-lg text-center flex items-center justify-center gap-2">
                    <p className="text-xs text-muted-theme">Loading live exchange rates...</p>
                </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pop mb-auto">
                <div className="lg:col-span-7 space-y-6">
                    {/* Asset Class Capsule Pills */}
                    <div className="flex gap-2 p-1.5 bg-input-theme rounded-full overflow-x-auto border border-theme no-scrollbar">
                        {Object.keys(ASSETS).map(key => (
                            <button key={key} onClick={() => setAssetClass(key)}
                                className={`flex-1 py-2.5 px-5 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all whitespace-nowrap ${assetClass === key ? 'bg-jtg-blue text-white shadow-md shadow-jtg-blue/20' : 'text-muted-theme hover:text-main-theme'}`}>
                                {ASSETS[key].label}
                            </button>
                        ))}
                    </div>

                    <div className="bento-card p-6 md:p-8 rounded-3xl relative overflow-hidden text-main-theme">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-jtg-green to-jtg-blue"></div>
                        <div className="mb-6">
                            <label className="text-[11px] font-extrabold text-muted-theme uppercase mb-2.5 block tracking-widest">Select Instrument</label>
                            <div className="relative">
                                <select id="calculator-instrument-select" value={pair} onChange={(e) => setPair(e.target.value)} className="w-full bg-input-theme border border-theme text-main-theme text-base font-bold rounded-2xl p-4 pr-10 focus:ring-2 focus:ring-jtg-blue/40 outline-none appearance-none transition-all">
                                    {ASSETS[assetClass].pairs.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-theme pointer-events-none"><Icons.ChevronDown /></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                            <div>
                                <label className="text-[11px] font-extrabold text-muted-theme uppercase mb-2 block tracking-widest">Account Balance</label>
                                <input id="calculator-balance-input" type="number" value={balance} onChange={(e) => setBalance(e.target.value)} className="w-full bg-input-theme border border-theme rounded-2xl p-4 text-main-theme font-mono text-base font-bold focus:ring-2 focus:ring-jtg-blue/40 outline-none transition-all" required />
                            </div>
                            <div>
                                <label className="text-[11px] font-extrabold text-muted-theme uppercase mb-2 block tracking-widest">Risk Allocation</label>
                                <div className="flex bg-input-theme border border-theme rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-jtg-blue/40 transition-all">
                                    <input id="calculator-risk-input" type="number" value={riskValue} onChange={(e) => setRiskValue(e.target.value)} className="w-full bg-transparent p-4 text-main-theme font-mono text-base font-bold outline-none z-10" />
                                    <button id="calculator-risk-toggle-btn" onClick={() => setRiskMode(riskMode === 'percent' ? 'usd' : 'percent')} className="bg-jtg-blue/10 border-l border-theme px-5 text-xs font-black text-jtg-blue hover:bg-jtg-blue/20 transition uppercase tracking-wider">
                                        {riskMode === 'percent' ? '%' : currencySymbol}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                            <div>
                                <label className="text-[11px] font-extrabold text-jtg-green uppercase mb-1.5 block tracking-wider">Entry Price</label>
                                <input id="calculator-entry-input" type="number" placeholder="0.00" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} className="w-full bg-input-theme border border-theme rounded-2xl p-3.5 text-main-theme font-mono text-sm font-bold focus:ring-2 focus:ring-jtg-green/50 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="text-[11px] font-extrabold text-red-500 uppercase mb-1.5 block tracking-wider">Stop Loss</label>
                                <input id="calculator-sl-input" type="number" placeholder="0.00" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} className="w-full bg-input-theme border border-theme rounded-2xl p-3.5 text-main-theme font-mono text-sm font-bold focus:ring-2 focus:ring-red-500/50 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="text-[11px] font-extrabold text-muted-theme uppercase mb-1.5 block tracking-wider">Take Profit (Opt)</label>
                                <input id="calculator-tp-input" type="number" placeholder="Optional" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} className="w-full bg-input-theme border border-theme rounded-2xl p-3.5 text-main-theme font-mono text-sm font-bold focus:ring-2 focus:ring-slate-400 outline-none transition-all" />
                            </div>
                        </div>

                        <button id="calculator-calculate-btn" onClick={calculate} className="w-full mt-4 bg-jtg-blue hover:bg-blue-700 text-white font-extrabold uppercase tracking-widest py-4.5 rounded-full shadow-lg hover:shadow-blue-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-xs md:text-sm">
                            <span>Calculate Position</span>
                            <Icons.ArrowUpRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-5 flex flex-col gap-6">
                    <div id="calculator-lot-result-card" className="bento-card p-8 md:p-10 rounded-3xl text-center relative overflow-hidden min-h-[350px] flex flex-col justify-center items-center text-main-theme">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-jtg-green rounded-full shadow-[0_0_20px_rgba(27,166,87,0.4)]"></div>
                        {result ? (
                            <div className="animate-pop w-full">
                                <p className="text-muted-theme text-[11px] font-extrabold uppercase tracking-[0.25em] mb-4">Recommended Lot Size</p>
                                <div className="text-7xl md:text-8xl font-black text-main-theme tracking-tight mb-4 leading-none font-sans">{result.lot}</div>
                                <div className="inline-block bg-emerald-500/15 text-jtg-green border border-emerald-500/30 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-8">
                                    Standard Lots
                                </div>
                                <div className="w-full h-px bg-theme mb-6"></div>
                                <div className="flex justify-between items-center w-full px-2 mb-6">
                                    <div className="text-left">
                                        <p className="text-muted-theme text-[10px] font-extrabold uppercase tracking-wider mb-1">Risk Amount</p>
                                        <p className="text-xl font-black text-red-500 font-mono">{currencySymbol}{result.risk}</p>
                                    </div>
                                    {result.profit && (
                                        <div className="text-right">
                                            <p className="text-muted-theme text-[10px] font-extrabold uppercase tracking-wider mb-1">Expected Gain</p>
                                            <p className="text-xl font-black text-jtg-green font-mono">+{currencySymbol}{result.profit}</p>
                                        </div>
                                    )}
                                </div>
                                {result.rr && (
                                    <div className="w-full bg-input-theme rounded-2xl p-4 border border-theme flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-jtg-green"></div>
                                            <span className="text-muted-theme text-xs font-bold uppercase tracking-wider">Risk / Reward</span>
                                        </div>
                                        <span className="text-main-theme font-mono text-lg font-black">1 : {result.rr}</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="opacity-40 flex flex-col items-center">
                                <div className="w-20 h-20 border-2 border-dashed border-theme rounded-full flex items-center justify-center mb-4">
                                    <span className="text-3xl text-muted-theme font-light">--</span>
                                </div>
                                <p className="text-xs font-bold tracking-wider text-muted-theme uppercase">Awaiting Parameters</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(Calculator);
