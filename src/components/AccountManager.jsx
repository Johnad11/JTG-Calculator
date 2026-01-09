import React, { useState } from 'react';
import { Icons } from './Icons';
import { convertForDisplay, convertForStorage } from '../utils/currencyConverter';

const AccountManager = ({ accounts = [], activeAccountId, switchAccount, addAccount, deleteAccount, close, isPremium = false, currencySymbol = '$', currency = 'USD', exchangeRates }) => {
    const canDelete = accounts.length > 1;
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [newAccountName, setNewAccountName] = useState('');
    const [newAccountType, setNewAccountType] = useState('Personal');
    const [newAccountBalance, setNewAccountBalance] = useState('');
    const [newAccountCurrency, setNewAccountCurrency] = useState('USD');
    const [newAccountRules, setNewAccountRules] = useState([]);
    const [ruleInput, setRuleInput] = useState('');

    const personalAccounts = accounts.filter(a => a.type === 'Personal');
    const propAccounts = accounts.filter(a => a.type === 'Prop Firm');
    const syntheticAccounts = accounts.filter(a => a.type === 'Synthetic');

    const [showPremiumModal, setShowPremiumModal] = useState(false);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newAccountName || !newAccountBalance) {
            console.warn("Missing required fields");
            return;
        }

        // Final check for limits before proceeding
        if (newAccountType === 'Personal' && personalAccounts.length >= MAX_PERSONAL) {
            alert(`You've reached the maximum of ${MAX_PERSONAL} personal accounts on your current plan.`);
            setIsAdding(false);
            return;
        }
        if (newAccountType === 'Prop Firm' && propAccounts.length >= MAX_PROP) {
            alert(`You've reached the maximum of ${MAX_PROP} prop firm accounts on your current plan.`);
            setIsAdding(false);
            return;
        }
        if (newAccountType === 'Synthetic' && syntheticAccounts.length >= MAX_SYNTHETIC) {
            alert(`You've reached the maximum of ${MAX_SYNTHETIC} synthetic accounts on your current plan.`);
            setIsAdding(false);
            return;
        }

        setIsAdding(true);
        console.log("Attempting to add account:", { newAccountName, newAccountType, newAccountBalance, newAccountRules });

        try {
            // Add a safety timeout of 10 seconds
            const addPromise = addAccount({
                name: newAccountName,
                type: newAccountType,
                balance: exchangeRates ? convertForStorage(newAccountBalance, newAccountCurrency, exchangeRates).toString() : newAccountBalance,
                currency: newAccountCurrency,
                rules: newAccountRules
            });

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Request timed out. Please check your connection.")), 15000)
            );

            const success = await Promise.race([addPromise, timeoutPromise]);

            console.log("Add account result:", success);

            if (success) {
                setNewAccountName('');
                setNewAccountBalance('');
                setNewAccountType('Personal');
                setNewAccountCurrency('USD');
                setNewAccountRules([]);
                setRuleInput('');
                setIsFormOpen(false); // Close the form
                setIsAdding(false); // Explicitly set false after success
            } else {
                // If addAccount returned false (e.g. handled internal error)
                setIsAdding(false);
            }
        } catch (err) {
            console.error("Error in handleAdd:", err);
            alert("An error occurred: " + err.message);
            setIsAdding(false);
        } finally {
            setIsAdding(false); // Double safety to ensure loading state is cleared
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

    const MAX_PERSONAL = isPremium ? 3 : 2;
    const MAX_PROP = isPremium ? 5 : 3;
    const MAX_SYNTHETIC = isPremium ? 5 : 2;

    const canAddPersonal = personalAccounts.length < MAX_PERSONAL;
    const canAddProp = propAccounts.length < MAX_PROP;
    const canAddSynthetic = syntheticAccounts.length < MAX_SYNTHETIC;

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
                                        <span className="font-mono text-sm opacity-80">
                                            {currencySymbol}{exchangeRates ? convertForDisplay(acc.balance, currency, exchangeRates).toFixed(currency === 'NGN' ? 0 : 2) : parseFloat(acc.balance).toFixed(2)}
                                        </span>
                                    </button>
                                    {canDelete && (
                                        <button
                                            onClick={(e) => {
                                                console.log("AccountManager: Personal Delete clicked", acc.id);
                                                e.stopPropagation();
                                                deleteAccount(acc.id);
                                            }}
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
                                                <div className="font-mono text-sm opacity-80">
                                                    {currencySymbol}{exchangeRates ? convertForDisplay(acc.balance, currency, exchangeRates).toFixed(currency === 'NGN' ? 0 : 2) : parseFloat(acc.balance).toFixed(2)}
                                                </div>
                                                {acc.rules && acc.rules.length > 0 && (
                                                    <div className="text-[10px] text-jtg-green opacity-70">{acc.rules.length} Rules Active</div>
                                                )}
                                            </div>
                                        </button>
                                        {canDelete && (
                                            <button
                                                onClick={(e) => {
                                                    console.log("AccountManager: Prop Delete clicked", acc.id);
                                                    e.stopPropagation();
                                                    deleteAccount(acc.id);
                                                }}
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

                    {/* SYNTHETIC ACCOUNTS */}
                    <div className="mb-6">
                        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 flex justify-between">
                            Synthetic Accounts <span>{syntheticAccounts.length}/{MAX_SYNTHETIC}</span>
                        </h3>
                        <div className="flex flex-col gap-2">
                            {syntheticAccounts.map(acc => (
                                <div key={acc.id} className="flex flex-col mb-2">
                                    <div className="flex items-center gap-2 group">
                                        <button
                                            onClick={() => switchAccount(acc.id)}
                                            className={`flex-1 flex items-center justify-between p-3 rounded-lg border transition-all ${activeAccountId === acc.id ? 'bg-jtg-green/20 border-jtg-green text-white' : 'bg-jtg-blue/10 border-transparent text-slate-300 hover:bg-jtg-blue/20'}`}
                                        >
                                            <span className="font-semibold">{acc.name}</span>
                                            <div className="text-right">
                                                <div className="font-mono text-sm opacity-80">
                                                    {currencySymbol}{exchangeRates ? convertForDisplay(acc.balance, currency, exchangeRates).toFixed(currency === 'NGN' ? 0 : 2) : parseFloat(acc.balance).toFixed(2)}
                                                </div>
                                                <div className="text-[10px] text-jtg-green opacity-70">Weltrade Info Sync</div>
                                            </div>
                                        </button>
                                        {canDelete && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteAccount(acc.id);
                                                }}
                                                className="p-2 text-slate-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                title="Delete Account"
                                            >
                                                <Icons.Trash />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {syntheticAccounts.length === 0 && <div className="text-slate-500 text-sm italic p-2 text-center">No synthetic accounts</div>}
                        </div>
                    </div>
                </div>

                {/* Footer / Add Action */}
                <div className="p-4 border-t border-jtg-green/20 bg-jtg-blue/5">
                    {!isFormOpen ? (
                        <button
                            onClick={() => setIsFormOpen(true)}
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
                                    <option value="Synthetic">Synthetic</option>
                                </select>
                                <input
                                    type="text"
                                    placeholder="Account Name"
                                    value={newAccountName}
                                    onChange={(e) => setNewAccountName(e.target.value)}
                                    required
                                />
                                <select
                                    value={newAccountCurrency}
                                    onChange={(e) => setNewAccountCurrency(e.target.value)}
                                    className="bg-black/40 border border-slate-700 rounded p-2 text-white text-sm focus:border-jtg-green outline-none"
                                >
                                    <option value="USD">USD ($)</option>
                                </select>
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

                            {newAccountType === 'Synthetic' && (
                                <div className="bg-jtg-green/5 p-3 rounded border border-jtg-green/20 text-[11px] text-slate-300 mb-2 italic">
                                    <div className="flex items-center gap-2 text-jtg-green font-bold mb-1 uppercase tracking-wider">
                                        <Icons.Journal className="w-3 h-3" /> Weltrade Info
                                    </div>
                                    Synthetic accounts follow Weltrade synthetic pairs specifications and are restricted to synthetic instruments.
                                </div>
                            )}

                            {(newAccountType === 'Personal' && !canAddPersonal) || (newAccountType === 'Prop Firm' && !canAddProp) || (newAccountType === 'Synthetic' && !canAddSynthetic) ? (
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
                                        onClick={() => setIsFormOpen(false)}
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
