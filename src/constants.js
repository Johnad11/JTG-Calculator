export const ASSETS = {
    indices: { label: 'Indices', pairs: ['GER40', 'JPN225', 'NAS100', 'SPX500', 'UK100', 'US30'], contract: 1 },
    metals: { label: 'Metals', pairs: ['XAGUSD', 'XAUUSD'], contract: 100 },
    crypto: { label: 'Crypto', pairs: ['BTCUSD', 'DOGEUSD', 'ETHUSD', 'LTCUSD', 'SOLUSD', 'XRPUSD'], contract: 1 },
    forex: { label: 'Forex', pairs: ['AUDCAD', 'AUDCHF', 'AUDJPY', 'AUDNZD', 'AUDUSD', 'CADCHF', 'CADJPY', 'CHFJPY', 'EURAUD', 'EURCAD', 'EURCHF', 'EURGBP', 'EURJPY', 'EURNZD', 'EURUSD', 'GBPAUD', 'GBPCAD', 'GBPCHF', 'GBPJPY', 'GBPNZD', 'GBPUSD', 'NZDCAD', 'NZDCHF', 'NZDJPY', 'NZDUSD', 'USDCAD', 'USDCHF', 'USDJPY', 'USDMXN', 'USDZAR'], contract: 100000 },
    weltrade: { 
        label: 'Weltrade', 
        pairs: [
            'FX Vol 20', 'FX Vol 40', 'FX Vol 60', 'FX Vol 80', 'FX Vol 99',
            'SFX Vol 20', 'SFX Vol 40', 'SFX Vol 60', 'SFX Vol 80', 'SFX Vol 99',
            'Gain X 400', 'Gain X 600', 'Gain X 800', 'Gain X 999',
            'Pen X 400', 'Pen X 600', 'Pen X 800', 'Pen X 999',
            'Break 200', 'Break 400', 'Break 600', 'Break 800'
        ].sort(), 
        contract: 1 
    }
};

export const CURRENCIES = {
    USD: { symbol: '$', label: 'USD' }
};

export const BASE_CURRENCY = 'USD';

export const EXCHANGE_RATE_API = {
    endpoint: 'https://api.exchangerate-api.com/v4/latest/',
    cacheKey: 'jtg_exchange_rates',
    cacheTimeKey: 'jtg_exchange_rates_time',
    cacheDateKey: 'jtg_exchange_rates_date'
};

export const LOGO_URL = "/logo.png";
