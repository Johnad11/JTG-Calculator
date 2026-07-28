import React from 'react';
import { Icons } from './Icons';

const JtgPromo = () => (
    <div className="bg-gradient-to-r from-emerald-50 via-white to-slate-50 border border-slate-200 rounded-2xl p-6 lg:p-8 mt-8 mb-8 relative overflow-hidden group hover:border-jtg-green/40 transition-colors duration-500 w-full shrink-0 shadow-md">
        <div className="absolute top-0 right-0 w-40 h-40 bg-jtg-green/5 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity group-hover:opacity-100 opacity-50"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
                <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-wide">Scale Your Capital with JTG</h3>
                <p className="text-slate-600 text-sm leading-relaxed font-light max-w-md">
                    Stop gambling. Use our data-driven strategies to pass your Prop Firm challenges consistently.
                </p>
            </div>
            <button
                onClick={() => window.open('https://www.johnadtradersgroup.name.ng/', '_blank')}
                className="text-sm font-bold text-jtg-green bg-emerald-100 hover:bg-jtg-green hover:text-white px-6 py-3 rounded-full flex items-center gap-2 transition-all uppercase tracking-wider whitespace-nowrap shadow-md border border-emerald-200"
            >
                Visit JTG Website <Icons.ArrowRight />
            </button>
        </div>
    </div>
);

export default JtgPromo;
