import React, { useState } from 'react';
import { Icons } from './Icons';
import JtgPromo from './JtgPromo';
import { ASSETS } from '../constants';

const Journal = ({ addTrade, accountType = 'Personal' }) => {
    // Filter pairs based on account type
    const availablePairs = Object.keys(ASSETS)
        .reduce((acc, key) => acc.concat(ASSETS[key].pairs), [])
        .sort();

    const [formData, setFormData] = useState({
        openDate: new Date().toISOString().slice(0, 16),
        closeDate: '',
        strategy: '',
        pair: 'US30',
        type: 'BUY',
        entry: '',
        sl: '',
        tp: '',
        lot: '',
        exit: '',
        emotion: 'Calm',
        setupQuality: 'A',
        ruleAdherence: 'Yes'
    });

    // Update pair when account type changes
    React.useEffect(() => {
        setFormData(prev => ({
            ...prev,
            pair: 'US30'
        }));
    }, [accountType]);

    const handleSubmit = (e) => {
        e.preventDefault();
        addTrade(formData);
        // Keep persistent fields but reset entry/exit data
        setFormData({ 
            ...formData, 
            entry: '', 
            sl: '', 
            tp: '', 
            lot: '', 
            exit: '', 
            closeDate: '',
            emotion: 'Calm',
            setupQuality: 'A',
            ruleAdherence: 'Yes'
        });
    };

    return (
        <div className="flex flex-col items-center min-h-full w-full animate-pop overflow-y-auto custom-scroll p-4 md:p-10 pb-24 md:pb-10">
            <div id="journal-form-container" className="bg-jtg-card border border-jtg-blue/30 rounded-2xl p-8 shadow-xl w-full max-w-2xl mb-8 shrink-0">
                <div className="flex items-center justify-between mb-6 border-b border-jtg-blue/20 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-jtg-blue/20 flex items-center justify-center text-jtg-green"><Icons.Journal /></div>
                        <h2 className="text-2xl font-bold text-white tracking-wide">Log New Trade</h2>
                    </div>
                    <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-jtg-blue/20 text-slate-400 border border-jtg-blue/30">
                        {accountType} Account
                    </div>
                </div>

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
                    
                    {/* PSYCHOLOGY SECTION */}
                    <div className="pt-4 border-t border-jtg-blue/20">
                        <label className="text-xs font-bold text-jtg-green uppercase tracking-widest mb-4 block">Psychology & Discipline</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Dominant Emotion</label>
                                <select 
                                    value={formData.emotion} 
                                    onChange={e => setFormData({ ...formData, emotion: e.target.value })} 
                                    className="w-full bg-jtg-input border border-jtg-blue/40 rounded-lg p-2 text-white text-xs outline-none"
                                >
                                    {['Calm', 'Confident', 'Anxious', 'FOMO', 'Greedy', 'Fearful'].map(emo => (
                                        <option key={emo} value={emo}>{emo}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Setup Quality</label>
                                <select 
                                    value={formData.setupQuality} 
                                    onChange={e => setFormData({ ...formData, setupQuality: e.target.value })} 
                                    className="w-full bg-jtg-input border border-jtg-blue/40 rounded-lg p-2 text-white text-xs outline-none"
                                >
                                    {['A+', 'A', 'B', 'C'].map(q => (
                                        <option key={q} value={q}>{q} Setup</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Followed Rules?</label>
                                <select 
                                    value={formData.ruleAdherence} 
                                    onChange={e => setFormData({ ...formData, ruleAdherence: e.target.value })} 
                                    className="w-full bg-jtg-input border border-jtg-blue/40 rounded-lg p-2 text-white text-xs outline-none"
                                >
                                    <option value="Yes">Yes (Disciplined)</option>
                                    <option value="No">No (Impulsive)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-jtg-green hover:bg-emerald-600 text-white font-bold py-4 rounded-lg mt-6 transition-colors flex items-center justify-center gap-2 shadow-lg"><Icons.Plus /> ADD ENTRY TO LOGS</button>
                </form>
            </div>
            <JtgPromo />
        </div>
    );
};

export default React.memo(Journal);
