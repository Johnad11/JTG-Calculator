import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';

const InAppReminderBanner = ({ trades = [], setPage, remindersEnabled }) => {
    const [dismissed, setDismissed] = useState(false);
    const [hasJournaledToday, setHasJournaledToday] = useState(true);

    useEffect(() => {
        if (!trades) {
            setHasJournaledToday(false);
            return;
        }

        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const date = today.getDate();

        // Check if there is any trade logged today
        const journaled = trades.some(trade => {
            const tradeDateStr = trade.closeDate || trade.openDate;
            if (!tradeDateStr) return false;
            
            const d = new Date(tradeDateStr);
            return d.getFullYear() === year &&
                   d.getMonth() === month &&
                   d.getDate() === date;
        });

        setHasJournaledToday(journaled);
    }, [trades]);

    // Do not show if they have journaled today, or if they dismissed the banner, or if reminders are disabled
    if (hasJournaledToday || dismissed || !remindersEnabled) {
        return null;
    }

    return (
        <div className="fixed bottom-24 md:bottom-6 right-4 left-4 md:left-auto md:w-[360px] bg-jtg-dark/95 border border-jtg-green/40 rounded-xl p-4 shadow-[0_10px_30px_rgba(27,166,87,0.15)] backdrop-blur-md z-40 animate-fade-in-up flex gap-3">
            <div className="w-10 h-10 rounded-full bg-jtg-green/10 flex items-center justify-center text-jtg-green shrink-0 mt-0.5">
                <Icons.Clock className="w-5 h-5 animate-pulse" />
            </div>
            
            <div className="flex-1 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-jtg-green uppercase tracking-wider">Journaling Reminder</span>
                    <button 
                        onClick={() => setDismissed(true)} 
                        className="text-slate-500 hover:text-slate-300 transition-colors"
                        title="Dismiss"
                    >
                        <Icons.X className="w-3.5 h-3.5" />
                    </button>
                </div>
                
                <p className="text-[11px] text-slate-300 leading-relaxed">
                    You haven't logged any trades today. Keep your trading streak active and build your discipline by logging today's results!
                </p>
                
                <button
                    onClick={() => {
                        setPage('journal');
                        setDismissed(true);
                    }}
                    className="mt-1 bg-jtg-green hover:bg-emerald-600 text-black font-extrabold text-[10px] py-2 px-3 rounded-md transition-colors uppercase tracking-wider flex items-center justify-center gap-1.5 self-start shadow-md"
                >
                    <Icons.Journal className="w-3 h-3 text-black" /> Log Entry Now
                </button>
            </div>
        </div>
    );
};

export default InAppReminderBanner;
