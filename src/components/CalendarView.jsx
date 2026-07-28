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
    const prevMonth = () => setDate(new Date(year, month - 1, 1));
    const nextMonth = () => setDate(new Date(year, month + 1, 1));

    return (
        <div className="flex flex-col h-full animate-pop overflow-y-auto custom-scroll p-4 md:p-10 pb-24 md:pb-10">
            <div className="bg-card-theme border border-theme rounded-2xl p-4 md:p-6 shadow-xl flex flex-col mb-8 min-h-[450px] md:min-h-[600px] text-main-theme">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h2 className="text-2xl font-bold text-main-theme tracking-wide flex items-center gap-3"><span className="text-jtg-green"><Icons.Calendar /></span> Performance Calendar</h2>
                    <div className="flex items-center gap-4 bg-input-theme rounded-lg p-1 border border-theme">
                        <button onClick={prevMonth} className="p-2 hover:text-main-theme text-muted-theme"><Icons.ChevronLeft /></button>
                        <span className="text-sm font-bold w-32 text-center text-main-theme">{monthNames[month]} {year}</span>
                        <button onClick={nextMonth} className="p-2 hover:text-main-theme text-muted-theme"><Icons.ChevronRight /></button>
                    </div>
                </div>
                <div>
                    <div className="grid grid-cols-7 gap-px bg-input-theme border border-theme rounded-t-xl overflow-hidden text-center text-[10px] md:text-xs font-bold text-muted-theme uppercase py-2"><div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div></div>
                    <div className="grid grid-cols-7 gap-1 md:gap-2 mt-2 h-[320px] sm:h-[450px] md:h-[600px] auto-rows-fr">
                        {days.map((day, idx) => {
                            if (!day) return <div key={idx} className="bg-transparent"></div>;
                            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const pnl = pnlMap[dateStr];
                            const hasTrade = pnl !== undefined;
                            const isWin = pnl > 0;
                            return (
                                <div key={idx} className={`p-1.5 md:p-2 rounded-lg border transition flex flex-col justify-between overflow-hidden ${hasTrade ? (isWin ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30') : 'bg-input-theme border-theme opacity-80'}`}>
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
