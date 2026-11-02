import React from 'react';
import { Icons } from './Icons';

const JtgPromo = () => (
    <div className="card-mastery-dark p-6 lg:p-8 mt-6 mb-6 shadow-xl group transition-all duration-300 hover:shadow-2xl hover:border-white/20">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-jtg-blue/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-36 h-36 bg-jtg-green/15 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-1.5 bg-jtg-green/20 border border-jtg-green/40 px-3 py-1 rounded-full text-jtg-green text-[10px] font-extrabold uppercase tracking-widest">
                    <span>⚡</span>
                    <span>15% Discount For Community Members</span>
                </div>
                <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">
                    Join Our Institutional Trading Mastery
                </h3>
                <p className="text-slate-300 text-xs md:text-sm leading-relaxed font-normal">
                    Master risk management, eliminate impulsive overtrading, and pass prop firm challenges consistently with JTG ecosystem strategies.
                </p>
            </div>

            <button
                onClick={() => window.open('https://www.johnadtradersgroup.name.ng/', '_blank')}
                className="bg-jtg-blue hover:bg-blue-600 text-white font-extrabold text-xs md:text-sm px-6 py-3.5 rounded-full flex items-center gap-2.5 transition-all shadow-lg hover:shadow-blue-500/25 active:scale-95 shrink-0 group/btn"
            >
                <span>Join Class</span>
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform">
                    ↗
                </span>
            </button>
        </div>
    </div>
);

export default JtgPromo;
