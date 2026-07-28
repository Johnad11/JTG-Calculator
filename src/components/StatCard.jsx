import React from 'react';

const StatCard = ({ title, value, sub, color, icon }) => {
    // Safe color logic for Tailwind
    let bgColor = 'bg-slate-500/10';
    if (color === 'emerald') bgColor = 'bg-emerald-500/10';
    if (color === 'red') bgColor = 'bg-red-500/10';

    let textColor = 'text-main-theme';
    if (color === 'emerald') textColor = 'text-jtg-green';
    if (color === 'red') textColor = 'text-red-500';

    return (
        <div className="bg-card-theme border border-theme rounded-2xl p-6 shadow-md relative overflow-hidden group spring-card hover:border-jtg-blue/40 transition duration-300">
            <div className={`absolute top-0 right-0 w-24 h-24 ${bgColor} rounded-full blur-xl -mr-6 -mt-6 transition-all`}></div>
            <div className="flex justify-between items-start mb-2"><p className="text-muted-theme text-xs font-bold uppercase tracking-wider">{title}</p>{icon}</div>
            <div className={`text-3xl md:text-4xl font-black tracking-tight ${textColor}`}>{value}</div>
            {sub && <p className="text-muted-theme text-xs mt-1 font-mono">{sub}</p>}
        </div>
    );
};

export default StatCard;
