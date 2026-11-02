import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { PAYSTACK_PUBLIC_KEY } from '../constants';
import { Icons } from './Icons';

// Custom Check Icon
const CheckCircleIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

// Custom Star Icon
const PremiumStarIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
);

// Custom Close Icon
const CloseIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" x2="6" y1="6" y2="18" />
        <line x1="6" x2="18" y1="6" y2="18" />
    </svg>
);

const PremiumUpgradeModal = ({ user, userSettings, close, onSuccess }) => {
    const [submitting, setSubmitting] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState('diamond'); // 'gold' | 'diamond' | 'trial'

    // Coupon system states
    const [couponInput, setCouponInput] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState('');
    const [couponSuccess, setCouponSuccess] = useState('');

    useEffect(() => {
        setAppliedCoupon(null);
        setCouponInput('');
        setCouponError('');
        setCouponSuccess('');
    }, [selectedPlan]);

    const handleApplyCoupon = (e) => {
        e.preventDefault();
        const code = couponInput.trim().toUpperCase();
        if (!code) return;

        setCouponError('');
        setCouponSuccess('');
        setAppliedCoupon(null);

        const coupon = userSettings?.coupons?.find(c => c.code === code);
        if (!coupon) {
            setCouponError('Invalid coupon code. Check Settings -> Referrals first.');
            return;
        }

        if (coupon.used) {
            setCouponError('This coupon has already been used.');
            return;
        }

        if (coupon.type === 'gold' && selectedPlan !== 'gold') {
            setCouponError('Gold Coupons apply only to the Gold Plan.');
            return;
        }

        setAppliedCoupon(coupon);
        setCouponSuccess(`Coupon applied! Discount: ₦${coupon.value}`);
    };

    const handleSubscribe = async () => {
        if (!user) {
            alert("You must be logged in to upgrade.");
            return;
        }

        setSubmitting(true);
        try {
            const now = new Date();
            let premiumUntil = new Date();
            let planName = "";
            let planTier = "gold";
            let amountInKobo = 0;

            if (selectedPlan === 'trial') {
                planName = "14-Day Free Trial";
                planTier = "gold";
                
                const idToken = await user.getIdToken();
                const res = await fetch('/api/activate-trial', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + idToken
                    }
                });

                if (!res.ok) {
                    let errMsg = 'Failed to activate trial.';
                    try {
                        const data = await res.json();
                        errMsg = data.error || errMsg;
                    } catch (e) {
                        errMsg = `Server error: ${res.status}`;
                    }
                    throw new Error(errMsg);
                }

                const responseData = await res.json();
                alert(`🎉 Success! Your 14-Day Free Trial is active until ${new Date(responseData.premiumUntil).toLocaleDateString()}.`);
                
                if (onSuccess) {
                    onSuccess({
                        isPremium: true,
                        planTier: 'gold',
                        premiumPlan: responseData.premiumPlan,
                        premiumUntil: responseData.premiumUntil
                    });
                }
                close();
                setSubmitting(false);
                return;
            } else if (selectedPlan === 'gold') {
                premiumUntil.setMonth(now.getMonth() + 1);
                planName = "Gold Plan (₦800/mo - PC MT5 Sync)";
                planTier = "gold";
                amountInKobo = 80000; // 800 Naira
            } else if (selectedPlan === 'diamond') {
                premiumUntil.setMonth(now.getMonth() + 1);
                planName = "Diamond Plan ($1.50 / ₦2,450/mo - 24/7 Cloud Sync)";
                planTier = "diamond";
                amountInKobo = 245000; // 2,450 Naira (~$1.50 USD)
            } else if (selectedPlan === 'diamond_annual') {
                premiumUntil.setFullYear(now.getFullYear() + 1);
                planName = "Diamond Annual Plan ($15 / ₦24,500/yr)";
                planTier = "diamond";
                amountInKobo = 2450000; // 24,500 Naira
            }

            let finalAmountInKobo = amountInKobo;
            if (appliedCoupon) {
                finalAmountInKobo = Math.max(0, amountInKobo - (appliedCoupon.value * 100));
            }

            if (finalAmountInKobo === 0) {
                const idToken = await user.getIdToken();
                const res = await fetch('/api/activate-coupon', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + idToken
                    },
                    body: JSON.stringify({ couponCode: appliedCoupon.code })
                });

                if (!res.ok) {
                    let errMsg = 'Failed to activate coupon.';
                    try {
                        const data = await res.json();
                        errMsg = data.error || errMsg;
                    } catch (e) {
                        errMsg = `Server error: ${res.status}`;
                    }
                    throw new Error(errMsg);
                }

                const responseData = await res.json();
                alert(`🎉 Success! Unlocked via Coupon until ${new Date(responseData.premiumUntil).toLocaleDateString()}.`);
                
                if (onSuccess) {
                    onSuccess({
                        isPremium: true,
                        planTier: planTier,
                        premiumPlan: responseData.premiumPlan,
                        premiumUntil: responseData.premiumUntil
                    });
                }
                close();
                setSubmitting(false);
                return;
            }

            if (!window.PaystackPop) {
                throw new Error("Paystack checkout is loading. Please try again in a few seconds.");
            }

            const handleSuccessfulPayment = async (response) => {
                try {
                    setSubmitting(true);
                    alert(`🎉 Thank you! Your payment of ₦${finalAmountInKobo / 100} was successful (Ref: ${response.reference}). Your ${planTier.toUpperCase()} Plan is now active!`);
                    
                    if (onSuccess) {
                        onSuccess({
                            isPremium: true,
                            planTier: planTier,
                            premiumPlan: planName,
                            premiumUntil: premiumUntil.toISOString()
                        });
                    }
                    close();
                } catch (dbErr) {
                    console.error("Error setting premium status:", dbErr);
                } finally {
                    setSubmitting(false);
                }
            };

            const handler = window.PaystackPop.setup({
                key: PAYSTACK_PUBLIC_KEY,
                email: user.email || 'customer@jtg-journal.app',
                amount: finalAmountInKobo,
                currency: 'NGN',
                ref: 'JTG_' + Math.floor((Math.random() * 1000000000) + 1),
                metadata: {
                    userId: user.uid,
                    planTier: planTier,
                    planName: planName + (appliedCoupon ? ` (Discounted via ${appliedCoupon.code})` : ''),
                    premiumUntil: premiumUntil.toISOString(),
                    couponCode: appliedCoupon ? appliedCoupon.code : null
                },
                callback: function(response) {
                    handleSuccessfulPayment(response);
                },
                onClose: function() {
                    setSubmitting(false);
                }
            });

            handler.openIframe();

        } catch (err) {
            console.error("Subscription Error:", err);
            alert("Failed to subscribe: " + err.message);
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-[#0b0f26]/95 border border-[#162C99]/50 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col relative animate-pop backdrop-blur-xl">
                
                <button 
                    onClick={close} 
                    className="absolute top-4 right-4 text-slate-400 hover:text-white hover:bg-[#111633]/60 p-1.5 rounded-lg transition-all"
                    aria-label="Close"
                >
                    <CloseIcon className="w-5 h-5" />
                </button>

                {/* Hero Header */}
                <div className="bg-gradient-to-r from-[#1BA657]/15 to-[#162C99]/20 p-6 border-b border-[#162C99]/25 flex flex-col items-center text-center gap-1.5">
                    <div className="p-2.5 bg-[#1BA657]/20 rounded-full border border-[#1BA657]/40 text-[#1BA657] shadow-[0_0_20px_rgba(27,166,87,0.25)] animate-pulse">
                        <PremiumStarIcon className="w-6 h-6" />
                    </div>
                    <h2 className="text-white font-extrabold text-xl tracking-wide mt-1 uppercase">
                        Choose Your Journaling Power Tier
                    </h2>
                    <p className="text-slate-300 text-xs max-w-md leading-relaxed">
                        Automate your trade logging. Choose between PC EA Desktop Sync or 24/7 Server-Side Cloud Sync.
                    </p>
                </div>

                {/* Pricing Plans Wrapper */}
                <div className="p-6 flex flex-col gap-6 overflow-y-auto max-h-[65vh] custom-scroll">
                    
                    {/* Active Subscription Banner for Admin or Subscribers */}
                    {((user?.email && user.email.toLowerCase() === 'nwabuezejohnad11@gmail.com') || userSettings?.planTier === 'diamond') && (
                        <div className="bg-cyan-500/15 border border-cyan-400/50 rounded-xl p-3.5 flex items-center justify-between text-cyan-300 text-xs font-bold shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                            <span className="flex items-center gap-2">
                                <Icons.Diamond className="w-4 h-4 text-cyan-400" /> 
                                <span>Active Subscription: <strong>Diamond Plan (Lifetime Admin)</strong></span>
                            </span>
                            <span className="bg-cyan-400/20 text-cyan-300 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-extrabold border border-cyan-400/40">
                                ACTIVE ✓
                            </span>
                        </div>
                    )}
                    
                    {/* Subscription Cards Selection (Gold vs Diamond) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Gold Plan Card */}
                        <div 
                            onClick={() => setSelectedPlan('gold')}
                            className={`cursor-pointer rounded-2xl p-5 border transition-all duration-300 flex flex-col justify-between relative group ${
                                selectedPlan === 'gold' 
                                    ? 'bg-[#1BA657]/10 border-[#1BA657] shadow-[0_0_15px_rgba(27,166,87,0.15)]' 
                                    : 'bg-[#0f142b] border-[#162C99]/30 hover:border-[#162C99]/60'
                            }`}
                        >
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                        GOLD TIER
                                    </span>
                                    {selectedPlan === 'gold' && <span className="text-[#1BA657] font-bold text-xs">SELECTED ✓</span>}
                                </div>
                                
                                <h4 className="text-white font-extrabold text-lg">PC EA Auto-Sync</h4>
                                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                                    Ideal for traders running MT5 on PC. Syncs trades instantly when MT5 terminal is open.
                                </p>

                                <ul className="flex flex-col gap-2 mt-4 text-xs text-slate-300 border-t border-[#162C99]/20 pt-3">
                                    <li className="flex items-center gap-2">
                                        <CheckCircleIcon className="w-3.5 h-3.5 text-[#1BA657] shrink-0" />
                                        <span>Desktop MT5 EA Auto-Sync</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircleIcon className="w-3.5 h-3.5 text-[#1BA657] shrink-0" />
                                        <span>Up to 5 Total Trading Accounts</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircleIcon className="w-3.5 h-3.5 text-[#1BA657] shrink-0" />
                                        <span>Electric Green HUD Chart Overlay</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircleIcon className="w-3.5 h-3.5 text-[#1BA657] shrink-0" />
                                        <span>On-Chart Position Risk Calculator</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircleIcon className="w-3.5 h-3.5 text-[#1BA657] shrink-0" />
                                        <span>31-Day Performance Heatmaps</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="mt-6 pt-3 border-t border-[#162C99]/25 flex items-baseline justify-between">
                                <div>
                                    <span className="text-white font-extrabold text-2xl">₦800</span>
                                    <span className="text-xs text-slate-400 font-medium"> / month</span>
                                </div>
                                <span className="text-[10px] text-slate-500 font-mono">~$0.50/mo</span>
                            </div>
                        </div>

                        {/* Diamond Plan Card (POPULAR) */}
                        <div 
                            onClick={() => setSelectedPlan('diamond')}
                            className={`cursor-pointer rounded-2xl p-5 border transition-all duration-300 flex flex-col justify-between relative group ${
                                selectedPlan === 'diamond' 
                                    ? 'bg-gradient-to-b from-[#162C99]/40 to-[#1BA657]/15 border-[#1BA657] shadow-[0_0_25px_rgba(27,166,87,0.25)] ring-2 ring-[#1BA657]/40' 
                                    : 'bg-[#0f142b] border-[#162C99]/40 hover:border-[#1BA657]/50'
                            }`}
                        >
                            <span className="absolute -top-3 right-4 bg-gradient-to-r from-[#1BA657] to-emerald-400 text-black font-extrabold text-[9px] px-3 py-1 rounded-full uppercase tracking-widest shadow-md flex items-center gap-1">
                                <Icons.Star className="w-3 h-3" />
                                <span>MOST POPULAR</span>
                            </span>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                        DIAMOND TIER
                                    </span>
                                    {selectedPlan === 'diamond' && <span className="text-[#1BA657] font-bold text-xs">SELECTED ✓</span>}
                                </div>
                                
                                <h4 className="text-white font-extrabold text-lg flex items-center gap-2">
                                    <span>24/7 Cloud Sync</span>
                                    <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-1.5 py-0.5 rounded font-mono">NO PC NEEDED</span>
                                </h4>
                                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                                    Connect via Read-Only Investor Key. Trades sync 24/7 in the cloud even when your phone & PC are turned off!
                                </p>

                                <ul className="flex flex-col gap-2 mt-4 text-xs text-slate-200 border-t border-[#162C99]/20 pt-3">
                                    <li className="flex items-center gap-2 font-bold text-white">
                                        <CheckCircleIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                        <span>24/7 Server-Side Cloud Sync (MetaApi)</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircleIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                        <span>Multi-Account Sync (Up to 3 Accounts)</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircleIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                        <span>Includes all Gold Desktop EA Features</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircleIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                        <span>Priority Cloud Server & Drawdown Alerts</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="mt-6 pt-3 border-t border-[#162C99]/25 flex items-baseline justify-between">
                                <div>
                                    <span className="text-white font-extrabold text-2xl">₦2,450</span>
                                    <span className="text-xs text-slate-400 font-medium"> / month</span>
                                </div>
                                <span className="text-[10px] text-cyan-400 font-bold font-mono">~$1.50 / mo</span>
                            </div>
                        </div>

                    </div>

                    {/* Free Trial Button */}
                    <div className="flex items-center justify-between bg-[#0a0e29] border border-[#162C99]/30 rounded-xl p-3.5">
                        <div className="flex flex-col">
                            <span className="text-white font-bold text-xs">Want to test first?</span>
                            <span className="text-[10px] text-slate-400">Activate a 14-day free trial with full Gold tier access.</span>
                        </div>
                        <button
                            onClick={() => { setSelectedPlan('trial'); handleSubscribe(); }}
                            className="px-4 py-2 bg-[#111633] hover:bg-[#162C99]/40 border border-[#162C99]/50 text-slate-200 text-xs font-bold rounded-lg transition"
                        >
                            Start 14-Day Free Trial
                        </button>
                    </div>

                    {/* Coupon Input */}
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                        <input 
                            type="text"
                            placeholder="Enter Coupon Code (e.g. GOLD-100OFF)"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value)}
                            className="flex-1 bg-[#0a0e29] border border-[#162C99]/40 rounded-xl px-3 py-2 text-xs text-white uppercase placeholder-slate-500 focus:outline-none focus:border-[#1BA657]"
                        />
                        <button 
                            type="submit"
                            className="px-4 py-2 bg-[#162C99] hover:bg-[#1BA657] hover:text-black text-white text-xs font-bold rounded-xl transition"
                        >
                            Apply Code
                        </button>
                    </form>
                    {couponError && <p className="text-red-400 text-xs">{couponError}</p>}
                    {couponSuccess && <p className="text-[#1BA657] text-xs font-bold">{couponSuccess}</p>}

                    {/* Checkout Button */}
                    <button
                        onClick={handleSubscribe}
                        disabled={submitting}
                        className="w-full py-4 bg-gradient-to-r from-[#1BA657] to-emerald-400 hover:from-[#158C47] hover:to-emerald-500 text-black font-extrabold text-sm tracking-wider rounded-xl transition-all duration-200 shadow-xl shadow-[#1BA657]/10 flex items-center justify-center gap-2 uppercase disabled:opacity-50"
                    >
                        {submitting ? 'Processing Payment...' : `Subscribe to ${selectedPlan.toUpperCase()} Plan`}
                    </button>

                </div>
            </div>
        </div>
    );
};

export default PremiumUpgradeModal;
