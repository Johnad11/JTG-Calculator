import React, { useState } from 'react';
import { db } from '../firebase';
import { PAYSTACK_PUBLIC_KEY } from '../constants';

// Custom Elegant Check Icon
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

const PremiumUpgradeModal = ({ user, close, onSuccess }) => {
    const [submitting, setSubmitting] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState('monthly'); // 'trial', 'monthly', 'annual'

    const handleSubscribe = async () => {
        if (!user) {
            alert("You must be logged in to upgrade to Premium.");
            return;
        }

        setSubmitting(true);
        try {
            const now = new Date();
            let premiumUntil = new Date();
            let planName = "";
            let amountInKobo = 0;

            if (selectedPlan === 'trial') {
                planName = "14-Day Free Trial";
                
                // Cardless trial activation via secure backend function
                const idToken = await user.getIdToken();
                const res = await fetch('/api/activate-trial', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + idToken
                    }
                });

                const responseData = await res.json();
                if (!res.ok) {
                    throw new Error(responseData.error || 'Failed to activate trial.');
                }

                alert(`🎉 Success! Your 14-Day Free Trial has been activated. Your JTG Premium access is now fully unlocked until ${new Date(responseData.premiumUntil).toLocaleDateString()}.`);
                
                if (onSuccess) {
                    onSuccess({
                        isPremium: true,
                        premiumPlan: responseData.premiumPlan,
                        premiumUntil: responseData.premiumUntil
                    });
                }
                close();
                setSubmitting(false);
                return;
            } else if (selectedPlan === 'monthly') {
                premiumUntil.setMonth(now.getMonth() + 1); // 1 Month
                planName = "Monthly Plan (₦800)";
                amountInKobo = 80000; // 800 Naira
            } else if (selectedPlan === 'quarterly') {
                premiumUntil.setMonth(now.getMonth() + 3); // 3 Months (Quarterly)
                planName = "Quarterly Plan (₦2,100)";
                amountInKobo = 210000; // 2,100 Naira
            } else if (selectedPlan === 'annual') {
                premiumUntil.setFullYear(now.getFullYear() + 1); // 1 Year
                planName = "Annual Plan (₦8,000)";
                amountInKobo = 800000; // 8,000 Naira
            }

            // Launch Paystack Inline Checkout
            if (!window.PaystackPop) {
                throw new Error("Paystack checkout library is still loading. Please try again in a few seconds.");
            }

            // Define success helper to keep the Paystack callback parameter a standard, non-async function
            const handleSuccessfulPayment = async (response) => {
                try {
                    setSubmitting(true);
                    // Decoupled: direct firestore write removed to satisfy security rules.
                    // Webhook api/paystack-webhook.js handles firestore write.
                    alert(`🎉 Thank you! Your payment of ₦${amountInKobo / 100} was successful (Ref: ${response.reference}). Your JTG Premium access is now active!`);
                    
                    if (onSuccess) {
                        onSuccess({
                            isPremium: true,
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
                amount: amountInKobo,
                currency: 'NGN',
                ref: 'JTG_' + Math.floor((Math.random() * 1000000000) + 1),
                metadata: {
                    userId: user.uid,
                    planName: planName,
                    premiumUntil: premiumUntil.toISOString()
                },
                callback: function(response) {
                    handleSuccessfulPayment(response);
                },
                onClose: function() {
                    setSubmitting(false);
                    alert("Transaction cancelled by user.");
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
            <div className="bg-[#0b0f26]/95 border border-[#162C99]/50 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col relative animate-pop backdrop-blur-xl">
                
                {/* Close Button absolute top-right */}
                <button 
                    onClick={close} 
                    className="absolute top-4 right-4 text-slate-400 hover:text-white hover:bg-[#111633]/60 p-1.5 rounded-lg transition-all"
                    aria-label="Close"
                >
                    <CloseIcon className="w-5 h-5" />
                </button>

                {/* Main Hero Header */}
                <div className="bg-gradient-to-r from-[#1BA657]/15 to-[#162C99]/20 p-8 border-b border-[#162C99]/25 flex flex-col items-center text-center gap-2">
                    <div className="p-3 bg-[#1BA657]/20 rounded-full border border-[#1BA657]/40 text-[#1BA657] shadow-[0_0_20px_rgba(27,166,87,0.25)] animate-pulse">
                        <PremiumStarIcon className="w-8 h-8" />
                    </div>
                    <h2 className="text-white font-extrabold text-2xl tracking-wide mt-2">
                        UPGRADE TO JTG PREMIUM
                    </h2>
                    <p className="text-slate-300 text-sm max-w-lg leading-relaxed">
                        Unlock the absolute power of automated journaling. Get real-time MetaTrader 5 Auto-Sync, elevated account limits, and unlimited exports.
                    </p>
                </div>

                {/* Pricing Plans Wrapper */}
                <div className="p-6 md:p-8 flex flex-col gap-6 overflow-y-auto max-h-[60vh] custom-scroll">
                    
                    {/* Benefits Checklist Grid */}
                    <div className="bg-[#111633]/45 border border-[#162C99]/20 rounded-xl p-5 flex flex-col gap-4">
                        <h3 className="text-white text-xs font-bold uppercase tracking-wider text-slate-400">Included Premium Privileges:</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            <div className="flex items-start gap-2.5 text-slate-200 text-xs">
                                <CheckCircleIcon className="w-4 h-4 text-[#1BA657] shrink-0 mt-0.5" />
                                <span><strong>Real-time MT5 Auto-Sync</strong>: Push trade history from MT5 PC instantly to your web journal dashboard.</span>
                            </div>
                            <div className="flex items-start gap-2.5 text-slate-200 text-xs">
                                <CheckCircleIcon className="w-4 h-4 text-[#1BA657] shrink-0 mt-0.5" />
                                <span><strong>Full EA Dashboard Access</strong>: On-chart HUD displays stats, session metrics, risk calculator & equity curve.</span>
                            </div>
                            <div className="flex items-start gap-2.5 text-slate-200 text-xs">
                                <CheckCircleIcon className="w-4 h-4 text-[#1BA657] shrink-0 mt-0.5" />
                                <span><strong>Expanded Limits</strong>: Add up to 3 Personal and 5 Prop Firm accounts simultaneously.</span>
                            </div>
                            <div className="flex items-start gap-2.5 text-slate-200 text-xs">
                                <CheckCircleIcon className="w-4 h-4 text-[#1BA657] shrink-0 mt-0.5" />
                                <span><strong>Unlimited Exports</strong>: Export your entire trade journal dataset to CSV/Excel formats without restrictions.</span>
                            </div>
                        </div>
                    </div>

                    {/* Subscription Cards Selection */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        
                        {/* 14-Day Free Trial Card */}
                        <div 
                            onClick={() => setSelectedPlan('trial')}
                            className={`cursor-pointer rounded-2xl p-5 border transition-all duration-300 flex flex-col justify-between relative group ${
                                selectedPlan === 'trial' 
                                    ? 'bg-[#1BA657]/10 border-[#1BA657] shadow-[0_0_15px_rgba(27,166,87,0.1)]' 
                                    : 'bg-[#0f142b] border-[#162C99]/30 hover:border-[#162C99]/60 hover:bg-[#121835]'
                            }`}
                        >
                            {/* Selected Indicator Checkmark */}
                            <div className={`absolute top-3 right-3 rounded-full p-0.5 border ${
                                selectedPlan === 'trial' ? 'bg-[#1BA657] border-[#1BA657] text-black' : 'border-slate-700 text-transparent'
                            }`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Testing</span>
                                <h4 className="text-white font-bold text-base">Free Trial</h4>
                                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">Try all Premium tools absolutely free.</p>
                            </div>
                            <div className="mt-6 pt-3 border-t border-[#162C99]/25 flex items-baseline gap-1">
                                <span className="text-white font-extrabold text-2xl">14</span>
                                <span className="text-xs text-slate-400 font-medium">Days Free</span>
                            </div>
                        </div>

                        {/* Monthly subscription Card */}
                        <div 
                            onClick={() => setSelectedPlan('monthly')}
                            className={`cursor-pointer rounded-2xl p-5 border transition-all duration-300 flex flex-col justify-between relative group ${
                                selectedPlan === 'monthly' 
                                    ? 'bg-[#1BA657]/10 border-[#1BA657] shadow-[0_0_15px_rgba(27,166,87,0.1)]' 
                                    : 'bg-[#0f142b] border-[#162C99]/30 hover:border-[#162C99]/60 hover:bg-[#121835]'
                            }`}
                        >
                            {/* Selected Indicator Checkmark */}
                            <div className={`absolute top-3 right-3 rounded-full p-0.5 border ${
                                selectedPlan === 'monthly' ? 'bg-[#1BA657] border-[#1BA657] text-black' : 'border-slate-700 text-transparent'
                            }`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-[#1BA657] uppercase tracking-widest block mb-1">Standard</span>
                                <h4 className="text-white font-bold text-base">Monthly</h4>
                                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">Flexible monthly journaling automation.</p>
                            </div>
                            <div className="mt-6 pt-3 border-t border-[#162C99]/25 flex items-baseline gap-1">
                                <span className="text-white font-extrabold text-2xl">₦800</span>
                                <span className="text-xs text-slate-400 font-medium">/ month</span>
                            </div>
                        </div>

                        {/* Quarterly subscription Card */}
                        <div 
                            onClick={() => setSelectedPlan('quarterly')}
                            className={`cursor-pointer rounded-2xl p-5 border transition-all duration-300 flex flex-col justify-between relative group ${
                                selectedPlan === 'quarterly' 
                                    ? 'bg-[#1BA657]/10 border-[#1BA657] shadow-[0_0_15px_rgba(27,166,87,0.1)]' 
                                    : 'bg-[#0f142b] border-[#162C99]/30 hover:border-[#162C99]/60 hover:bg-[#121835]'
                            }`}
                        >
                            {/* Selected Indicator Checkmark */}
                            <div className={`absolute top-3 right-3 rounded-full p-0.5 border ${
                                selectedPlan === 'quarterly' ? 'bg-[#1BA657] border-[#1BA657] text-black' : 'border-slate-700 text-transparent'
                            }`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-[#1BA657] uppercase tracking-widest block mb-1">Popular</span>
                                <h4 className="text-white font-bold text-base">Quarterly</h4>
                                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">Save 12.5% compared to monthly plan.</p>
                            </div>
                            <div className="mt-6 pt-3 border-t border-[#162C99]/25 flex items-baseline gap-1">
                                <span className="text-white font-extrabold text-2xl">₦2,100</span>
                                <span className="text-xs text-slate-400 font-medium">/ 3 mos</span>
                            </div>
                        </div>

                        {/* Annual subscription Card (Save 6%) */}
                        <div 
                            onClick={() => setSelectedPlan('annual')}
                            className={`cursor-pointer rounded-2xl p-5 border transition-all duration-300 flex flex-col justify-between relative group ${
                                selectedPlan === 'annual' 
                                    ? 'bg-[#1BA657]/10 border-[#1BA657] shadow-[0_0_15px_rgba(27,166,87,0.1)]' 
                                    : 'bg-[#0f142b] border-[#162C99]/30 hover:border-[#162C99]/60 hover:bg-[#121835]'
                            }`}
                        >
                            {/* Best Value Badge */}
                            <div className="absolute -top-2.5 left-5 bg-[#1BA657] text-black text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md animate-bounce">
                                Save 17%
                            </div>
                            {/* Selected Indicator Checkmark */}
                            <div className={`absolute top-3 right-3 rounded-full p-0.5 border ${
                                selectedPlan === 'annual' ? 'bg-[#1BA657] border-[#1BA657] text-black' : 'border-slate-700 text-transparent'
                            }`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-1">Commitment</span>
                                <h4 className="text-white font-bold text-base">Annual Plan</h4>
                                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">Full premium privileges all year round.</p>
                            </div>
                            <div className="mt-6 pt-3 border-t border-[#162C99]/25 flex items-baseline gap-1">
                                <span className="text-white font-extrabold text-2xl">₦8,000</span>
                                <span className="text-xs text-slate-400 font-medium">/ year</span>
                            </div>
                        </div>

                    </div>

                    {/* Bottom CTA Action Button */}
                    <div className="flex flex-col gap-2 mt-4">
                        <button
                            onClick={handleSubscribe}
                            disabled={submitting}
                            className="w-full py-4 bg-[#1BA657] hover:bg-[#158C47] active:scale-[0.99] disabled:opacity-50 text-black font-extrabold text-sm rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-[#1BA657]/10"
                        >
                            {submitting ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    ACTIVATING PLAN...
                                </span>
                            ) : selectedPlan === 'trial' ? (
                                'START 14-DAY FREE TRIAL'
                            ) : (
                                `ACTIVATE PREMIUM MEMBERSHIP`
                            )}
                        </button>
                        <p className="text-[10px] text-slate-500 text-center leading-relaxed max-w-md mx-auto">
                            By clicking above, you agree to activate JTG Journal Premium. This simulation updates Firestore immediately and grants access instantly. No real card charges occur.
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default PremiumUpgradeModal;
