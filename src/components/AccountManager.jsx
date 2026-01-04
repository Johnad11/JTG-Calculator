import React, { useState } from 'react';
import { Icons } from './Icons';

const AccountManager = ({ accounts = [], activeAccountId, switchAccount, addAccount, deleteAccount, close, isPremium = false }) => {
    const canDelete = accounts.length > 1;
    const [isAdding, setIsAdding] = useState(false);
    const [newAccountName, setNewAccountName] = useState('');
    const [newAccountType, setNewAccountType] = useState('Personal');
    const [newAccountBalance, setNewAccountBalance] = useState('');
    const [newAccountRules, setNewAccountRules] = useState([]);
    const [ruleInput, setRuleInput] = useState('');

    const personalAccounts = accounts.filter(a => a.type === 'Personal');
    const propAccounts = accounts.filter(a => a.type === 'Prop Firm');

    const [showPremiumModal, setShowPremiumModal] = useState(false);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newAccountName || !newAccountBalance) {
            console.warn("Missing required fields");
            return;
        }

        setIsAdding(true);
        console.log("Attempting to add account:", { newAccountName, newAccountType, newAccountBalance, newAccountRules });

        try {
            const success = await addAccount({
                name: newAccountName,
                type: newAccountType,
                balance: newAccountBalance,
                rules: newAccountRules
            });

            console.log("Add account result:", success);

            if (success) {
                setIsAdding(false);
                setNewAccountName('');
                setNewAccountBalance('');
                setNewAccountType('Personal');
                setNewAccountRules([]);
                setRuleInput('');
            } else {
                alert("Failed to create account. Please try again or check console for details.");
            }
        } catch (err) {
            console.error("Error in handleAdd:", err);
            alert("An error occurred: " + err.message);
        } finally {
            setIsAdding(false); // Ensure loading state is cleared
        }
    };

    const addRule = (e) => {
        e.preventDefault();
        if (!ruleInput.trim()) return;
        setNewAccountRules([...newAccountRules, ruleInput.trim()]);
        setRuleInput('');
    };

    const removeRule = (index) => {
        setNewAccountRules(newAccountRules.filter((_, i) => i !== index));
    };

    const MAX_PERSONAL = isPremium ? 3 : 1;
    const MAX_PROP = isPremium ? 5 : 1;

    const canAddPersonal = personalAccounts.length < MAX_PERSONAL;
    const canAddProp = propAccounts.length < MAX_PROP;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-jtg-dark border border-jtg-green/30 w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] relative">

                {/* Header */}
                <div className="bg-jtg-green/10 p-4 border-b border-jtg-green/20 flex justify-between items-center">
                    <h2 className="text-white font-bold text-lg flex items-center gap-2">
                        <Icons.User /> Manage Accounts
                    </h2>
                    <button onClick={close} className="text-slate-400 hover:text-white transition">
                        <Icons.X />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto custom-scroll flex-1">

                    {/* PERSONAL ACCOUNTS */}
                    <div className="mb-6">
                        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 flex justify-between">
                            Personal Accounts <span>{personalAccounts.length}/{MAX_PERSONAL}</span>
                        </h3>
                        <div className="flex flex-col gap-2">
                            {personalAccounts.map(acc => (
                                <div key={acc.id} className="flex items-center gap-2 group">
                                    <button
                                        onClick={() => switchAccount(acc.id)}
                                        className={`flex-1 flex items-center justify-between p-3 rounded-lg border transition-all ${activeAccountId === acc.id ? 'bg-jtg-green/20 border-jtg-green text-white' : 'bg-jtg-blue/10 border-transparent text-slate-300 hover:bg-jtg-blue/20'}`}
                                    >
                                        <span className="font-semibold">{acc.name}</span>
                                        <span className="font-mono text-sm opacity-80">${acc.balance}</span>
                                    </button>
                                    {canDelete && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteAccount(acc.id); }}
                                            className="p-2 text-slate-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                            title="Delete Account"
                                        >
                                            <Icons.Trash />
                                        </button>
                                    )}
                                </div>
                            ))}
                            {personalAccounts.length === 0 && <div className="text-slate-500 text-sm italic p-2 text-center">No personal accounts</div>}
                        </div>
                    </div>

                    {/* PROP ACCOUNTS */}
                    <div className="mb-6">
                        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 flex justify-between">
                            Prop Firm Accounts <span>{propAccounts.length}/{MAX_PROP}</span>
                        </h3>
                        <div className="flex flex-col gap-2">
                            {propAccounts.map(acc => (
                                <div key={acc.id} className="flex flex-col mb-2">
                                    <div className="flex items-center gap-2 group">
                                        <button
                                            onClick={() => switchAccount(acc.id)}
                                            className={`flex-1 flex items-center justify-between p-3 rounded-lg border transition-all ${activeAccountId === acc.id ? 'bg-jtg-green/20 border-jtg-green text-white' : 'bg-jtg-blue/10 border-transparent text-slate-300 hover:bg-jtg-blue/20'}`}
                                        >
                                            <span className="font-semibold">{acc.name}</span>
                                            <div className="text-right">
                                                <div className="font-mono text-sm opacity-80">${acc.balance}</div>
                                                {acc.rules && acc.rules.length > 0 && (
                                                    <div className="text-[10px] text-jtg-green opacity-70">{acc.rules.length} Rules Active</div>
                                                )}
                                            </div>
                                        </button>
                                        {canDelete && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteAccount(acc.id); }}
                                                className="p-2 text-slate-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                title="Delete Account"
                                            >
                                                <Icons.Trash />
                                            </button>
                                        )}
                                    </div>
                                    {acc.rules && acc.rules.length > 0 && activeAccountId === acc.id && (
                                        <div className="bg-black/20 p-2 rounded mt-1 mx-2 text-xs text-slate-400 border-l-2 border-jtg-green/30">
                                            <div className="font-bold mb-1 text-slate-500 uppercase tracking-wider text-[10px]">Account Rules:</div>
                                            <ul className="list-disc pl-4 space-y-1">
                                                {acc.rules.map((rule, i) => (
                                                    <li key={i}>{rule}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {propAccounts.length === 0 && <div className="text-slate-500 text-sm italic p-2 text-center">No prop firm accounts</div>}
                        </div>
                    </div>
                </div>

                {/* Footer / Add Action */}
                <div className="p-4 border-t border-jtg-green/20 bg-jtg-blue/5">
                    {!isAdding ? (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="w-full py-3 bg-jtg-green text-black font-bold rounded hover:bg-green-400 transition flex items-center justify-center gap-2"
                        >
                            <Icons.Plus /> ADD NEW ACCOUNT
                        </button>
                    ) : (
                        <form onSubmit={handleAdd} className="flex flex-col gap-3 animate-fade-in-up">
                            <div className="flex gap-2">
                                <select
                                    value={newAccountType}
                                    onChange={(e) => setNewAccountType(e.target.value)}
                                    className="bg-black/40 border border-slate-700 rounded p-2 text-white text-sm focus:border-jtg-green outline-none"
                                >
                                    <option value="Personal">Personal</option>
                                    <option value="Prop Firm">Prop Firm</option>
                                </select>
                                <input
                                    type="text"
                                    placeholder="Account Name"
                                    value={newAccountName}
                                    onChange={(e) => setNewAccountName(e.target.value)}
                                    className="flex-1 bg-black/40 border border-slate-700 rounded p-2 text-white text-sm focus:border-jtg-green outline-none"
                                    required
                                />
                            </div>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="Initial Balance"
                                value={newAccountBalance}
                                onChange={(e) => setNewAccountBalance(e.target.value)}
                                className="w-full bg-black/40 border border-slate-700 rounded p-2 text-white text-sm focus:border-jtg-green outline-none"
                                required
                            />

                            {newAccountType === 'Prop Firm' && (
                                <div className="bg-black/20 p-3 rounded border border-slate-700/50">
                                    <div className="text-xs font-bold text-slate-400 mb-2 uppercase">Account Rules</div>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={ruleInput}
                                            onChange={(e) => setRuleInput(e.target.value)}
                                            placeholder="e.g. Max Daily Loss 5%"
                                            className="flex-1 bg-black/40 border border-slate-700 rounded p-1.5 text-white text-xs focus:border-jtg-green outline-none"
                                            onKeyDown={(e) => e.key === 'Enter' && addRule(e)}
                                        />
                                        <button
                                            type="button"
                                            onClick={addRule}
                                            className="bg-jtg-green/20 text-jtg-green border border-jtg-green/30 rounded px-3 hover:bg-jtg-green/30 transition"
                                        >
                                            <Icons.Plus />
                                        </button>
                                    </div>

                                    {newAccountRules.length > 0 && (
                                        <ul className="space-y-1 max-h-24 overflow-y-auto custom-scroll">
                                            {newAccountRules.map((rule, idx) => (
                                                <li key={idx} className="flex justify-between items-center text-xs text-slate-300 bg-black/40 p-1.5 rounded">
                                                    <span>{rule}</span>
                                                    <button type="button" onClick={() => removeRule(idx)} className="text-red-400 hover:text-red-300">
                                                        <Icons.X />
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}

                            {(newAccountType === 'Personal' && !canAddPersonal) || (newAccountType === 'Prop Firm' && !canAddProp) ? (
                                <div className="text-center p-3">
                                    <div className="text-red-400 text-xs font-bold mb-2">
                                        {isPremium ? 'Maximum Account Limit Reached' : `Free Plan Limit Reached (${newAccountType === 'Personal' ? MAX_PERSONAL : MAX_PROP}/${newAccountType === 'Personal' ? MAX_PERSONAL : MAX_PROP})`}
                                    </div>
                                    {!isPremium && (
                                        <button
                                            type="button"
                                            onClick={() => setShowPremiumModal(true)}
                                            className="text-xs bg-gradient-to-r from-jtg-green to-emerald-500 text-black font-bold py-2 px-4 rounded hover:brightness-110 transition shadow-lg w-full flex items-center justify-center gap-2"
                                        >
                                            <Icons.Star className="w-3 h-3" /> UPGRADE TO PREMIUM
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsAdding(false)}
                                        className="flex-1 py-2 bg-slate-700 text-white rounded hover:bg-slate-600 transition text-sm font-bold"
                                    >
                                        CANCEL
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isAdding} // Disable while invalid or adding
                                        className={`flex-1 py-2 bg-jtg-green text-black rounded hover:bg-green-400 transition text-sm font-bold ${isAdding ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {isAdding ? 'CREATING...' : 'CREATE'}
                                    </button>
                                </div>
                            )}
                        </form>
                    )}
                </div>

                {/* PREMIUM COMING SOON MODAL */}
                {showPremiumModal && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in p-6 text-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-jtg-green/20 rounded-full flex items-center justify-center text-jtg-green">
                                <Icons.Star className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-1">Coming Soon</h3>
                                <p className="text-slate-400 text-sm max-w-[200px]">
                                    Premium features are currently under development. Stay tuned!
                                </p>
                            </div>
                            <button
                                onClick={() => setShowPremiumModal(false)}
                                className="mt-2 px-6 py-2 bg-slate-700 text-white rounded-full text-sm font-bold hover:bg-slate-600 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccountManager;
