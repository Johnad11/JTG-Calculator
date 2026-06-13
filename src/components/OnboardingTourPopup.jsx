import React, { useState } from 'react';
import { Icons } from './Icons';
import { db } from '../firebase';

const OnboardingTourPopup = ({ user, startTour, close }) => {
    const [saving, setSaving] = useState(false);

    const handleSkip = async () => {
        setSaving(true);
        try {
            await db.collection('user_settings').doc(user.uid).set({
                hasCompletedTour: true
            }, { merge: true });
            close();
        } catch (e) {
            console.error("Error setting tour as completed:", e);
            close(); // Close anyway on error to not block user
        }
    };

    const handleStart = async () => {
        setSaving(true);
        try {
            await db.collection('user_settings').doc(user.uid).set({
                hasCompletedTour: true
            }, { merge: true });
            close();
            // Start the tour with a short timeout to let the popup close smoothly
            setTimeout(() => {
                startTour();
            }, 300);
        } catch (e) {
            console.error("Error setting tour as completed:", e);
            close();
            setTimeout(() => {
                startTour();
            }, 300);
        }
    };

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/85 backdrop-blur-md p-6">
            <div className="bg-jtg-dark border-2 border-jtg-blue/30 p-8 rounded-3xl shadow-[0_0_50px_rgba(27,166,87,0.25)] max-w-md w-full animate-pop text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-jtg-green to-jtg-blue"></div>
                
                <div className="w-20 h-20 bg-gradient-to-tr from-jtg-blue to-jtg-green rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg rotate-3">
                    <Icons.Trophy className="w-10 h-10 text-white" />
                </div>

                <h2 className="text-2xl font-black text-white mb-3 tracking-tight">WELCOME TO JTG JOURNAL!</h2>
                
                <p className="text-slate-400 text-sm leading-relaxed mb-8">
                    Your trader identity is now secured. Would you like to take a quick 1-minute interactive tour of the platform features?
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleStart}
                        disabled={saving}
                        className="w-full py-4 bg-gradient-to-r from-jtg-green to-emerald-500 hover:from-emerald-500 hover:to-jtg-green text-black font-black text-sm tracking-widest rounded-xl transition-all shadow-xl hover:scale-[1.02] flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <Icons.Check className="w-5 h-5" />
                                START INTERACTIVE TOUR
                            </>
                        )}
                    </button>
                    
                    <button
                        onClick={handleSkip}
                        disabled={saving}
                        className="w-full py-3 bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                        Skip Tour & Start Journaling
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OnboardingTourPopup;
