import React, { useState, useMemo } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

const EquityChart = ({ data, currencySymbol = '$' }) => {
    const [timeframe, setTimeframe] = useState('ALL'); // '7D' | '30D' | '90D' | 'YTD' | 'ALL'

    const filteredData = useMemo(() => {
        if (!data || data.length === 0) return [];
        if (timeframe === 'ALL') return data;

        const now = new Date();
        let cutoff = new Date();

        if (timeframe === '7D') cutoff.setDate(now.getDate() - 7);
        else if (timeframe === '30D') cutoff.setDate(now.getDate() - 30);
        else if (timeframe === '90D') cutoff.setDate(now.getDate() - 90);
        else if (timeframe === 'YTD') cutoff = new Date(now.getFullYear(), 0, 1);

        const cutoffStr = cutoff.toISOString().split('T')[0];

        const sliced = data.filter(d => {
            if (!d.rawDate) return true;
            return d.rawDate >= cutoffStr;
        });

        return sliced.length > 0 ? sliced : data;
    }, [data, timeframe]);

    if (!data || data.length === 0) return null;

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#0b0f26] border border-[#162C99]/50 p-3 rounded-xl shadow-2xl backdrop-blur-md">
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase mb-1">{label}</p>
                    <p className="text-sm font-extrabold text-white flex items-center gap-1">
                        <span>Equity:</span>
                        <span className={payload[0].value >= (filteredData[0]?.balance || 0) ? 'text-[#1BA657]' : 'text-red-400'}>
                            {currencySymbol}{parseFloat(payload[0].value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </p>
                </div>
            );
        }
        return null;
    };

    const balances = filteredData.map(d => d.balance);
    const minBal = Math.min(...balances);
    const maxBal = Math.max(...balances);
    const padding = (maxBal - minBal) * 0.1 || 100;

    return (
        <div className="w-full flex flex-col gap-3">
            {/* Timeframe Controls */}
            <div className="flex justify-between items-center px-1">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Interactive Equity Curve
                </div>
                <div className="flex bg-black/40 border border-slate-800 p-1 rounded-lg gap-1">
                    {['7D', '30D', '90D', 'YTD', 'ALL'].map(tf => (
                        <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold transition-all ${
                                timeframe === tf
                                    ? 'bg-jtg-green text-black shadow'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart Area */}
            <div className="w-full h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={filteredData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#1BA657" stopOpacity={0.35} />
                                <stop offset="95%" stopColor="#1BA657" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#162C99" opacity={0.15} />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }}
                            dy={10}
                        />
                        <YAxis
                            hide={true}
                            domain={[minBal - padding, maxBal + padding]}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="balance"
                            stroke="#1BA657"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorEquity)"
                            animationDuration={1200}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default EquityChart;
