import React from 'react';

const StatCard = ({ title, value, sub, color, icon, badge, trend }) => {
    let textColor = 'text-main-theme';
    if (color === 'emerald') textColor = 'text-jtg-green';
    if (color === 'red') textColor = 'text-red-500';
    if (color === 'blue') textColor = 'text-jtg-blue';

    return (
        <div className="bento-card p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
            <div className="flex justify-between items-start mb-3">
                <p className="text-muted-theme text-[11px] font-extrabold uppercase tracking-widest">{title}</p>
                {icon ? (
                    <div className="w-8 h-8 rounded-full bg-input-theme border border-theme flex items-center justify-center text-muted-theme group-hover:text-jtg-blue transition-colors">
                        {icon}
                    </div>
                ) : (
                    <div className="w-6 h-6 rounded-full bg-input-theme/50 flex items-center justify-center text-muted-theme text-xs opacity-60">
                        ↗
                    </div>
                )}
            </div>
            
            <div className={`text-3xl md:text-4xl font-black tracking-tight ${textColor} font-sans`}>
                {value}
            </div>

            <div className="flex items-center gap-2 mt-2">
                {trend && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        trend.startsWith('+') ? 'bg-jtg-green/15 text-jtg-green' : 'bg-red-500/15 text-red-500'
                    }`}>
                        {trend}
                    </span>
                )}
                {sub && <p className="text-muted-theme text-xs font-mono">{sub}</p>}
                {badge && (
                    <span className="ml-auto text-[10px] bg-input-theme border border-theme px-2 py-0.5 rounded-full font-bold text-muted-theme">
                        {badge}
                    </span>
                )}
            </div>
        </div>
    );
};

export default StatCard;
