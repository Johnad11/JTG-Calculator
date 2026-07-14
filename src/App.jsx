import React, { useState, useEffect } from 'react';
import firebase, { auth, db } from './firebase';
import { Icons } from './components/Icons';
import Calculator from './components/Calculator';
import Journal from './components/Journal';
import TradeList from './components/TradeList';
import CalendarView from './components/CalendarView';
import Performance from './components/Performance';
import AccountManager from './components/AccountManager';
import UsernameModal from './components/UsernameModal';
import Mt5IntegrationModal from './components/Mt5IntegrationModal';
import PremiumUpgradeModal from './components/PremiumUpgradeModal';
import SettingsModal from './components/SettingsModal';
import OnboardingTourPopup from './components/OnboardingTourPopup';
import { LOGO_URL, CURRENCIES, ASSETS, PREMIUM_EMAILS } from './constants';

import { fetchExchangeRates } from './utils/exchangeRate';
import { convertForDisplay, convertForStorage } from './utils/currencyConverter';
import { startAppTour } from './utils/AppTour';

const PremiumStarIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
);

const DEMO_TRADES = [
    {
        id: 'demo_1',
        pair: 'EURUSD',
        type: 'BUY',
        lot: 1.0,
        entry: 1.08500,
        exit: 1.09200,
        outcome: 'HIT TP',
        strategy: 'Trend Continuation',
        emotion: 'Neutral',
        setupQuality: 'A+',
        ruleAdherence: 'Yes',
        pnl: 700.00,
        pnlNative: 700.00,
        openDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        closeDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        notes: "Perfect entry at key support level. Target hit on session change."
    },
    {
        id: 'demo_2',
        pair: 'GBPUSD',
        type: 'SELL',
        lot: 1.5,
        entry: 1.27000,
        exit: 1.27400,
        outcome: 'HIT SL',
        strategy: 'Range Reversal',
        emotion: 'Anxious',
        setupQuality: 'B',
        ruleAdherence: 'Yes',
        pnl: -600.00,
        pnlNative: -600.00,
        openDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        closeDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        notes: "Entered early before full breakout confirmation. Stop loss hit."
    },
    {
        id: 'demo_3',
        pair: 'USDJPY',
        type: 'BUY',
        lot: 2.0,
        entry: 156.200,
        exit: 156.800,
        outcome: 'MANUAL WIN',
        strategy: 'Breakout',
        emotion: 'Confident',
        setupQuality: 'A',
        ruleAdherence: 'Yes',
        pnl: 770.00,
        pnlNative: 770.00,
        openDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        closeDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        notes: "Rode the JPY momentum after inflation data release."
    },
    {
        id: 'demo_4',
        pair: 'AUDUSD',
        type: 'SELL',
        lot: 1.0,
        entry: 0.66500,
        exit: 0.66200,
        outcome: 'MANUAL WIN',
        strategy: 'Trend Continuation',
        emotion: 'Neutral',
        setupQuality: 'A+',
        ruleAdherence: 'Yes',
        pnl: 300.00,
        pnlNative: 300.00,
        openDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        closeDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        notes: "Standard pull-back entry. Closed manually ahead of high impact news."
    },
    {
        id: 'demo_5',
        pair: 'EURUSD',
        type: 'SELL',
        lot: 1.0,
        entry: 1.08900,
        exit: 1.09050,
        outcome: 'HIT SL',
        strategy: 'Breakout',
        emotion: 'Greedy',
        setupQuality: 'C',
        ruleAdherence: 'No',
        pnl: -150.00,
        pnlNative: -150.00,
        openDate: new Date().toISOString(),
        closeDate: new Date().toISOString(),
        notes: "Chased the price at resistance. Violated standard risk parameters."
    }
];

const DEMO_WITHDRAWALS = [
    {
        id: 'demo_w1',
        amount: 200,
        displayAmount: 200,
        currency: 'USD',
        note: 'Demo Profit Withdrawal',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'WITHDRAWAL'
    }
];

const DEMO_DEPOSITS = [
    {
        id: 'demo_d1',
        amount: 500,
        displayAmount: 500,
        currency: 'USD',
        note: 'Demo Deposit',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'DEPOSIT'
    }
];

const App = () => {
    const [page, setPage] = useState('calc');
    const [user, setUser] = useState(null);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [showMobileDrawer, setShowMobileDrawer] = useState(false);

    // ACCOUNTS STATE
    const [accounts, setAccounts] = useState([]);
    const [activeAccountId, setActiveAccountId] = useState(null);
    const [showAccountManager, setShowAccountManager] = useState(false);
    const [username, setUsername] = useState('');
    const [showUsernameModal, setShowUsernameModal] = useState(false);
    const [showSyncModal, setShowSyncModal] = useState(false);
    const [exportCount, setExportCount] = useState(0);
    const [isPremium, setIsPremium] = useState(false);
    const [showPremiumUpgradeModal, setShowPremiumUpgradeModal] = useState(false);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showTourPrompt, setShowTourPrompt] = useState(false);
    const [remindersEnabled, setRemindersEnabled] = useState(() => {
        try {
            return localStorage.getItem('jtg_reminders_enabled') === 'true';
        } catch (e) { return false; }
    });
    const [reminderTime, setReminderTime] = useState(() => {
        try {
            return localStorage.getItem('jtg_reminder_time') || '20:00';
        } catch (e) { return '20:00'; }
    });


    // CURRENCY STATE (Derived from active account)
    const activeAccount = accounts.find(a => a.id === activeAccountId);
    const currency = activeAccount?.currency || 'USD';
    const currencySymbol = CURRENCIES[currency]?.symbol || '$';

    // EXCHANGE RATE STATE
    const [exchangeRates, setExchangeRates] = useState(null);
    const [ratesLoading, setRatesLoading] = useState(true);
    const [ratesError, setRatesError] = useState(null);

    // GLOBAL ACCOUNT BALANCE SETTING
    const [globalBalance, setGlobalBalance] = useState(() => localStorage.getItem('jtg_global_balance') || '');

    // WITHDRAWALS STATE
    const [withdrawals, setWithdrawals] = useState([]);

    // DEPOSITS STATE
    const [deposits, setDeposits] = useState([]);

    // TRADES STATE
    const [trades, setTrades] = useState(() => {
        try {
            const saved = localStorage.getItem('jtg_journal');
            return saved ? JSON.parse(saved) : [];
        } catch (e) { return []; }
    });

    const [isDemoMode, setIsDemoMode] = useState(false);
    const displayTrades = isDemoMode ? DEMO_TRADES : trades;
    const displayWithdrawals = isDemoMode ? DEMO_WITHDRAWALS : withdrawals;
    const displayDeposits = isDemoMode ? DEMO_DEPOSITS : deposits;

    // Update Balance Handler
    const updateGlobalBalance = async (newBal) => {
        // Store balance in account's native currency
        const balanceInNative = newBal;

        setGlobalBalance(balanceInNative);
        localStorage.setItem('jtg_global_balance', balanceInNative);

        if (user && activeAccountId) {
            // Update the specific account with native value
            try {
                await db.collection('accounts').doc(activeAccountId).update({ balance: balanceInNative });
                setAccounts(accounts.map(a => a.id === activeAccountId ? { ...a, balance: balanceInNative } : a));
            } catch (e) { console.error("Error updating balance:", e); }
        }
    };

    // Removed updateCurrency global handler. Currency is now account-specific.

    const loadExchangeRates = async () => {
        try {
            setRatesLoading(true);
            setRatesError(null);
            
            const today = new Date().toISOString().split('T')[0];
            let rates = null;

            if (user) {
                // Try Firestore first for global consistency
                const rateDoc = await db.collection('global_data').doc('daily_rates').get();
                if (rateDoc.exists && rateDoc.data().date === today) {
                    rates = rateDoc.data().rates;
                    console.log('Using Firestore daily rates:', today);
                }
            }

            if (!rates) {
                rates = await fetchExchangeRates();
                // If we fetched fresh rates and are logged in, save to Firestore for others
                if (user && rates) {
                    await db.collection('global_data').doc('daily_rates').set({
                        date: today,
                        rates: rates,
                        updatedAt: new Date().toISOString()
                    }, { merge: true });
                }
            }

            setExchangeRates(rates);
        } catch (error) {
            setRatesError('Failed to load exchange rates');
            console.error('Error loading exchange rates:', error);
        } finally {
            setRatesLoading(false);
        }
    };

    // LOAD EXCHANGE RATES ON MOUNT
    useEffect(() => {
        loadExchangeRates();
    }, []);

    // AUTH & DATA LOADING
    useEffect(() => {
        let unsubscribeSettings = null;
        if (auth) {
            const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
                if (unsubscribeSettings) {
                    unsubscribeSettings();
                    unsubscribeSettings = null;
                }

                setUser(currentUser);
                setIsAuthLoading(false); // Resolve loading screen immediately!

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

                        // 2. Setup Real-time listener for User Settings
                        const settingsRef = db.collection('user_settings').doc(currentUser.uid);
                        
                        // Fix username flashing: Fetch once initially to set modal state and confirm loaded settings
                        const initialDoc = await settingsRef.get();
                        let initialUsername = '';
                        let tourCompleted = false;

                        if (initialDoc.exists) {
                            const data = initialDoc.data();
                            initialUsername = data.username || '';
                            tourCompleted = data.hasCompletedTour === true;
                            if (initialUsername) {
                                setUsername(initialUsername);
                                setShowUsernameModal(false);
                                if (!tourCompleted) {
                                    setShowTourPrompt(true);
                                }
                            } else {
                                setShowUsernameModal(true);
                            }
                        } else {
                            await settingsRef.set({ exportCount: 0 }, { merge: true });
                            setShowUsernameModal(true);
                        }

                        unsubscribeSettings = settingsRef.onSnapshot((docSnap) => {
                            if (docSnap.exists) {
                                const data = docSnap.data();
                                setExportCount(data.exportCount || 0);

                                if (data.remindersEnabled !== undefined) {
                                    setRemindersEnabled(data.remindersEnabled);
                                    localStorage.setItem('jtg_reminders_enabled', data.remindersEnabled);
                                }
                                if (data.reminderTime) {
                                    setReminderTime(data.reminderTime);
                                    localStorage.setItem('jtg_reminder_time', data.reminderTime);
                                }

                                // Check Premium Status
                                const isEmailPremium = PREMIUM_EMAILS.includes(currentUser.email);
                                const hasActivePremiumSetting = data.isPremium === true;
                                let isSubscriptionValid = false;

                                if (hasActivePremiumSetting) {
                                    if (data.premiumUntil) {
                                        const premiumUntilDate = new Date(data.premiumUntil);
                                        isSubscriptionValid = premiumUntilDate > new Date();
                                    } else {
                                        isSubscriptionValid = true; // Fallback if no date is stored
                                    }
                                }

                                const userIsPremium = isEmailPremium || isSubscriptionValid;
                                setIsPremium(userIsPremium);

                                if (data.username) {
                                    setUsername(data.username);
                                    setShowUsernameModal(false);
                                }
                            }
                        });

                    } catch (e) {
                        console.error("Error loading user data:", e);
                    }
                } else {
                    setAccounts([]);
                    setActiveAccountId(null);
                    setTrades([]);
                    setExportCount(0);
                    setIsPremium(false);
                }
            });
            return () => {
                unsubscribe();
                if (unsubscribeSettings) {
                    unsubscribeSettings();
                }
            };
        } else {
            setIsAuthLoading(false);
        }
    }, []);

    // LOAD TRADES WHEN ACTIVE ACCOUNT CHANGES
    useEffect(() => {
        if (user && activeAccountId) {
            const loadTrades = async () => {
                try {
                    // Load Trades
                    const q = db.collection('trades')
                        .where('userId', '==', user.uid)
                        .where('accountId', '==', activeAccountId); // Filter by Account

                    const snapshot = await q.get();
                    const cloudTrades = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                    // Sort by closing date (lowest to highest)
                    const sortedTrades = cloudTrades.sort((a, b) => {
                        const dateA = new Date(a.closeDate || a.openDate || 0);
                        const dateB = new Date(b.closeDate || b.openDate || 0);
                        return dateA - dateB;
                    });
                    setTrades(sortedTrades);

                    // Load Withdrawals (for Performance)
                    const wQ = db.collection('withdrawals')
                        .where('userId', '==', user.uid)
                        .where('accountId', '==', activeAccountId);

                    const wSnap = await wQ.get();
                    const cloudWithdrawals = wSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                    setWithdrawals(cloudWithdrawals);

                    // Load Deposits (for Performance)
                    const dQ = db.collection('deposits')
                        .where('userId', '==', user.uid)
                        .where('accountId', '==', activeAccountId);

                    const dSnap = await dQ.get();
                    const cloudDeposits = dSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                    setDeposits(cloudDeposits);

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

    // SAVE REMINDER SETTINGS & SCHEDULE NOTIFICATION
    useEffect(() => {
        localStorage.setItem('jtg_reminders_enabled', remindersEnabled);
        localStorage.setItem('jtg_reminder_time', reminderTime);

        if (user) {
            db.collection('user_settings').doc(user.uid).set({
                remindersEnabled,
                reminderTime
            }, { merge: true }).catch(err => {
                console.error("Error syncing reminder settings to Firestore:", err);
            });
        }

        // Schedule next notification trigger if reminders are enabled and permissions are granted
        if (remindersEnabled && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            const [hours, minutes] = reminderTime.split(':').map(Number);
            const now = new Date();
            const target = new Date();
            target.setHours(hours, minutes, 0, 0);

            // If target time has passed today, schedule for tomorrow
            if (target.getTime() <= now.getTime()) {
                target.setDate(target.getDate() + 1);
            }

            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'SCHEDULE_LOCAL_NOTIFICATION',
                    timestamp: target.getTime(),
                    title: 'Log Your Trades!',
                    body: 'Keep your journaling streak active. Log your trades in your JTG Journal today!'
                });
            }
        }
    }, [remindersEnabled, reminderTime, user]);

    // DYNAMIC SEO TITLE & META DESCRIPTION UPDATE
    useEffect(() => {
        let title = "JTG FX Journal - Stop Gambling. Start Journaling.";
        let desc = "The ultimate position calculator and analytical trade journal for disciplined traders. Elevate your performance, manage risk, and pass challenges.";

        if (!user) {
            title = "JTG FX Journal - Stop Gambling. Start Journaling.";
        } else {
            switch (page) {
                case 'calc':
                    title = "Position Size Calculator | JTG FX Journal";
                    desc = "Calculate precise lot sizes, risk in account currency, and reward-to-risk ratios dynamically for Forex, Indices, and Commodities.";
                    break;
                case 'journal':
                    title = "Log New Trade | JTG FX Journal";
                    desc = "Log details of your trade, including entry/exit prices, emotional state, setup quality, and rule adherence for analytical tracking.";
                    break;
                case 'trades':
                    title = "Trade History Log | JTG FX Journal";
                    desc = "Review, filter, search, and export your entire logged trade history with detailed performance notes and PnL metrics.";
                    break;
                case 'calendar':
                    title = "Trading Calendar & Daily PnL | JTG FX Journal";
                    desc = "Visualize your daily trade distributions, win rates, and daily profit/loss figures on an interactive calendar.";
                    break;
                case 'perf':
                    title = "Performance Analytics & Data | JTG FX Journal";
                    desc = "Analyze detailed metrics, Sharpe ratio, win ratios, drawdown stats, and equity curves to scale your trading business.";
                    break;
                default:
                    title = "JTG FX Journal - Stop Gambling. Start Journaling.";
            }
        }

        document.title = title;

        // Dynamically update meta description for search engines & browser state
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
            metaDescription = document.createElement('meta');
            metaDescription.name = "description";
            document.head.appendChild(metaDescription);
        }
        metaDescription.setAttribute('content', desc);
        
        // Dynamically update Open Graph title & desc
        let ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) ogTitle.setAttribute('content', title);
        let ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc) ogDesc.setAttribute('content', desc);
    }, [page, user]);

    const addAccount = async (accountData) => {
        if (!user) {
            console.error("addAccount called but no user is logged in");
            alert("You must be logged in to add an account.");
            return false;
        }

        const personalAccounts = accounts.filter(a => a.type === 'Personal');
        const propAccounts = accounts.filter(a => a.type === 'Prop Firm');

        const MAX_PERSONAL = isPremium ? 3 : 2;
        const MAX_PROP = isPremium ? 5 : 3;

        if (accountData.type === 'Personal' && personalAccounts.length >= MAX_PERSONAL) {
            if (!isPremium) {
                if (window.confirm(`Limit reached: Free accounts are limited to ${MAX_PERSONAL} Personal accounts.\n\nUpgrade to JTG Premium to add up to 3 Personal and 5 Prop Firm accounts?`)) {
                    setShowPremiumUpgradeModal(true);
                }
            } else {
                alert(`Limit reached: Premium accounts are limited to ${MAX_PERSONAL} Personal accounts.`);
            }
            return false;
        }
        if (accountData.type === 'Prop Firm' && propAccounts.length >= MAX_PROP) {
            if (!isPremium) {
                if (window.confirm(`Limit reached: Free accounts are limited to ${MAX_PROP} Prop Firm accounts.\n\nUpgrade to JTG Premium to add up to 3 Personal and 5 Prop Firm accounts?`)) {
                    setShowPremiumUpgradeModal(true);
                }
            } else {
                alert(`Limit reached: Premium accounts are limited to ${MAX_PROP} Prop Firm accounts.`);
            }
            return false;
        }

        try {
            console.log("Adding account to Firebase...", accountData);
            const initialBalance = accountData.balance; // Store initial balance
            const newAcc = {
                ...accountData,
                initialBalance, // Add initialBalance field
                userId: user.uid,
                createdAt: new Date().toISOString()
            };
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

    const withdrawFunds = async (accountId, amount, note, date) => {
        if (!user) return false;
        const account = accounts.find(a => a.id === accountId);
        if (!account) return false;

        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            alert("Invalid amount");
            return false;
        }

        const currentBal = parseFloat(account.balance);
        if (currentBal < amountNum) {
            // Optional: Prevent overdraft? For journals, maybe just warn or allow negative?
            // Usually journals allow negative if user missed a trade entry.
            // But let's allow it with a warning or just allow it.
        }

        // 1. Update Account Balance (Subtractions are now in native currency)
        const newBalance = (parseFloat(account.balance) - amountNum).toString();

        try {
            // Update Account
            await db.collection('accounts').doc(accountId).update({ balance: newBalance });

            // 2. Log Withdrawal
            const withdrawal = {
                userId: user.uid,
                accountId,
                amount: amountNum, // Store native amount
                displayAmount: amountNum,
                currency: currency,
                note,
                date: date || new Date().toISOString(),
                createdAt: new Date().toISOString(),
                type: 'WITHDRAWAL'
            };
            await db.collection('withdrawals').add(withdrawal);

            // 3. Update Local State
            const updatedAccounts = accounts.map(a => a.id === accountId ? { ...a, balance: newBalance } : a);
            setAccounts(updatedAccounts);
            if (activeAccountId === accountId) {
                setGlobalBalance(newBalance);
                setWithdrawals([{ ...withdrawal, id: 'temp-' + Date.now() }, ...withdrawals]);
            }
            return true;
        } catch (e) {
            console.error("Withdrawal Error:", e);
            alert("Error processing withdrawal: " + e.message);
            return false;
        }
    };

    const depositFunds = async (accountId, amount, note, date) => {
        if (!user) return false;
        const account = accounts.find(a => a.id === accountId);
        if (!account) return false;

        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            alert("Invalid amount");
            return false;
        }

        // 1. Update Account Balance (Additions are now in native currency)
        const newBalance = (parseFloat(account.balance) + amountNum).toString();

        try {
            // Update Account
            await db.collection('accounts').doc(accountId).update({ balance: newBalance });

            // 2. Log Deposit
            const deposit = {
                userId: user.uid,
                accountId,
                amount: amountNum, // Store native amount
                displayAmount: amountNum,
                currency: currency,
                note,
                date: date || new Date().toISOString(),
                createdAt: new Date().toISOString(),
                type: 'DEPOSIT'
            };
            await db.collection('deposits').add(deposit);

            // 3. Update Local State
            const updatedAccounts = accounts.map(a => a.id === accountId ? { ...a, balance: newBalance } : a);
            setAccounts(updatedAccounts);
            if (activeAccountId === accountId) {
                setGlobalBalance(newBalance);
                setDeposits([{ ...deposit, id: 'temp-' + Date.now() }, ...deposits]);
            }
            return true;
        } catch (e) {
            console.error("Deposit Error:", e);
            alert("Error processing deposit: " + e.message);
            return false;
        }
    };

    const updateAccount = async (accountId, updates) => {
        if (!user) return false;
        try {
            await db.collection('accounts').doc(accountId).update(updates);
            setAccounts(accounts.map(a => a.id === accountId ? { ...a, ...updates } : a));
            return true;
        } catch (e) {
            console.error("Error updating account:", e);
            alert("Error updating account: " + e.message);
            return false;
        }
    };

    const updateInitialBalance = async (newBalance) => {
        if (!activeAccountId) return;
        const bal = newBalance; // Store in native currency

        await updateAccount(activeAccountId, { initialBalance: bal.toString() });
    };

    const deleteAccount = async (id) => {
        console.log("App: deleteAccount called with ID:", id);
        if (!user) {
            console.log("App: deleteAccount aborting - no user");
            return;
        }
        if (accounts.length <= 1) {
            console.log("App: deleteAccount aborting - only one account left");
            alert("You must have at least one account.");
            return;
        }

        console.log("App: deleteAccount - prompting for confirmation");
        if (!window.confirm("Are you sure you want to delete this account? All associated trades will be permanently deleted.")) {
            console.log("App: deleteAccount - user cancelled confirmation");
            return;
        }
        console.log("App: deleteAccount - user confirmed deletion");

        try {
            // 1. Delete associated trades - only for this user and this account
            const tradesRef = db.collection('trades')
                .where('userId', '==', user.uid)
                .where('accountId', '==', id);

            const tradesSnap = await tradesRef.get();
            if (!tradesSnap.empty) {
                const batch = db.batch();
                tradesSnap.docs.forEach(doc => batch.delete(doc.ref));
                await batch.commit();
            }

            // 2. Delete account - ensure it belongs to the user
            const accountDoc = await db.collection('accounts').doc(id).get();
            if (accountDoc.exists && accountDoc.data().userId === user.uid) {
                await db.collection('accounts').doc(id).delete();
            } else {
                throw new Error("Account not found or not owned by you.");
            }

            // 3. Update local state
            const remainingAccounts = accounts.filter(a => a.id !== id);
            setAccounts(remainingAccounts);

            if (activeAccountId === id) {
                const nextAcc = remainingAccounts[0];
                setActiveAccountId(nextAcc.id);
                setGlobalBalance(nextAcc.balance);
            }
        } catch (e) {
            console.error("Deletion error details:", e);
            alert("Error deleting account: " + (e.code === 'permission-denied' ? "Missing permissions. Please ensure you are the owner." : e.message));
        }
    };

    const incrementExportCount = async () => {
        if (!user) return;
        const newCount = exportCount + 1;
        setExportCount(newCount);
        try {
            await db.collection('user_settings').doc(user.uid).set({ exportCount: newCount }, { merge: true });
        } catch (e) {
            console.error("Error updating export count:", e);
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
        // FIND CONTRACT SIZE FROM ASSETS
        if (formData.pair.includes('XAU')) contract = 100;
        else if (formData.pair.includes('XAG')) contract = 5000;
        else {
            const assetKey = Object.keys(ASSETS).find(key => ASSETS[key].pairs.includes(formData.pair));
            contract = ASSETS[assetKey]?.contract || 1;
        }

        let pnl = '0.00';
        if (x) {
            const diff = formData.type === 'BUY' ? (x - e) : (e - x);
            if (formData.pair.includes('JPY')) {
                const jpyRate = exchangeRates && exchangeRates['JPY'] ? exchangeRates['JPY'] : 155.0;
                pnl = (diff * formData.lot * (contract / jpyRate)).toFixed(2);
            } else pnl = (diff * formData.lot * contract).toFixed(2);
        }

        // PnL calculated above is already in USD (standardized market value)
        const pnlInUSD = pnl;
        
        // LOCK IN THE EXCHANGE RATE
        const currentRate = (exchangeRates ? exchangeRates[currency] : 1);
        const pnlNative = exchangeRates ? convertForDisplay(pnlInUSD, currency, exchangeRates) : pnlInUSD;

        const newTrade = { 
            ...formData, 
            id: Date.now(), 
            outcome, 
            pnl: pnlInUSD, 
            pnlNative: pnlNative,
            exchangeRate: currentRate,
            currency: currency,
            userId: user ? user.uid : 'guest', 
            accountId: activeAccountId 
        };

        if (user) {
            try {
                const docRef = await db.collection('trades').add(newTrade);
                const tradeWithId = { ...newTrade, id: docRef.id };
                const updatedTrades = [...trades, tradeWithId].sort((a, b) => {
                    const dateA = new Date(a.closeDate || a.openDate || 0);
                    const dateB = new Date(b.closeDate || b.openDate || 0);
                    return dateA - dateB;
                });
                setTrades(updatedTrades);

                // Update Account Balance with PnL (STABLE NATIVE BALANCE)
                if (activeAccountId) {
                    const currentBal = parseFloat(activeAccount.balance);
                    // Add the native PnL to the native balance to avoid drift
                    const newBal = (currentBal + parseFloat(pnlNative)).toString();

                    await db.collection('accounts').doc(activeAccountId).update({ balance: newBal });
                    setAccounts(accounts.map(a => a.id === activeAccountId ? { ...a, balance: newBal } : a));
                    setGlobalBalance(newBal); // Update global view (Note: globalBalance in state will now be in account's native currency)
                }

            } catch (e) {
                alert("Error saving to cloud: " + e.message);
            }
        } else {
            const updatedTrades = [...trades, newTrade].sort((a, b) => {
                const dateA = new Date(a.closeDate || a.openDate || 0);
                const dateB = new Date(b.closeDate || b.openDate || 0);
                return dateA - dateB;
            });
            setTrades(updatedTrades);
        }
    };

    const deleteTrade = async (id) => {
        if (!window.confirm("Are you sure you want to permanently delete this trade from your history log?")) {
            return;
        }
        if (user) {
            try {
                const tradeToDelete = trades.find(t => t.id === id);
                await db.collection('trades').doc(id.toString()).delete();
                setTrades(trades.filter(t => t.id !== id));

                // Revert Account Balance (Subtract PnL)
                if (tradeToDelete && tradeToDelete.accountId) {
                    const acc = accounts.find(a => a.id === tradeToDelete.accountId);
                    if (acc) {
                        const currentBal = parseFloat(acc.balance);
                        // Use native PnL if available, otherwise fallback to current rate conversion
                        const pnlVal = tradeToDelete.pnlNative ? parseFloat(tradeToDelete.pnlNative) : (exchangeRates ? convertForDisplay(tradeToDelete.pnl, acc.currency, exchangeRates) : parseFloat(tradeToDelete.pnl));
                        const newBal = (currentBal - pnlVal).toString();

                        await db.collection('accounts').doc(tradeToDelete.accountId).update({ balance: newBal });
                        setAccounts(accounts.map(a => a.id === tradeToDelete.accountId ? { ...a, balance: newBal } : a));
                        if (activeAccountId === tradeToDelete.accountId) setGlobalBalance(newBal);
                    }
                }
            } catch (e) {
                alert("Error deleting from cloud: " + e.message);
            }
        } else {
            setTrades(trades.filter(t => t.id !== id));
        }
    };

    const NavBtn = ({ id, icon, label }) => (
        <button id={`nav-${id}`} onClick={() => setPage(id)} className={`flex flex-col items-center gap-1 w-full py-4 transition-all duration-300 border-l-4 ${page === id ? 'border-jtg-green bg-jtg-blue/20 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            <span className={page === id ? 'text-jtg-green' : 'text-current'}>{icon}</span>
            <span className="text-[10px] font-bold tracking-wider">{label}</span>
        </button>
    );

    if (isAuthLoading) {
        return (
            <div className="flex flex-col items-center justify-center w-screen h-screen bg-[#0a0e1a]">
                <div className="relative w-20 h-20 flex items-center justify-center mb-6">
                    <div className="absolute inset-0 border-4 border-[#1BA657]/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-t-[#1BA657] rounded-full animate-spin"></div>
                    <img src={LOGO_URL} className="w-10 h-10 object-contain animate-pulse" />
                </div>
                <h2 className="text-lg font-bold text-white tracking-widest uppercase mb-1">JTG JOURNAL</h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Establishing secure connection...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="relative flex flex-col items-center justify-center w-screen h-screen bg-[#0a0e1a] overflow-hidden p-6">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#162C99]/15 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#1BA657]/10 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="relative z-10 w-full max-w-md bg-jtg-card border border-jtg-blue/30 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center animate-pop">
                    <button
                        onClick={() => window.open('https://www.johnadtradersgroup.name.ng/', '_blank')}
                        className="absolute top-6 left-6 text-slate-400 hover:text-white transition flex items-center gap-1.5 text-xs font-bold"
                    >
                        <Icons.ArrowLeft className="w-3.5 h-3.5" />
                        <span>Go Back</span>
                    </button>

                    <div className="w-20 h-20 mb-6 flex items-center justify-center bg-gradient-to-tr from-[#162C99] to-[#1BA657] p-3 rounded-2xl shadow-lg mt-4">
                        <img src={LOGO_URL} className="w-full h-full object-contain" />
                    </div>

                    <h1 className="text-2xl font-black text-white tracking-tight leading-none mb-1">JTG JOURNAL</h1>
                    <p className="text-[#1BA657] text-[10px] font-black uppercase tracking-[0.2em] mb-6">Stop Gambling. Start Journaling.</p>
                    
                    <p className="text-slate-400 text-sm leading-relaxed mb-8">
                        The ultimate position calculator and analytical trade journal for disciplined traders. Elevate your performance, manage your risk, and pass challenges consistently.
                    </p>

                    <button
                        onClick={login}
                        disabled={isLoggingIn}
                        className="w-full py-4 bg-gradient-to-r from-jtg-green to-emerald-500 text-black font-black text-sm tracking-widest rounded-xl transition-all shadow-xl hover:shadow-jtg-green/20 flex items-center justify-center gap-3 hover:scale-[1.02]"
                    >
                        {isLoggingIn ? (
                            <>
                                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                SECURING ACCESS...
                            </>
                        ) : (
                            <>
                                <Icons.Google />
                                SIGN IN WITH GOOGLE
                            </>
                        )}
                    </button>

                    <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mt-8">
                        Authorized Access Only • Secured by Firebase
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex w-full h-full bg-jtg-dark">
            {/* SIDEBAR */}
            <div className="hidden md:flex w-24 bg-jtg-dark border-r border-jtg-blue/30 flex-col items-center py-6 z-20 shadow-2xl shrink-0 h-full overflow-y-auto custom-scroll justify-between">
                <div className="w-full flex flex-col items-center">
                    
                    {/* BACK TO ECOSYSTEM LINK */}
                    <button 
                        onClick={() => window.open('https://www.johnadtradersgroup.name.ng/', '_blank')}
                        className="mb-4 text-slate-500 hover:text-white transition flex items-center gap-1 bg-jtg-blue/10 border border-jtg-blue/20 rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider hover:bg-jtg-blue/20 active:scale-95"
                        title="Back to Ecosystem"
                    >
                        <Icons.ArrowLeft className="w-2.5 h-2.5" />
                        <span>WEB</span>
                    </button>

                    <div className="w-12 h-12 mb-8 flex items-center justify-center mx-auto shrink-0 transition-transform hover:scale-105">
                        <img src={LOGO_URL} className="w-full h-full object-contain" onError={(e) => e.target.style.display = 'none'} />
                    </div>

                    {/* ACCOUNT SWITCHER */}
                    {user && (
                        <div className="mb-6 w-full px-4 flex flex-col gap-2">
                            <button
                                id="account-switcher-button"
                                onClick={() => setShowAccountManager(true)}
                                className="w-full bg-jtg-green/10 border border-jtg-green/30 rounded-lg p-2 flex flex-col items-center gap-1 hover:bg-jtg-green/20 transition group"
                            >
                                <div className="text-jtg-green"><Icons.User /></div>
                                <span id="active-account-name" className="text-[10px] font-bold text-white max-w-full truncate">
                                    {accounts.find(a => a.id === activeAccountId)?.name || 'Account'}
                                </span>
                            </button>
                            <button
                                id="mt5-sync-button"
                                onClick={() => setShowSyncModal(true)}
                                className="w-full bg-jtg-blue/10 border border-jtg-blue/30 rounded-lg p-2 flex flex-col items-center gap-1 hover:bg-jtg-blue/20 transition group"
                            >
                                <div className="text-jtg-green"><Icons.Key /></div>
                                <span className="text-[10px] font-bold text-white max-w-full truncate">
                                    MT5 Auto-Sync
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
                    
                    {/* SETTINGS BUTTON */}
                    <button 
                        id="settings-button" 
                        onClick={() => setShowSettingsModal(true)} 
                        className="flex flex-col items-center gap-1 text-slate-500 hover:text-white transition" 
                        title="Platform Settings"
                    >
                        <Icons.Settings className="w-5 h-5 text-jtg-green" />
                        <span className="text-[9px] font-bold tracking-wider">SETTINGS</span>
                    </button>

                    {/* USER PROFILE & LOGOUT */}
                    <div className="flex flex-col items-center gap-2 mb-2 pt-4 border-t border-jtg-blue/20 w-full">
                        {isPremium && (
                            <div className="bg-[#1BA657]/20 border border-[#1BA657]/50 rounded-full px-2 py-0.5 flex items-center gap-1 shadow-[0_0_10px_rgba(27,166,87,0.3)] animate-pulse mb-1">
                                <PremiumStarIcon className="w-2.5 h-2.5 text-[#1BA657]" />
                                <span className="text-[8px] font-extrabold text-[#1BA657] tracking-wider uppercase">PRO</span>
                            </div>
                        )}
                        <button onClick={logout} className="flex flex-col items-center gap-1 text-slate-500 hover:text-red-500 transition" title="Logout">
                            <div className="w-8 h-8 rounded-full bg-jtg-green text-black flex items-center justify-center font-bold text-xs relative">
                                {user.email[0].toUpperCase()}
                                {isPremium && <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center border border-jtg-dark font-extrabold" title="Premium Access">★</span>}
                            </div>
                            <span className="text-[9px] font-bold tracking-wider">LOGOUT</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* MOBILE HEADER */}
            <div className="md:hidden fixed top-0 w-full bg-jtg-dark/95 backdrop-blur z-30 border-b border-jtg-blue/30 p-4 flex justify-between items-center h-16">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => window.open('https://www.johnadtradersgroup.name.ng/', '_blank')}
                        className="text-slate-400 hover:text-white p-1 hover:bg-jtg-blue/10 rounded-lg transition active:scale-90"
                        title="Back to Ecosystem"
                        aria-label="Back to Ecosystem"
                    >
                        <Icons.ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6"><img src={LOGO_URL} className="w-full h-full object-contain" onError={(e) => e.target.style.display = 'none'} /></div>
                        <span className="text-sm font-bold text-white tracking-wide">JTG <span className="text-jtg-green">JOURNAL</span></span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {isDemoMode && (
                        <span className="text-[9px] bg-jtg-green/20 text-jtg-green px-2 py-0.5 rounded font-extrabold border border-jtg-green/30 animate-pulse uppercase tracking-wide">Demo</span>
                    )}
                    {isPremium && (
                        <span className="bg-[#1BA657]/20 border border-[#1BA657]/50 text-[#1BA657] text-[8px] font-extrabold px-1.5 py-0.5 rounded shadow-[0_0_5px_rgba(27,166,87,0.3)] tracking-wider">PRO</span>
                    )}
                    <button
                        onClick={() => setShowMobileDrawer(true)}
                        className="p-2 text-slate-300 hover:text-white transition-colors bg-jtg-blue/10 border border-jtg-blue/30 rounded-lg flex items-center justify-center active:scale-95"
                        aria-label="Open Menu"
                    >
                        <Icons.Menu />
                    </button>
                </div>
            </div>

            {/* MOBILE BOTTOM NAV */}
            <div className="md:hidden fixed bottom-0 w-full bg-jtg-dark border-t border-jtg-blue/30 z-30 flex justify-around pb-safe h-20 items-center">
                <button id="mobile-nav-calc" onClick={() => setPage('calc')} className={`p-2 flex flex-col items-center ${page === 'calc' ? 'text-jtg-green' : 'text-slate-500'}`}><Icons.Calculator /><span className="text-[9px] font-bold mt-1">Calc</span></button>
                <button id="mobile-nav-journal" onClick={() => setPage('journal')} className={`p-2 flex flex-col items-center ${page === 'journal' ? 'text-jtg-green' : 'text-slate-500'}`}><Icons.Journal /><span className="text-[9px] font-bold mt-1">Entry</span></button>
                <button id="mobile-nav-trades" onClick={() => setPage('trades')} className={`p-2 flex flex-col items-center ${page === 'trades' ? 'text-jtg-green' : 'text-slate-500'}`}><Icons.List /><span className="text-[9px] font-bold mt-1">Trades</span></button>
                <button id="mobile-nav-calendar" onClick={() => setPage('calendar')} className={`p-2 flex flex-col items-center ${page === 'calendar' ? 'text-jtg-green' : 'text-slate-500'}`}><Icons.Calendar /><span className="text-[9px] font-bold mt-1">Cal</span></button>
                <button id="mobile-nav-perf" onClick={() => setPage('perf')} className={`p-2 flex flex-col items-center ${page === 'perf' ? 'text-jtg-green' : 'text-slate-500'}`}><Icons.Chart /><span className="text-[9px] font-bold mt-1">Data</span></button>
            </div>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 relative h-full w-full overflow-hidden">
                <div className="absolute inset-0 bg-jtg-dark w-full h-full overflow-hidden">
                    {/* Background Elements */}
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-jtg-blue/10 rounded-full blur-[120px] pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-jtg-green/5 rounded-full blur-[100px] pointer-events-none"></div>

                    {/* Scrollable Container */}
                    <div className="w-full h-full overflow-hidden pt-20 pb-24 md:pt-0 md:pb-0">
                        {isDemoMode && (
                            <div className="bg-[#1BA657]/20 border-b border-[#1BA657]/30 py-3 px-4 text-center text-xs text-[#1BA657] font-bold tracking-wide animate-pulse flex items-center justify-center gap-2 z-10 relative">
                                <span>📢 DEMO MODE ACTIVE: Viewing sample Forex trade logs. Click "EXIT DEMO" at the top to clear.</span>
                            </div>
                        )}
                        {page === 'calc' && <Calculator globalBalance={isDemoMode ? '11020' : globalBalance} currencySymbol={currencySymbol} currency={currency} exchangeRates={exchangeRates} ratesLoading={ratesLoading} activeAccount={activeAccount} />}
                        {page === 'journal' && <Journal addTrade={addTrade} accountType={activeAccount?.type} />}
                        {page === 'trades' && (
                            <TradeList
                                trades={displayTrades}
                                deleteTrade={deleteTrade}
                                isPremium={isPremium}
                                triggerUpgrade={() => setShowPremiumUpgradeModal(true)}
                                exportCount={exportCount}
                                incrementExportCount={incrementExportCount}
                                currencySymbol={currencySymbol}
                                currency={currency}
                                exchangeRates={exchangeRates}
                                ratesLoading={ratesLoading}
                                activeAccount={activeAccount}
                                username={username}
                            />
                        )}

                        {page === 'calendar' && <CalendarView trades={displayTrades} currency={currency} currencySymbol={currencySymbol} exchangeRates={exchangeRates} />}
                        {page === 'perf' && <Performance trades={displayTrades} withdrawals={displayWithdrawals} deposits={displayDeposits} activeAccount={activeAccount} globalInitialBalance={isDemoMode ? '10000' : activeAccount?.initialBalance} globalBalance={isDemoMode ? '11020' : globalBalance} updateGlobalBalance={updateGlobalBalance} updateInitialBalance={updateInitialBalance} currencySymbol={currencySymbol} currency={currency} exchangeRates={exchangeRates} ratesLoading={ratesLoading} />}
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
                    isPremium={isPremium}
                    triggerUpgrade={() => setShowPremiumUpgradeModal(true)}
                    currencySymbol={currencySymbol}
                    currency={currency}
                    exchangeRates={exchangeRates}
                    withdrawFunds={withdrawFunds}
                    depositFunds={depositFunds}
                    withdrawals={displayWithdrawals}
                    deposits={displayDeposits}
                    updateAccount={updateAccount}
                    userId={user?.uid}
                />
            )}

            {showUsernameModal && user && (
                <UsernameModal
                    user={user}
                    onUsernameSet={(name) => {
                        setUsername(name);
                        setShowUsernameModal(false);
                        // Trigger onboarding tour popup modal for new users
                        setTimeout(() => setShowTourPrompt(true), 500);
                    }}
                />
            )}

            {showSyncModal && user && (
                <Mt5IntegrationModal
                    user={user}
                    isPremium={isPremium}
                    triggerUpgrade={() => setShowPremiumUpgradeModal(true)}
                    close={() => setShowSyncModal(false)}
                />
            )}

            {showPremiumUpgradeModal && user && (
                <PremiumUpgradeModal
                    user={user}
                    close={() => setShowPremiumUpgradeModal(false)}
                    onSuccess={(newSettings) => {
                        setIsPremium(newSettings.isPremium);
                    }}
                />
            )}



            {/* Unified Settings Modal */}
            {showSettingsModal && (
                <SettingsModal
                    user={user}
                    username={username}
                    setUsername={setUsername}
                    isPremium={isPremium}
                    close={() => setShowSettingsModal(false)}
                    logout={logout}
                    remindersEnabled={remindersEnabled}
                    setRemindersEnabled={setRemindersEnabled}
                    reminderTime={reminderTime}
                    setReminderTime={setReminderTime}
                    startTour={() => startAppTour()}
                />
            )}

            {/* Onboarding Tour Prompt */}
            {showTourPrompt && user && (
                <OnboardingTourPopup
                    user={user}
                    startTour={() => startAppTour()}
                    close={() => setShowTourPrompt(false)}
                />
            )}

            {/* MOBILE DRAWER */}
            {showMobileDrawer && (
                <div className="md:hidden fixed inset-0 z-50 flex justify-end">
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
                        onClick={() => setShowMobileDrawer(false)}
                    ></div>

                    {/* Drawer Content */}
                    <div className="relative w-80 max-w-[85vw] h-full bg-jtg-dark border-l border-jtg-blue/30 p-6 flex flex-col justify-between shadow-2xl overflow-y-auto custom-scroll animate-slide-in">
                        {/* Drawer Header */}
                        <div>
                            <div className="flex justify-between items-center mb-8 pb-4 border-b border-jtg-blue/20">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6"><img src={LOGO_URL} className="w-full h-full object-contain" onError={(e) => e.target.style.display = 'none'} /></div>
                                    <span className="text-sm font-bold text-white tracking-wide">JTG <span className="text-jtg-green">JOURNAL</span></span>
                                </div>
                                <button 
                                    onClick={() => setShowMobileDrawer(false)} 
                                    className="p-1 text-slate-400 hover:text-white transition"
                                >
                                    <Icons.X />
                                </button>
                            </div>

                            {/* User Profile Info */}
                            <div className="mb-8 p-4 bg-jtg-blue/10 border border-jtg-blue/20 rounded-xl flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-jtg-green text-black flex items-center justify-center font-bold text-sm shrink-0">
                                    {username ? username[0].toUpperCase() : (user ? user.email[0].toUpperCase() : 'G')}
                                </div>
                                <div className="overflow-hidden">
                                    {username && <p className="text-sm font-black text-jtg-green truncate">@{username}</p>}
                                    <p className="text-xs font-bold text-slate-300 truncate">{user ? user.email : ''}</p>
                                    <div className="flex gap-1.5 items-center mt-1.5">
                                        {isPremium ? (
                                            <span className="bg-[#1BA657]/20 border border-[#1BA657]/50 text-[#1BA657] text-[8px] font-extrabold px-1.5 py-0.5 rounded tracking-wider uppercase">PRO</span>
                                        ) : (
                                            <span className="bg-slate-800 text-slate-400 text-[8px] font-extrabold px-1.5 py-0.5 rounded tracking-wider uppercase">FREE</span>
                                        )}
                                        {isDemoMode && (
                                            <span className="bg-[#1BA657]/20 border border-[#1BA657]/50 text-[#1BA657] text-[8px] font-extrabold px-1.5 py-0.5 rounded tracking-wider uppercase">DEMO DATA</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Section: Account Switcher & Sync */}
                            <div className="space-y-3 mb-6">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Trading Accounts</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => {
                                            setShowMobileDrawer(false);
                                            setShowAccountManager(true);
                                        }}
                                        className="bg-jtg-green/10 border border-jtg-green/30 rounded-xl p-3 flex flex-col items-center gap-1.5 hover:bg-jtg-green/20 transition active:scale-95"
                                    >
                                        <span className="text-jtg-green"><Icons.User /></span>
                                        <span className="text-[10px] font-bold text-white max-w-full truncate">
                                            {accounts.find(a => a.id === activeAccountId)?.name || 'Accounts'}
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowMobileDrawer(false);
                                            setShowSyncModal(true);
                                        }}
                                        className="bg-jtg-blue/10 border border-jtg-blue/30 rounded-xl p-3 flex flex-col items-center gap-1.5 hover:bg-jtg-blue/20 transition active:scale-95"
                                    >
                                        <span className="text-jtg-green"><Icons.Key /></span>
                                        <span className="text-[10px] font-bold text-white max-w-full truncate">
                                            MT5 Sync
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Section: App Settings & Tools */}
                            <div className="space-y-2 mb-6">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Options & Utilities</p>
                                
                                {/* Settings Hub Button */}
                                <button 
                                    onClick={() => {
                                        setShowMobileDrawer(false);
                                        setShowSettingsModal(true);
                                    }} 
                                    className="w-full bg-jtg-input border border-jtg-blue/30 hover:border-jtg-blue/50 rounded-xl p-3.5 flex items-center justify-between transition group active:scale-[0.98]"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-jtg-green"><Icons.Settings /></span>
                                        <span className="text-xs font-bold text-white">Platform Settings</span>
                                    </div>
                                    <Icons.ChevronRight />
                                </button>

                                {/* Demo Mode Toggle */}
                                {(trades.length === 0 || isDemoMode) && (
                                    <button 
                                        onClick={() => {
                                            setIsDemoMode(!isDemoMode);
                                            setShowMobileDrawer(false);
                                        }} 
                                        className={`w-full border rounded-xl p-3.5 flex items-center justify-between transition active:scale-[0.98] ${isDemoMode ? 'bg-[#1BA657]/10 border-[#1BA657] text-[#1BA657]' : 'bg-jtg-blue/10 border-jtg-blue/30 text-slate-300'}`}
                                    >
                                        <span className="text-xs font-bold">{isDemoMode ? "Exit Demo Mode" : "View Demo Data"}</span>
                                        <span className="text-xs">⚡</span>
                                    </button>
                                )}

                                {/* Go Premium Upgrade Button */}
                                {!isPremium && (
                                    <button 
                                        onClick={() => {
                                            setShowMobileDrawer(false);
                                            setShowPremiumUpgradeModal(true);
                                        }} 
                                        className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-extrabold text-xs uppercase tracking-wider p-3 rounded-xl shadow-lg transition hover:brightness-110 active:scale-95 mt-4"
                                    >
                                        ★ Upgrade to Pro
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Drawer Footer */}
                        <div className="border-t border-jtg-blue/20 pt-4 flex flex-col gap-3">
                            <button 
                                onClick={() => {
                                    setShowMobileDrawer(false);
                                    logout();
                                }} 
                                className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-xl py-3 text-xs font-bold transition active:scale-95"
                            >
                                Logout Account
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>

    );
};

export default App;
