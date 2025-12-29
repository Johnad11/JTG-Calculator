import React from 'react';
import { Icons } from './Icons';

const JtgPromo = () => (
    <div className="bg-gradient-to-r from-jtg-blue/40 to-jtg-card border border-jtg-blue/30 rounded-2xl p-6 lg:p-8 mt-8 mb-8 relative overflow-hidden group hover:border-jtg-green/30 transition-colors duration-500 w-full shrink-0">
        <div className="absolute top-0 right-0 w-40 h-40 bg-jtg-green/5 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity group-hover:opacity-100 opacity-50"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
                <h3 className="text-xl font-bold text-white mb-2 tracking-wide">Scale Your Capital with JTG</h3>
                <p className="text-slate-400 text-sm leading-relaxed font-light max-w-md">
                    Stop gambling. Use our data-driven strategies to pass your Prop Firm challenges consistently.
                </p>
            </div>
            <button
                onClick={() => window.location.href = 'https://johnadtradersgroup.vercel.app/'}
                className="text-sm font-bold text-jtg-green bg-jtg-green/10 px-6 py-3 rounded-full hover:bg-jtg-green hover:text-white flex items-center gap-2 transition-all uppercase tracking-wider whitespace-nowrap shadow-lg border border-jtg-green/20"
            >
                Visit JTG Website <Icons.ArrowRight />
            </button>
        </div>
    </div>
);

export default JtgPromo;
