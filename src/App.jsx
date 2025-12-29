import React, { useState, useEffect } from 'react';
import firebase, { auth, db } from './firebase';
import { Icons } from './components/Icons';
import Calculator from './components/Calculator';
import Journal from './components/Journal';
import TradeList from './components/TradeList';
import CalendarView from './components/CalendarView';
import Performance from './components/Performance';
import { LOGO_URL } from './constants';

const App = () => {
    const [page, setPage] = useState('calc');
    const [user, setUser] = useState(null);
    const [isLoggingIn, setIsLoggingIn] = useState(false);

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
    const updateGlobalBalance = (newBal) => {
        setGlobalBalance(newBal);
        localStorage.setItem('jtg_global_balance', newBal);
        // Also update in cloud if logged in
        if (user) {
            db.collection('user_settings').doc(user.uid).set({ balance: newBal }, { merge: true });
        }
    };

    // AUTH STATE LISTENER
    useEffect(() => {
        if (auth) {
            const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
                setUser(currentUser);
                if (currentUser) {
                    try {
                        // 1. Load Trades
                        const q = db.collection('trades').where('userId', '==', currentUser.uid);
                        const snapshot = await q.get();
                        const cloudTrades = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        if (cloudTrades.length > 0) setTrades(cloudTrades);

                        // 2. Load Balance
                        const doc = await db.collection('user_settings').doc(currentUser.uid).get();
                        if (doc.exists && doc.data().balance) {
                            setGlobalBalance(doc.data().balance);
                        }
                    } catch (e) { console.error("Error fetching user data:", e); }
                }
            });
            return () => unsubscribe();
        }
    }, []);

    // SAVE EFFECT
    useEffect(() => {
        if (!user) {
            localStorage.setItem('jtg_journal', JSON.stringify(trades));
        }
    }, [trades, user]);

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

        const newTrade = { ...formData, id: Date.now(), outcome, pnl, userId: user ? user.uid : 'guest' };

        if (user) {
            try { await db.collection('trades').add(newTrade); setTrades([newTrade, ...trades]); } catch (e) { alert("Error saving to cloud: " + e.message); }
        } else {
            setTrades([newTrade, ...trades]);
        }
    };

    const deleteTrade = async (id) => {
        if (user) {
            // In a real app, delete from Firestore here using doc ID
            setTrades(trades.filter(t => t.id !== id));
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
                    <div className="flex flex-col gap-2 w-full">
                        <NavBtn id="calc" icon={<Icons.Calculator />} label="CALC" />
                        <NavBtn id="journal" icon={<Icons.Journal />} label="ENTRY" />
                        <NavBtn id="trades" icon={<Icons.List />} label="TRADES" />
                        <NavBtn id="calendar" icon={<Icons.Calendar />} label="CALENDAR" />
                        <NavBtn id="perf" icon={<Icons.Chart />} label="DATA" />
                    </div>
                </div>
                <div className="w-full pb-4 mt-8 shrink-0 flex flex-col gap-4 items-center">
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

                    <button onClick={() => window.location.href = 'https://johnadtradersgroup.vercel.app/#services'} className="flex flex-col items-center gap-1 text-slate-500 w-full py-4 hover:text-white transition border-t border-jtg-blue/20 pt-6">
                        <Icons.Home /><span className="text-[10px] font-bold tracking-wider">HOME</span>
                    </button>
                </div>
            </div>

            {/* MOBILE HEADER */}
            <div className="md:hidden fixed top-0 w-full bg-jtg-dark/95 backdrop-blur z-30 border-b border-jtg-blue/30 p-4 flex justify-between items-center h-16">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10"><img src={LOGO_URL} className="w-full h-full object-contain" onError={(e) => e.target.style.display = 'none'} /></div>
                    <span className="text-lg font-bold text-white tracking-wide">JTG <span className="text-jtg-green">JOURNAL</span></span>
                </div>
                {user ? (
                    <button onClick={logout} className="text-xs bg-red-500/20 text-red-500 px-3 py-1 rounded border border-red-500/50">LOGOUT</button>
                ) : (
                    <button onClick={login} className="text-xs bg-jtg-green/20 text-jtg-green px-3 py-1 rounded border border-jtg-green/50">{isLoggingIn ? '...' : 'LOGIN'}</button>
                )}
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
        </div>
    );
};

export default App;
