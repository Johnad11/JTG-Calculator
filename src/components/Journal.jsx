import React, { useState } from 'react';
import { Icons } from './Icons';
import JtgPromo from './JtgPromo';
import { ASSETS } from '../constants';

const Journal = ({ addTrade, accountType = 'Personal' }) => {
    const isSynthetic = accountType === 'Synthetic';

    // Filter pairs based on account type
    const availablePairs = isSynthetic
        ? ASSETS.weltrade.pairs
        : Object.keys(ASSETS)
            .filter(key => key !== 'weltrade')
            .reduce((acc, key) => acc.concat(ASSETS[key].pairs), [])
            .sort();

    const [formData, setFormData] = useState({
        openDate: new Date().toISOString().slice(0, 16),
        closeDate: '',
        strategy: '',
        pair: isSynthetic ? ASSETS.weltrade.pairs[0] : 'US30',
        type: 'BUY',
        entry: '',
        sl: '',
        tp: '',
        lot: '',
        exit: ''
    });

    // Update pair when account type changes
    React.useEffect(() => {
        setFormData(prev => ({
            ...prev,
            pair: isSynthetic ? ASSETS.weltrade.pairs[0] : 'US30'
        }));
    }, [accountType, isSynthetic]);

    const handleSubmit = (e) => {
        e.preventDefault();
        addTrade(formData);
        setFormData({ ...formData, entry: '', sl: '', tp: '', lot: '', exit: '', closeDate: '' });
    };

    return (
        <div className="flex flex-col items-center min-h-full w-full animate-pop overflow-y-auto custom-scroll p-4 md:p-10 pb-24 md:pb-10">
            <div id="journal-form-container" className="bg-jtg-card border border-jtg-blue/30 rounded-2xl p-8 shadow-xl w-full max-w-2xl mb-8 shrink-0">
                <div className="flex items-center justify-between mb-6 border-b border-jtg-blue/20 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-jtg-blue/20 flex items-center justify-center text-jtg-green"><Icons.Journal /></div>
                        <h2 className="text-2xl font-bold text-white tracking-wide">Log New Trade</h2>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${isSynthetic ? 'bg-jtg-green/20 text-jtg-green border border-jtg-green/30' : 'bg-jtg-blue/20 text-slate-400 border border-jtg-blue/30'}`}>
                        {accountType} Account
                    </div>
                </div>

                {isSynthetic && (
                    <div className="mb-6 bg-jtg-green/5 border border-jtg-green/20 rounded-xl p-4 flex gap-4 items-center">
                        <div className="text-jtg-green"><Icons.Journal /></div>
                        <div>
                            <p className="text-xs font-bold text-jtg-green uppercase tracking-wider mb-1">Weltrade Synthetic Mode</p>
                            <p className="text-[11px] text-slate-400">This account is optimized for Weltrade synthetic indices. Standard forex, metals, and indices are hidden.</p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4"><div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Open Date</label><input type="datetime-local" value={formData.openDate} onChange={e => setFormData({ ...formData, openDate: e.target.value })} className="w-full bg-jtg-input border border-jtg-blue/40 rounded-lg p-3 text-white text-xs outline-none" required /></div><div><label className="text-[10px] font-bold text-jtg-green uppercase mb-1 block">Close Date (Required)</label><input type="datetime-local" value={formData.closeDate} onChange={e => setFormData({ ...formData, closeDate: e.target.value })} className="w-full bg-jtg-input border border-jtg-blue/40 rounded-lg p-3 text-white text-xs outline-none" required /></div></div>
                    <div><label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Strategy Name</label><input type="text" placeholder="e.g. London Breakout" value={formData.strategy} onChange={e => setFormData({ ...formData, strategy: e.target.value })} className="w-full bg-jtg-input border border-jtg-blue/40 rounded-lg p-3 text-white outline-none" required /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Pair</label>
                            <select value={formData.pair} onChange={e => setFormData({ ...formData, pair: e.target.value })} className="w-full bg-jtg-input border border-jtg-blue/40 rounded-lg p-3 text-white outline-none">
                                {availablePairs.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div><label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Type</label><select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full bg-jtg-input border border-jtg-blue/40 rounded-lg p-3 text-white outline-none"><option value="BUY">BUY</option><option value="SELL">SELL</option></select></div>
                    </div>
                    <div className="grid grid-cols-3 gap-3"><div><label className="text-[10px] font-bold text-jtg-green uppercase mb-1 block">Entry</label><input type="number" step="any" value={formData.entry} onChange={e => setFormData({ ...formData, entry: e.target.value })} className="w-full bg-jtg-input border border-jtg-blue/40 rounded-lg p-3 text-white outline-none" required /></div><div><label className="text-[10px] font-bold text-red-500 uppercase mb-1 block">SL</label><input type="number" step="any" value={formData.sl} onChange={e => setFormData({ ...formData, sl: e.target.value })} className="w-full bg-jtg-input border border-jtg-blue/40 rounded-lg p-3 text-white outline-none" /></div><div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">TP</label><input type="number" step="any" value={formData.tp} onChange={e => setFormData({ ...formData, tp: e.target.value })} className="w-full bg-jtg-input border border-jtg-blue/40 rounded-lg p-3 text-white outline-none" /></div></div>
                    <div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Lot Size</label><input type="number" step="0.01" value={formData.lot} onChange={e => setFormData({ ...formData, lot: e.target.value })} className="w-full bg-jtg-input border border-jtg-blue/40 rounded-lg p-3 text-white outline-none" required /></div><div><label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Exit Price</label><input type="number" step="any" value={formData.exit} onChange={e => setFormData({ ...formData, exit: e.target.value })} className="w-full bg-jtg-input border border-jtg-blue/40 rounded-lg p-3 text-white outline-none" /></div></div>
                    <button type="submit" className="w-full bg-jtg-green hover:bg-emerald-600 text-white font-bold py-4 rounded-lg mt-6 transition-colors flex items-center justify-center gap-2 shadow-lg"><Icons.Plus /> ADD ENTRY TO LOGS</button>
                </form>
            </div>
            <JtgPromo />
        </div>
    );
};

export default Journal;
