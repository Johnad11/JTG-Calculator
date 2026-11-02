import React, { useMemo } from 'react';
import { Icons } from './Icons';

// BADGES DEFINITION WITH SVG ICONS
export const STREAK_BADGES = [
    { id: '7d', label: '7-Day Streak', days: 7, Icon: Icons.Zap, color: 'from-amber-500/20 to-yellow-500/20 text-amber-400 border-amber-500/40', glow: 'shadow-amber-500/20' },
    { id: '1m', label: '30-Day Master', days: 30, Icon: Icons.Star, color: 'from-emerald-500/20 to-green-500/20 text-emerald-400 border-emerald-500/40', glow: 'shadow-emerald-500/20' },
    { id: '3m', label: '90-Day Pro', days: 90, Icon: Icons.Trophy, color: 'from-blue-500/20 to-cyan-500/20 text-cyan-400 border-cyan-500/40', glow: 'shadow-cyan-500/20' },
    { id: '6m', label: '180-Day Elite', days: 180, Icon: Icons.Crown, color: 'from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/40', glow: 'shadow-purple-500/20' },
    { id: '12m', label: '365-Day Legend', days: 365, Icon: Icons.Flame, color: 'from-rose-500/20 to-orange-500/20 text-orange-400 border-orange-500/40', glow: 'shadow-orange-500/20' },
    { id: '1000d', label: '1000-Day Legend', days: 1000, Icon: Icons.Rocket, color: 'from-cyan-400/30 to-emerald-400/30 text-white border-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.5)]', glow: 'shadow-cyan-500/30' }
];

export const calculateStreak = (trades = []) => {
    if (!trades || trades.length === 0) return { currentStreak: 0, highestStreak: 0, activeDaysSet: new Set() };

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

    const todayStr = new Date().toISOString().split('T')[0];
    const todayMs = new Date(todayStr + 'T00:00:00Z').getTime();
    const lastTradeMs = dateObjects[dateObjects.length - 1];
    const daysSinceLast = Math.round((todayMs - lastTradeMs) / (1000 * 60 * 60 * 24));

    if (daysSinceLast <= 1) {
        currentStreak = tempStreak;
    } else {
        currentStreak = 0;
    }

    return { currentStreak, highestStreak, activeDaysCount: uniqueDates.length };
};

const StreakBadgeWidget = ({ trades = [], showDetails = false, onClick }) => {
    const { currentStreak, highestStreak } = useMemo(() => calculateStreak(trades), [trades]);

    if (!showDetails) {
        // Compact Streak Button: Fire emoji with superscript streak number badge (Req 7)
        return (
            <button
                type="button"
                onClick={onClick}
                className="relative inline-flex items-center justify-center p-2 rounded-full hover:bg-input-theme transition-all group active:scale-90"
                title={`Active Streak: ${currentStreak} Consecutive Days (Best: ${highestStreak} Days)`}
                aria-label={`Trading Streak: ${currentStreak} Days`}
            >
                <span className="text-xl leading-none select-none drop-shadow-sm group-hover:scale-110 transition-transform">
                    🔥
                </span>
                <sup className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-500 to-orange-500 text-black text-[9px] font-black min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center leading-none shadow-sm ring-1 ring-white/30">
                    {currentStreak}
                </sup>
            </button>
        );
    }

    // Detailed Badge Showcase Card (Req 8)
    return (
        <div className="bento-card p-6 md:p-8 rounded-3xl text-main-theme shadow-xl mb-8">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                        <Icons.Flame className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-black text-lg text-main-theme tracking-tight flex items-center gap-2">
                            Trading Streak Milestones
                        </h3>
                        <p className="text-muted-theme text-xs mt-0.5">Log daily trades to unlock discipline badges and build consistent habits.</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-input-theme/50 px-4 py-2.5 rounded-2xl border border-theme">
                    <div className="text-center">
                        <span className="text-xs text-muted-theme uppercase font-bold block">Current</span>
                        <span className="text-xl font-black text-amber-500 font-mono">{currentStreak}</span>
                    </div>
                    <div className="w-px h-8 bg-theme"></div>
                    <div className="text-center">
                        <span className="text-xs text-muted-theme uppercase font-bold block">Best Record</span>
                        <span className="text-xl font-black text-jtg-green font-mono">{highestStreak}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                {STREAK_BADGES.map(badge => {
                    const isUnlocked = currentStreak >= badge.days || highestStreak >= badge.days;
                    const BadgeIcon = badge.Icon;
                    return (
                        <div
                            key={badge.id}
                            className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center transition-all duration-300 ${
                                isUnlocked
                                    ? `bg-gradient-to-b ${badge.color} border-opacity-70 shadow-lg ${badge.glow} -translate-y-0.5`
                                    : 'bg-input-theme/30 border-theme text-muted-theme opacity-60'
                            }`}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2.5 ${isUnlocked ? 'bg-white/10' : 'bg-input-theme'}`}>
                                <BadgeIcon className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-black tracking-tight">{badge.label}</span>
                            <span className="text-[10px] font-mono font-bold mt-1.5 px-2 py-0.5 rounded-full bg-input-theme/50 border border-theme">
                                {isUnlocked ? 'UNLOCKED' : `${badge.days}d req`}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StreakBadgeWidget;
