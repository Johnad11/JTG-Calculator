import React from 'react';
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
    if (!data || data.length === 0) return null;

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-jtg-dark border border-jtg-blue/30 p-3 rounded-lg shadow-xl shadow-black/50">
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">{label}</p>
                    <p className="text-sm font-bold text-white">
                        Equity: <span className={payload[0].value >= data[0].balance ? 'text-jtg-green' : 'text-red-500'}>
                            {currencySymbol}{payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </p>
                </div>
            );
        }
        return null;
    };

    // Find min and max for better Y scale
    const balances = data.map(d => d.balance);
    const minBal = Math.min(...balances);
    const maxBal = Math.max(...balances);
    const padding = (maxBal - minBal) * 0.1 || 100;

    return (
        <div className="w-full h-full" style={{ minHeight: '300px' }}>
            <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                <AreaChart
                    data={data}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#1BA657" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#1BA657" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#162C99" opacity={0.1} />
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
                        animationDuration={1500}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default EquityChart;
