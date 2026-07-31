import React, { useMemo } from 'react';

// BADGES DEFINITION
export const STREAK_BADGES = [
    { id: '7d', label: '7-Day Streak', days: 7, icon: '⚡', color: 'from-amber-500/20 to-yellow-500/20 text-amber-400 border-amber-500/40' },
    { id: '1m', label: '1-Month Streak', days: 30, icon: '🌟', color: 'from-emerald-500/20 to-green-500/20 text-emerald-400 border-emerald-500/40' },
    { id: '3m', label: '3-Month Streak', days: 90, icon: '🏆', color: 'from-blue-500/20 to-cyan-500/20 text-cyan-400 border-cyan-500/40' },
    { id: '6m', label: '6-Month Streak', days: 180, icon: '👑', color: 'from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/40' },
    { id: '12m', label: '12-Month Streak', days: 365, icon: '🔥', color: 'from-rose-500/20 to-orange-500/20 text-orange-400 border-orange-500/40' },
    { id: '1000d', label: '1000-Day Legend', days: 1000, icon: '🚀', color: 'from-cyan-400/30 to-emerald-400/30 text-white border-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.5)]' }
];

export const calculateStreak = (trades = []) => {
    if (!trades || trades.length === 0) return { currentStreak: 0, highestStreak: 0, activeDaysSet: new Set() };

    // Extract unique YYYY-MM-DD date strings
    const uniqueDates = Array.from(new Set(
        trades.map(t => {
            const raw = t.closeDate || t.openDate || t.date;
            if (!raw) return null;
            const d = new Date(raw);
            return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
        }).filter(Boolean)
    )).sort();

    if (uniqueDates.length === 0) return { currentStreak: 0, highestStreak: 0, activeDaysSet: new Set() };

    let currentStreak = 0;
    let highestStreak = 0;

    // Convert dates to ms timestamps for day difference checks
    const dateObjects = uniqueDates.map(dStr => new Date(dStr + 'T00:00:00Z').getTime());

    let tempStreak = 1;
    highestStreak = 1;

    for (let i = 1; i < dateObjects.length; i++) {
        const diffDays = Math.round((dateObjects[i] - dateObjects[i - 1]) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
            tempStreak++;
            if (tempStreak > highestStreak) highestStreak = tempStreak;
        } else if (diffDays > 1) {
            tempStreak = 1;
        }
    }

    // Check if the latest trade date is today or yesterday to calculate active current streak
    const todayStr = new Date().toISOString().split('T')[0];
    const todayMs = new Date(todayStr + 'T00:00:00Z').getTime();
    const lastTradeMs = dateObjects[dateObjects.length - 1];
    const daysSinceLast = Math.round((todayMs - lastTradeMs) / (1000 * 60 * 60 * 24));

    if (daysSinceLast <= 1) {
        currentStreak = tempStreak;
    } else {
        currentStreak = 0; // Streak broken if no trade logged yesterday or today
    }

    return { currentStreak, highestStreak, activeDaysCount: uniqueDates.length };
};

const StreakBadgeWidget = ({ trades = [], showDetails = false }) => {
    const { currentStreak, highestStreak, activeDaysCount } = useMemo(() => calculateStreak(trades), [trades]);

    const activeBadge = useMemo(() => {
        const streakToEvaluate = Math.max(currentStreak, highestStreak);
        return [...STREAK_BADGES].reverse().find(b => streakToEvaluate >= b.days) || STREAK_BADGES[0];
    }, [currentStreak, highestStreak]);

    if (!showDetails) {
        // Compact Badge for Header / Sidebar
        return (
            <div className={`px-2.5 py-1 rounded-full border bg-gradient-to-r ${activeBadge.color} flex items-center gap-1.5 shadow-sm text-xs font-black tracking-wide animate-pulse`} title={`Streak: ${currentStreak} Consecutive Active Days`}>
                <span>{activeBadge.icon}</span>
                <span>{currentStreak} DAY STREAK</span>
            </div>
        );
    }

    // Detailed Badge Showcase Grid
    return (
        <div className="bg-[#0e1329]/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-white font-extrabold text-sm uppercase tracking-wider flex items-center gap-2">
                        <span>🔥 Trading Streak Milestones</span>
                    </h3>
                    <p className="text-slate-400 text-xs mt-0.5">Log daily trades to unlock milestone badges and build consistency.</p>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-black text-amber-400 font-mono">{currentStreak}</span>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Active Days Streak</span>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {STREAK_BADGES.map(badge => {
                    const isUnlocked = currentStreak >= badge.days || highestStreak >= badge.days;
                    return (
                        <div
                            key={badge.id}
                            className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                                isUnlocked
                                    ? `bg-gradient-to-b ${badge.color} shadow-md border-opacity-60 scale-105`
                                    : 'bg-black/30 border-slate-800 text-slate-600 opacity-50'
                            }`}
                        >
                            <span className="text-2xl mb-1">{badge.icon}</span>
                            <span className="text-xs font-bold text-slate-200">{badge.label}</span>
                            <span className="text-[9px] font-mono font-bold mt-1 text-slate-400">
                                {isUnlocked ? 'UNLOCKED ✓' : `${badge.days} Days Req.`}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StreakBadgeWidget;
