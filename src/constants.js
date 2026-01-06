export const ASSETS = {
    indices: { label: 'Indices', pairs: ['GER40', 'JPN225', 'NAS100', 'SPX500', 'UK100', 'US30'], contract: 1 },
    metals: { label: 'Metals', pairs: ['XAGUSD', 'XAUUSD'], contract: 100 },
    crypto: { label: 'Crypto', pairs: ['BTCUSD', 'DOGEUSD', 'ETHUSD', 'LTCUSD', 'SOLUSD', 'XRPUSD'], contract: 1 },
    forex: { label: 'Forex', pairs: ['AUDCAD', 'AUDCHF', 'AUDJPY', 'AUDNZD', 'AUDUSD', 'CADCHF', 'CADJPY', 'CHFJPY', 'EURAUD', 'EURCAD', 'EURCHF', 'EURGBP', 'EURJPY', 'EURNZD', 'EURUSD', 'GBPAUD', 'GBPCAD', 'GBPCHF', 'GBPJPY', 'GBPNZD', 'GBPUSD', 'NZDCAD', 'NZDCHF', 'NZDJPY', 'NZDUSD', 'USDCAD', 'USDCHF', 'USDJPY', 'USDMXN', 'USDZAR'], contract: 100000 }
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
