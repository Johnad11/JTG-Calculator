import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { CURRENCIES } from '../constants';
import { Icons } from './Icons';

const AccountManager = ({ accounts = [], activeAccountId, switchAccount, addAccount, deleteAccount, close, isPremium = false, currencySymbol = '$', currency = 'USD', exchangeRates, withdrawFunds, depositFunds, updateAccount, userId, userSettings, triggerUpgrade }) => {
    const canDelete = accounts.length > 1;
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [newAccountName, setNewAccountName] = useState('');
    const [newAccountType, setNewAccountType] = useState('Personal');
    const [newAccountBalance, setNewAccountBalance] = useState('');
    const [newAccountCurrency, setNewAccountCurrency] = useState('USD');
    const [newAccountRules, setNewAccountRules] = useState([]);
    const [ruleInput, setRuleInput] = useState('');

    // TRANSACTION STATE (WITHDRAWAL / DEPOSIT)
    const [transactionMode, setTransactionMode] = useState(null);
    const [transactionAccountId, setTransactionAccountId] = useState(null);
    const [transactionAmount, setTransactionAmount] = useState('');
    const [transactionNote, setTransactionNote] = useState('');
    const [transactionLoading, setTransactionLoading] = useState(false);
    const [transactionHistory, setTransactionHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // EDIT STATE
    const [editMode, setEditMode] = useState(null);
    const [editName, setEditName] = useState('');
    const [editRules, setEditRules] = useState([]);
    const [editRuleInput, setEditRuleInput] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Determine user plan tier & max account limit
    const isEmailAdmin = userSettings?.email === 'nwabuezejohnad11@gmail.com' || userSettings?.username === 'nwabuezejohnad11';
    const planTier = isEmailAdmin ? 'diamond' : (userSettings?.planTier || (isPremium ? 'gold' : 'free'));
    const maxAccounts = planTier === 'diamond' ? 7 : (planTier === 'gold' ? 5 : 2);
    const cloudSyncCount = accounts.filter(a => a.source === 'METAAPI_CLOUD_SYNC' || a.isCloudSync).length;

    useEffect(() => {
        if (transactionAccountId && transactionMode) {
            loadTransactionHistory(transactionAccountId, transactionMode);
        }
    }, [transactionAccountId, transactionMode]);

    const loadTransactionHistory = async (accountId, mode) => {
        setHistoryLoading(true);
        try {
            const collectionName = mode === 'DEPOSIT' ? 'deposits' : 'withdrawals';
            let query = db.collection(collectionName).where('accountId', '==', accountId);
            if (userId) query = query.where('userId', '==', userId);

            const snap = await query.get();
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            docs.sort((a, b) => new Date(b.date) - new Date(a.date));
            setTransactionHistory(docs.slice(0, 20));
        } catch (e) {
            console.error(`Error loading history:`, e);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleTransactionSubmit = async (e) => {
        e.preventDefault();
        if (!transactionAmount || !transactionAccountId || !transactionMode) return;
        setTransactionLoading(true);
        try {
            const success = transactionMode === 'DEPOSIT'
                ? await depositFunds(transactionAccountId, transactionAmount, transactionNote)
                : await withdrawFunds(transactionAccountId, transactionAmount, transactionNote);
            if (success) {
                setTransactionAmount('');
                setTransactionNote('');
                loadTransactionHistory(transactionAccountId, transactionMode);
                alert(`${transactionMode === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'} recorded successfully.`);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setTransactionLoading(false);
        }
    };

    const handleEditClick = (acc) => {
        setEditMode(acc.id);
        setEditName(acc.name);
        setEditRules(acc.rules || []);
        setTransactionMode(null);
        setTransactionAccountId(null);
    };

    const handleEditSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateAccount(editMode, { name: editName, rules: editRules });
            setEditMode(null);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newAccountName || !newAccountBalance) {
            alert("Please provide an Account Name and Starting Balance.");
            return;
        }

        // Limit check
        if (accounts.length >= maxAccounts) {
            if (planTier === 'free') {
                alert(`Account limit reached: Free tier is limited to 2 accounts.\n\nUpgrade to Gold (5 accounts) or Diamond (7 accounts) to add more!`);
                triggerUpgrade();
                close();
            } else if (planTier === 'gold') {
                alert(`Account limit reached: Gold Plan allows up to 5 accounts in total.\n\nUpgrade to Diamond Plan ($1.50/mo / ₦2,450/mo) for up to 7 accounts!`);
                triggerUpgrade();
            } else {
                alert(`Account limit reached: Diamond Plan allows a maximum of 7 total accounts.`);
            }
            return;
        }

        setIsAdding(true);
        try {
            const success = await addAccount({
                name: newAccountName,
                type: newAccountType,
                balance: newAccountBalance,
                currency: newAccountCurrency,
                rules: newAccountRules
            });

            if (success) {
                setNewAccountName('');
                setNewAccountBalance('');
                setNewAccountType('Personal');
                setNewAccountCurrency('USD');
                setNewAccountRules([]);
                setRuleInput('');
                setIsFormOpen(false);
            }
        } catch (err) {
            console.error("Error adding account:", err);
            alert("An error occurred: " + err.message);
        } finally {
            setIsAdding(false);
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-jtg-dark border border-jtg-green/30 w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] relative">

                {/* Header */}
                <div className="bg-jtg-green/10 p-4 border-b border-jtg-green/20 flex justify-between items-center">
                    <h2 className="text-white font-bold text-lg flex items-center gap-2">
                        {transactionMode ? (
                            <>
                                <button onClick={() => { setTransactionMode(null); setTransactionAccountId(null); }}><Icons.ChevronLeft /></button>
                                {transactionMode === 'DEPOSIT' ? 'Deposit Funds' : 'Withdraw Funds'}
                            </>
                        ) : editMode ? (
                            <>
                                <button onClick={() => setEditMode(null)}><Icons.ChevronLeft /></button>
                                Edit Account
                            </>
                        ) : (
                            <><Icons.User /> Manage Accounts</>
                        )}
                    </h2>
                    <button onClick={close} className="text-slate-400 hover:text-white transition">
                        <Icons.X />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto custom-scroll flex-1">
                    {transactionMode ? (
                        <div className="animate-fade-in">
                            <div className={`p-4 rounded-lg border mb-6 ${transactionMode === 'DEPOSIT' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-jtg-blue/10 border-jtg-blue/20'}`}>
                                <h3 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider">
                                    New {transactionMode === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'}
                                </h3>
                                <form onSubmit={handleTransactionSubmit} className="flex flex-col gap-3">
                                    <div>
                                        <label className="text-xs text-slate-500 font-bold mb-1 block">Amount ({currencySymbol})</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={transactionAmount}
                                            onChange={(e) => setTransactionAmount(e.target.value)}
                                            className="w-full bg-black/40 border border-slate-700 rounded p-2 text-white text-lg font-mono outline-none focus:border-jtg-green"
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 font-bold mb-1 block">Note (Optional)</label>
                                        <input
                                            type="text"
                                            value={transactionNote}
                                            onChange={(e) => setTransactionNote(e.target.value)}
                                            className="w-full bg-black/40 border border-slate-700 rounded p-2 text-white text-sm outline-none focus:border-jtg-green"
                                            placeholder={transactionMode === 'DEPOSIT' ? 'e.g. Funding...' : 'e.g. Payout...'}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={transactionLoading}
                                        className={`w-full py-3 text-white font-bold rounded transition mt-2 flex items-center justify-center gap-2 ${transactionMode === 'DEPOSIT' ? 'bg-emerald-500/80 hover:bg-emerald-500' : 'bg-red-500/80 hover:bg-red-500'}`}
                                    >
                                        {transactionLoading ? 'PROCESSING...' : (transactionMode === 'DEPOSIT' ? 'DEPOSIT' : 'WITHDRAW')}
                                    </button>
                                </form>
                            </div>
                        </div>
                    ) : editMode ? (
                        <div className="animate-fade-in">
                            <form onSubmit={handleEditSave} className="flex flex-col gap-4">
                                <div>
                                    <label className="text-xs text-slate-500 font-bold mb-1 block">Account Name</label>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full bg-black/40 border border-slate-700 rounded p-2 text-white text-sm focus:border-jtg-green outline-none"
                                        required
                                    />
                                </div>
                                <button type="submit" disabled={isSaving} className="w-full py-3 bg-jtg-green text-black font-bold rounded hover:bg-green-400 transition mt-2">
                                    {isSaving ? 'SAVING...' : 'SAVE CHANGES'}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <>
                            {/* UNIFIED ACCOUNTS LIST */}
                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-slate-300 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                        <span>Your Trading Accounts</span>
                                        <span className="bg-jtg-green/15 text-jtg-green border border-jtg-green/30 text-[10px] px-2 py-0.5 rounded-full uppercase">
                                            {planTier.toUpperCase()} TIER
                                        </span>
                                    </h3>
                                    <span className="text-xs font-mono text-slate-400 font-bold">
                                        {accounts.length} / {maxAccounts} Accounts Used
                                    </span>
                                </div>

                                <div className="flex flex-col gap-2">
                                    {accounts.map(acc => (
                                        <div key={acc.id} className="flex items-center gap-2 group">
                                            <button
                                                onClick={() => switchAccount(acc.id)}
                                                className={`flex-1 flex items-center justify-between p-3 rounded-lg border transition-all ${activeAccountId === acc.id ? 'bg-jtg-green/20 border-jtg-green text-white' : 'bg-jtg-blue/10 border-transparent text-slate-300 hover:bg-jtg-blue/20'}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-sm">{acc.name}</span>
                                                    <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono uppercase">
                                                        {acc.type || 'Personal'}
                                                    </span>
                                                </div>
                                                <span className="font-mono text-sm font-bold text-[#1BA657]">
                                                    {CURRENCIES[acc.currency]?.symbol || '$'}{parseFloat(acc.balance || 0).toLocaleString(undefined, { minimumFractionDigits: acc.currency === 'NGN' ? 0 : 2, maximumFractionDigits: acc.currency === 'NGN' ? 0 : 2 })}
                                                </span>
                                            </button>

                                            <button onClick={() => handleEditClick(acc)} className="p-2 text-slate-400 hover:text-jtg-green" title="Edit">
                                                <Icons.Edit />
                                            </button>
                                            <button onClick={() => { setTransactionMode('DEPOSIT'); setTransactionAccountId(acc.id); }} className="p-2 text-slate-400 hover:text-emerald-400" title="Deposit">
                                                <Icons.Plus />
                                            </button>
                                            <button onClick={() => { setTransactionMode('WITHDRAWAL'); setTransactionAccountId(acc.id); }} className="p-2 text-slate-400 hover:text-red-400" title="Withdraw">
                                                <Icons.Minus />
                                            </button>
                                            {canDelete && (
                                                <button onClick={() => deleteAccount(acc.id)} className="p-2 text-slate-500 hover:text-red-500" title="Delete">
                                                    <Icons.Trash />
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    {accounts.length === 0 && <div className="text-slate-500 text-sm italic p-4 text-center">No trading accounts found.</div>}
                                </div>
                            </div>

                            {/* ADD ACCOUNT FORM / TRIGGER */}
                            {isFormOpen ? (
                                <form onSubmit={handleAdd} className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex flex-col gap-3 animate-fade-in">
                                    <h4 className="text-white font-bold text-xs uppercase tracking-wider">Add New Account</h4>
                                    <div>
                                        <label className="text-[10px] text-slate-400 font-bold block mb-1">ACCOUNT NAME</label>
                                        <input
                                            type="text"
                                            value={newAccountName}
                                            onChange={(e) => setNewAccountName(e.target.value)}
                                            placeholder="e.g. Funded Account #1"
                                            className="w-full bg-black/40 border border-slate-700 rounded p-2 text-xs text-white outline-none focus:border-jtg-green"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[10px] text-slate-400 font-bold block mb-1">STARTING BALANCE</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={newAccountBalance}
                                                onChange={(e) => setNewAccountBalance(e.target.value)}
                                                placeholder="10000"
                                                className="w-full bg-black/40 border border-slate-700 rounded p-2 text-xs text-white font-mono outline-none focus:border-jtg-green"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-400 font-bold block mb-1">ACCOUNT TYPE</label>
                                            <select
                                                value={newAccountType}
                                                onChange={(e) => setNewAccountType(e.target.value)}
                                                className="w-full bg-black/40 border border-slate-700 rounded p-2 text-xs text-white outline-none"
                                            >
                                                <option value="Personal">Personal Account</option>
                                                <option value="Prop Firm">Prop Firm Account</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-2">
                                        <button type="submit" disabled={isAdding} className="flex-1 py-2.5 bg-jtg-green text-black font-extrabold text-xs rounded hover:bg-green-400 transition">
                                            {isAdding ? 'ADDING...' : 'CREATE ACCOUNT'}
                                        </button>
                                        <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2.5 border border-slate-700 text-slate-400 text-xs font-bold rounded">
                                            CANCEL
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <button
                                    onClick={() => {
                                        if (accounts.length >= maxAccounts) {
                                            alert(`Account limit reached: Your ${planTier.toUpperCase()} Plan allows a maximum of ${maxAccounts} accounts.\n\nPlease upgrade your subscription tier to add more accounts!`);
                                            if (planTier !== 'diamond') triggerUpgrade();
                                        } else {
                                            setIsFormOpen(true);
                                        }
                                    }}
                                    className="w-full py-3 bg-jtg-green/15 border border-jtg-green/40 hover:bg-jtg-green/25 text-jtg-green font-extrabold text-xs tracking-wider rounded-xl transition flex items-center justify-center gap-2 uppercase"
                                >
                                    <Icons.Plus /> Add Account ({accounts.length}/{maxAccounts})
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AccountManager;
