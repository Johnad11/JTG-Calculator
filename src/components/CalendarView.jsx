import React, { useState, useMemo } from 'react';
import { Icons } from './Icons';
import { convertForDisplay } from '../utils/currencyConverter';

const CalendarView = ({ trades, currency = 'USD', currencySymbol = '$', exchangeRates }) => {
    const [date, setDate] = useState(new Date());
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const pnlMap = useMemo(() => {
        const map = {};
        trades.forEach(t => { 
            if (t.closeDate) { 
                const day = t.closeDate.split('T')[0]; 
                if (!map[day]) map[day] = 0; 
                
                const val = t.pnlNative ? parseFloat(t.pnlNative) : (exchangeRates ? convertForDisplay(t.pnl, currency, exchangeRates) : parseFloat(t.pnl));
                map[day] += val; 
            } 
        });
        return map;
    }, [trades, currency, exchangeRates]);

    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    while (days.length % 7 !== 0) days.push(null);

    const prevMonth = () => setDate(new Date(year, month - 1, 1));
    const nextMonth = () => setDate(new Date(year, month + 1, 1));

    return (
        <div className="flex flex-col h-full animate-pop overflow-y-auto custom-scroll p-4 md:p-8 pb-28 md:pb-8">
            <div className="bento-card p-6 md:p-8 rounded-3xl flex flex-col mb-8 text-main-theme">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-jtg-green/15 flex items-center justify-center text-jtg-green">
                            <Icons.Calendar />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-main-theme tracking-tight">Performance Calendar</h2>
                            <p className="text-xs text-muted-theme">Daily aggregated net profit & loss tracking</p>
                        </div>
                    </div>
                    
                    {/* Month Selector Capsule Pill */}
                    <div className="flex items-center gap-2 bg-input-theme rounded-full p-1.5 border border-theme">
                        <button onClick={prevMonth} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-card-theme text-muted-theme hover:text-main-theme transition-all" aria-label="Previous Month">
                            <Icons.ChevronLeft />
                        </button>
                        <span className="text-xs font-black uppercase tracking-wider w-36 text-center text-main-theme">
                            {monthNames[month]} {year}
                        </span>
                        <button onClick={nextMonth} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-card-theme text-muted-theme hover:text-main-theme transition-all" aria-label="Next Month">
                            <Icons.ChevronRight />
                        </button>
                    </div>
                </div>
                <div>
                    <div className="grid grid-cols-7 gap-px bg-input-theme border border-theme rounded-2xl overflow-hidden text-center text-[10px] md:text-xs font-extrabold text-muted-theme uppercase py-2.5"><div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div></div>
                    <div className="grid grid-cols-7 gap-1 md:gap-2.5 mt-2 min-h-[350px] sm:min-h-[420px] md:min-h-[500px] auto-rows-fr">
                        {days.map((day, idx) => {
                            if (!day) return <div key={idx} className="bg-input-theme/20 border border-theme/20 rounded-lg opacity-30 min-h-[50px] sm:min-h-[64px]"></div>;
                            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const pnl = pnlMap[dateStr];
                            const hasTrade = pnl !== undefined;
                            const isWin = pnl > 0;
                            return (
                                <div key={idx} className={`p-1.5 md:p-2.5 min-h-[50px] sm:min-h-[64px] rounded-lg border transition flex flex-col justify-between overflow-hidden ${hasTrade ? (isWin ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30') : 'bg-input-theme border-theme opacity-80'}`}>
                                    <span className="text-[10px] md:text-xs font-bold text-muted-theme">{day}</span>
                                    {hasTrade && <span className={`text-[10px] md:text-xs font-mono font-bold truncate ${isWin ? 'text-jtg-green' : 'text-red-500'}`}>{isWin ? '+' : ''}{currencySymbol}{pnl.toFixed(currency === 'NGN' ? 0 : 2)}</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(CalendarView);
