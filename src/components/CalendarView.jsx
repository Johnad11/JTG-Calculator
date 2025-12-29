import React, { useState, useMemo } from 'react';
import { Icons } from './Icons';
import JtgPromo from './JtgPromo';

const CalendarView = ({ trades }) => {
    const [date, setDate] = useState(new Date());
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const pnlMap = useMemo(() => {
        const map = {};
        trades.forEach(t => { if (t.closeDate) { const day = t.closeDate.split('T')[0]; if (!map[day]) map[day] = 0; map[day] += parseFloat(t.pnl); } });
        return map;
    }, [trades]);

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
            <div className="bg-jtg-card border border-jtg-blue/30 rounded-2xl p-6 shadow-xl flex-1 flex flex-col mb-8 overflow-hidden min-h-[600px]">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h2 className="text-2xl font-bold text-white tracking-wide flex items-center gap-3"><span className="text-jtg-green"><Icons.Calendar /></span> Performance Calendar</h2>
                    <div className="flex items-center gap-4 bg-jtg-input rounded-lg p-1 border border-jtg-blue/30">
                        <button onClick={prevMonth} className="p-2 hover:text-white text-slate-400"><Icons.ChevronLeft /></button>
                        <span className="text-sm font-bold w-32 text-center text-white">{monthNames[month]} {year}</span>
                        <button onClick={nextMonth} className="p-2 hover:text-white text-slate-400"><Icons.ChevronRight /></button>
                    </div>
                </div>
                <div className="flex-1 overflow-auto custom-scroll">
                    <div className="grid grid-cols-7 gap-px bg-jtg-blue/20 border border-jtg-blue/30 rounded-t-xl overflow-hidden text-center text-xs font-bold text-slate-400 uppercase py-2"><div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div></div>
                    <div className="grid grid-cols-7 gap-2 mt-2 h-[600px] auto-rows-fr">
                        {days.map((day, idx) => {
                            if (!day) return <div key={idx} className="bg-transparent"></div>;
                            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const pnl = pnlMap[dateStr];
                            let bgClass = "bg-jtg-input border border-slate-800"; let textClass = "text-slate-500";
                            if (pnl > 0) { bgClass = "bg-jtg-green/20 border border-jtg-green/40 shadow-[0_0_15px_rgba(27,166,87,0.15)]"; textClass = "text-jtg-green"; }
                            else if (pnl < 0) { bgClass = "bg-red-500/10 border border-red-500/30"; textClass = "text-red-500"; }
                            return (
                                <div key={idx} className={`${bgClass} rounded-xl p-3 flex flex-col justify-between transition-all hover:scale-[1.02] cursor-default`}>
                                    <span className="text-slate-400 text-xs font-bold">{day}</span>
                                    {pnl !== undefined && <div className={`text-[10px] sm:text-xs md:text-lg font-black tracking-tight ${textClass} break-all leading-none`}>{pnl > 0 ? '+' : ''}{pnl.toFixed(0)}</div>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            <JtgPromo />
        </div>
    );
};

export default CalendarView;
