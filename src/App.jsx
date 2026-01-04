import React, { useState, useEffect } from 'react';
import firebase, { auth, db } from './firebase';
import { Icons } from './components/Icons';
import Calculator from './components/Calculator';
import Journal from './components/Journal';
import TradeList from './components/TradeList';
import CalendarView from './components/CalendarView';
import Performance from './components/Performance';
import AccountManager from './components/AccountManager';
import { LOGO_URL } from './constants';

const App = () => {
    const [page, setPage] = useState('calc');
    const [user, setUser] = useState(null);
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    // ACCOUNTS STATE
    const [accounts, setAccounts] = useState([]);
    const [activeAccountId, setActiveAccountId] = useState(null);
    const [showAccountManager, setShowAccountManager] = useState(false);

    // GLOBAL ACCOUNT BALANCE SETTING
    const [globalBalance, setGlobalBalance] = useState(() => localStorage.getItem('jtg_global_balance') || '');

    // TRADES STATE
    const [trades, setTrades] = useState(() => {
        try {
            const saved = localStorage.getItem('jtg_journal');
            return saved ? JSON.parse(saved) : [];
        } catch (e) { return []; }
    });

    // Update Balance Handler
    const updateGlobalBalance = async (newBal) => {
        setGlobalBalance(newBal);
        localStorage.setItem('jtg_global_balance', newBal);

        if (user && activeAccountId) {
            // Update the specific account
            try {
                await db.collection('accounts').doc(activeAccountId).update({ balance: newBal });
                setAccounts(accounts.map(a => a.id === activeAccountId ? { ...a, balance: newBal } : a));
            } catch (e) { console.error("Error updating balance:", e); }
        } else if (user) {
            // Fallback for migration edge cases
            db.collection('user_settings').doc(user.uid).set({ balance: newBal }, { merge: true });
        }
    };

    // AUTH & DATA LOADING
    useEffect(() => {
        if (auth) {
            const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
                setUser(currentUser);
                if (currentUser) {
                    try {
                        // 1. Load Accounts
                        const accountsRef = db.collection('accounts').where('userId', '==', currentUser.uid);
                        const accSnap = await accountsRef.get();
                        let userAccounts = accSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }));

                        // MIGRATION: If no accounts but user exists, create default from legacy
                        if (userAccounts.length === 0) {
                            const settingsDoc = await db.collection('user_settings').doc(currentUser.uid).get();
                            const legacyBalance = settingsDoc.exists ? settingsDoc.data().balance : '';

                            const defaultAcc = {
                                userId: currentUser.uid,
                                name: 'Personal Account 1',
                                type: 'Personal',
                                balance: legacyBalance || '0',
                                createdAt: new Date().toISOString()
                            };

                            const newAccRef = await db.collection('accounts').add(defaultAcc);
                            userAccounts = [{ ...defaultAcc, id: newAccRef.id }];

                            // Migrate existing trades
                            const tradesRef = db.collection('trades').where('userId', '==', currentUser.uid);
                            const tradesSnap = await tradesRef.get();
                            const batch = db.batch();
                            let hasUpdates = false;
                            tradesSnap.docs.forEach(doc => {
                                if (!doc.data().accountId) {
                                    batch.update(doc.ref, { accountId: newAccRef.id });
                                    hasUpdates = true;
                                }
                            });
                            if (hasUpdates) await batch.commit();
                        }

                        setAccounts(userAccounts);

                        // Select Active Account
                        const savedId = localStorage.getItem('jtg_last_account');
                        const active = userAccounts.find(a => a.id === savedId) || userAccounts[0];
                        setActiveAccountId(active ? active.id : null);
                        if (active) setGlobalBalance(active.balance);

                    } catch (e) {
                        console.error("Error loading user data:", e);
                        // Fallback (e.g. offline)
                    }
                } else {
                    setAccounts([]);
                    setActiveAccountId(null);
                    setTrades([]);
                }
            });
            return () => unsubscribe();
        }
    }, []);

    // LOAD TRADES WHEN ACTIVE ACCOUNT CHANGES
    useEffect(() => {
        if (user && activeAccountId) {
            const loadTrades = async () => {
                try {
                    const q = db.collection('trades')
                        .where('userId', '==', user.uid)
                        .where('accountId', '==', activeAccountId); // Filter by Account

                    const snapshot = await q.get();
                    const cloudTrades = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                    // Sort locally
                    setTrades(cloudTrades.sort((a, b) => b.id - a.id));

                    // Update active account balance in UI if needed
                    const acc = accounts.find(a => a.id === activeAccountId);
                    if (acc) setGlobalBalance(acc.balance);

                    localStorage.setItem('jtg_last_account', activeAccountId);
                } catch (e) { console.error("Error loading trades:", e); }
            };
            loadTrades();
        } else if (!user) {
            // Local storage fallback for guests (simplified: single account behavior)
            const saved = localStorage.getItem('jtg_journal');
            if (saved) setTrades(JSON.parse(saved));
        }
    }, [user, activeAccountId]);

    // SAVE LOCAL (GUEST)
    useEffect(() => {
        if (!user) {
            localStorage.setItem('jtg_journal', JSON.stringify(trades));
        }
    }, [trades, user]);

    const addAccount = async (accountData) => {
        if (!user) {
            console.error("addAccount called but no user is logged in");
            alert("You must be logged in to add an account.");
            return false;
        }
        try {
            console.log("Adding account to Firebase...", accountData);
            const newAcc = { ...accountData, userId: user.uid, createdAt: new Date().toISOString() };
            const ref = await db.collection('accounts').add(newAcc);
            console.log("Account added with ID:", ref.id);
            const savedAcc = { ...newAcc, id: ref.id };
            setAccounts([...accounts, savedAcc]);
            setActiveAccountId(ref.id);
            return true;
        } catch (e) {
            console.error("Firebase Add Error:", e);
            alert("Error creating account: " + e.message);
            return false;
        }
    };

    const deleteAccount = async (id) => {
        if (!user) return;
        if (accounts.length <= 1) {
            alert("You must have at least one account.");
            return;
        }

        if (!window.confirm("Are you sure you want to delete this account? All associated trades will be permanently deleted.")) return;

        try {
            // 1. Delete associated trades
            const tradesRef = db.collection('trades').where('accountId', '==', id);
            const tradesSnap = await tradesRef.get();
            const batch = db.batch();
            tradesSnap.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();

            // 2. Delete account
            await db.collection('accounts').doc(id).delete();

            // 3. Update local state
            const remainingAccounts = accounts.filter(a => a.id !== id);
            setAccounts(remainingAccounts);

            if (activeAccountId === id) {
                const nextAcc = remainingAccounts[0];
                setActiveAccountId(nextAcc.id);
                setGlobalBalance(nextAcc.balance);
            }
        } catch (e) {
            alert("Error deleting account: " + e.message);
        }
    };

    const switchAccount = (id) => {
        setActiveAccountId(id);
        setShowAccountManager(false);
    };

    const login = async () => {
        if (!auth) return alert("Firebase not configured!");
        setIsLoggingIn(true);
        const provider = new firebase.auth.GoogleAuthProvider();
        try { await auth.signInWithPopup(provider); } catch (error) { alert("Login Failed: " + error.message); } finally { setIsLoggingIn(false); }
    };

    const logout = async () => {
        if (auth) await auth.signOut();
        setTrades([]);
        window.location.reload();
    };

    const addTrade = async (formData) => {
        const e = parseFloat(formData.entry), x = parseFloat(formData.exit), s = parseFloat(formData.sl), t = parseFloat(formData.tp);
        let outcome = 'OPEN';
        if (x) {
            if (formData.type === 'BUY') {
                if (s && x <= s) outcome = 'HIT SL';
                else if (t && x >= t) outcome = 'HIT TP';
                else if (Math.abs(x - e) < (e * 0.0002)) outcome = 'BREAKEVEN';
                else if (x > e) outcome = 'MANUAL WIN';
                else outcome = 'MANUAL LOSS';
            } else {
                if (s && x >= s) outcome = 'HIT SL';
                else if (t && x <= t) outcome = 'HIT TP';
                else if (Math.abs(x - e) < (e * 0.0002)) outcome = 'BREAKEVEN';
                else if (x < e) outcome = 'MANUAL WIN';
                else outcome = 'MANUAL LOSS';
            }
        }

        let contract = 1;
        // FIX FOR GOLD PNL BUG - CHECK METAL BEFORE FOREX
        if (formData.pair.includes('XAU')) contract = 100;
        else if (formData.pair.includes('XAG')) contract = 5000;
        else if (formData.pair.length === 6 && !formData.pair.includes('USD')) contract = 100000;
        else if (formData.pair.includes('USD') && formData.pair.length === 6 && !formData.pair.includes('BTC') && !formData.pair.includes('ETH')) contract = 100000;

        let pnl = '0.00';
        if (x) {
            const diff = formData.type === 'BUY' ? (x - e) : (e - x);
            if (formData.pair.includes('JPY')) pnl = ((diff * 100 * 6.8) * formData.lot).toFixed(2);
            else pnl = (diff * formData.lot * contract).toFixed(2);
        }

        const newTrade = { ...formData, id: Date.now(), outcome, pnl, userId: user ? user.uid : 'guest', accountId: activeAccountId };

        if (user) {
            try {
                const docRef = await db.collection('trades').add(newTrade);
                const tradeWithId = { ...newTrade, id: docRef.id };
                setTrades([tradeWithId, ...trades]);
            } catch (e) {
                alert("Error saving to cloud: " + e.message);
            }
        } else {
            setTrades([newTrade, ...trades]);
        }
    };

    const deleteTrade = async (id) => {
        if (user) {
            try {
                await db.collection('trades').doc(id.toString()).delete();
                setTrades(trades.filter(t => t.id !== id));
            } catch (e) {
                alert("Error deleting from cloud: " + e.message);
            }
        } else {
            setTrades(trades.filter(t => t.id !== id));
        }
    };

    const NavBtn = ({ id, icon, label }) => (
        <button onClick={() => setPage(id)} className={`flex flex-col items-center gap-1 w-full py-4 transition-all duration-300 border-l-4 ${page === id ? 'border-jtg-green bg-jtg-blue/20 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            <span className={page === id ? 'text-jtg-green' : 'text-current'}>{icon}</span>
            <span className="text-[10px] font-bold tracking-wider">{label}</span>
        </button>
    );

    return (
        <div className="flex w-full h-full bg-jtg-dark">
            {/* SIDEBAR */}
            <div className="hidden md:flex w-24 bg-jtg-dark border-r border-jtg-blue/30 flex-col items-center py-8 z-20 shadow-2xl shrink-0 h-full overflow-y-auto custom-scroll justify-between">
                <div className="w-full flex flex-col items-center">
                    <div className="w-16 h-16 mb-10 flex items-center justify-center transition-transform hover:scale-110 mx-auto shrink-0">
                        <img src={LOGO_URL} className="w-full h-full object-contain" onError={(e) => e.target.style.display = 'none'} />
                    </div>

                    {/* ACCOUNT SWITCHER */}
                    {user && (
                        <div className="mb-6 w-full px-4">
                            <button
                                onClick={() => setShowAccountManager(true)}
                                className="w-full bg-jtg-green/10 border border-jtg-green/30 rounded-lg p-2 flex flex-col items-center gap-1 hover:bg-jtg-green/20 transition group"
                            >
                                <div className="text-jtg-green"><Icons.User /></div>
                                <span className="text-[10px] font-bold text-white max-w-full truncate">
                                    {accounts.find(a => a.id === activeAccountId)?.name || 'Account'}
                                </span>
                            </button>
                        </div>
                    )}

                    <div className="flex flex-col gap-2 w-full">
                        <NavBtn id="calc" icon={<Icons.Calculator />} label="CALC" />
                        <NavBtn id="journal" icon={<Icons.Journal />} label="ENTRY" />
                        <NavBtn id="trades" icon={<Icons.List />} label="TRADES" />
                        <NavBtn id="calendar" icon={<Icons.Calendar />} label="CALENDAR" />
                        <NavBtn id="perf" icon={<Icons.Chart />} label="DATA" />
                    </div>
                </div>
                <div className="w-full pb-4 mt-8 shrink-0 flex flex-col gap-4 items-center">
                    {/* SUPPORT BUTTON */}
                    <button onClick={() => window.open('https://chat.whatsapp.com/Dasf32dLxyQHny6eUADTHg', '_blank')} className="flex flex-col items-center gap-1 text-slate-500 hover:text-white transition" title="Support">
                        <Icons.Support />
                        <span className="text-[9px] font-bold tracking-wider">SUPPORT</span>
                    </button>

                    {/* LOGIN/LOGOUT BUTTON */}
                    {user ? (
                        <button onClick={logout} className="flex flex-col items-center gap-1 text-slate-500 hover:text-red-500 transition" title="Logout">
                            <div className="w-8 h-8 rounded-full bg-jtg-green text-black flex items-center justify-center font-bold text-xs">{user.email[0].toUpperCase()}</div>
                            <span className="text-[9px] font-bold tracking-wider">LOGOUT</span>
                        </button>
                    ) : (
                        <button onClick={login} className="flex flex-col items-center gap-1 text-slate-500 hover:text-white transition" title="Login to Sync">
                            {isLoggingIn ? <span className="animate-spin">...</span> : <Icons.Google />}
                            <span className="text-[9px] font-bold tracking-wider">{isLoggingIn ? '...' : 'LOGIN'}</span>
                        </button>
                    )}

                    <button onClick={() => window.open('https://johnadtradersgroup.vercel.app/#services', '_blank')} className="flex flex-col items-center gap-1 text-slate-500 w-full py-4 hover:text-white transition border-t border-jtg-blue/20 pt-6">
                        <Icons.Home /><span className="text-[10px] font-bold tracking-wider">HOME</span>
                    </button>
                </div>
            </div>

            {/* MOBILE HEADER */}
            <div className="md:hidden fixed top-0 w-full bg-jtg-dark/95 backdrop-blur z-30 border-b border-jtg-blue/30 p-4 flex justify-between items-center h-16">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8"><img src={LOGO_URL} className="w-full h-full object-contain" onError={(e) => e.target.style.display = 'none'} /></div>
                    <span className="text-sm font-bold text-white tracking-wide hidden sm:block">JTG <span className="text-jtg-green">JOURNAL</span></span>
                </div>

                {/* Mobile Account Switcher & Auth */}
                <div className="flex items-center gap-2">
                    {user && (
                        <button
                            onClick={() => setShowAccountManager(true)}
                            className="bg-jtg-green/10 border border-jtg-green/30 rounded-lg p-1.5 flex items-center gap-2 hover:bg-jtg-green/20 transition"
                        >
                            <span className="text-jtg-green scale-75"><Icons.User /></span>
                            <span className="text-[10px] font-bold text-white max-w-[80px] truncate">
                                {accounts.find(a => a.id === activeAccountId)?.name || 'Account'}
                            </span>
                        </button>
                    )}

                    {user ? (
                        <button onClick={logout} className="text-[10px] bg-red-500/20 text-red-500 px-2 py-1.5 rounded border border-red-500/50">LOGOUT</button>
                    ) : (
                        <button onClick={login} className="text-[10px] bg-jtg-green/20 text-jtg-green px-3 py-1.5 rounded border border-jtg-green/50">{isLoggingIn ? '...' : 'LOGIN'}</button>
                    )}

                    <button onClick={() => window.open('https://chat.whatsapp.com/Dasf32dLxyQHny6eUADTHg', '_blank')} className="p-2 text-slate-400 hover:text-white transition">
                        <Icons.Support />
                    </button>
                </div>
            </div>

            {/* MOBILE BOTTOM NAV */}
            <div className="md:hidden fixed bottom-0 w-full bg-jtg-dark border-t border-jtg-blue/30 z-30 flex justify-around pb-safe h-20 items-center">
                <button onClick={() => setPage('calc')} className={`p-2 flex flex-col items-center ${page === 'calc' ? 'text-jtg-green' : 'text-slate-500'}`}><Icons.Calculator /><span className="text-[9px] font-bold mt-1">Calc</span></button>
                <button onClick={() => setPage('journal')} className={`p-2 flex flex-col items-center ${page === 'journal' ? 'text-jtg-green' : 'text-slate-500'}`}><Icons.Journal /><span className="text-[9px] font-bold mt-1">Entry</span></button>
                <button onClick={() => setPage('trades')} className={`p-2 flex flex-col items-center ${page === 'trades' ? 'text-jtg-green' : 'text-slate-500'}`}><Icons.List /><span className="text-[9px] font-bold mt-1">Trades</span></button>
                <button onClick={() => setPage('calendar')} className={`p-2 flex flex-col items-center ${page === 'calendar' ? 'text-jtg-green' : 'text-slate-500'}`}><Icons.Calendar /><span className="text-[9px] font-bold mt-1">Cal</span></button>
                <button onClick={() => setPage('perf')} className={`p-2 flex flex-col items-center ${page === 'perf' ? 'text-jtg-green' : 'text-slate-500'}`}><Icons.Chart /><span className="text-[9px] font-bold mt-1">Data</span></button>
            </div>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 relative h-full w-full overflow-hidden">
                <div className="absolute inset-0 bg-jtg-dark w-full h-full overflow-hidden">
                    {/* Background Elements */}
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-jtg-blue/10 rounded-full blur-[120px] pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-jtg-green/5 rounded-full blur-[100px] pointer-events-none"></div>

                    {/* Scrollable Container */}
                    <div className="w-full h-full overflow-y-auto custom-scroll pt-20 pb-24 md:pt-0 md:pb-0">
                        {page === 'calc' && <Calculator globalBalance={globalBalance} />}
                        {page === 'journal' && <Journal addTrade={addTrade} />}
                        {page === 'trades' && <TradeList trades={trades} deleteTrade={deleteTrade} />}
                        {page === 'calendar' && <CalendarView trades={trades} />}
                        {page === 'perf' && <Performance trades={trades} globalBalance={globalBalance} updateGlobalBalance={updateGlobalBalance} />}
                    </div>
                </div>
            </main>

            {/* MODALS */}
            {showAccountManager && (
                <AccountManager
                    accounts={accounts}
                    activeAccountId={activeAccountId}
                    switchAccount={switchAccount}
                    addAccount={addAccount}
                    deleteAccount={deleteAccount}
                    close={() => setShowAccountManager(false)}
                    isPremium={user?.email === 'nwabuezebosco@gmail.com'}
                />
            )}
        </div>
    );
};

export default App;
