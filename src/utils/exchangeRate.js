import { BASE_CURRENCY, EXCHANGE_RATE_API } from '../constants';

/**
 * Fetch exchange rates from API or cache
 * @returns {Promise<Object>} Exchange rates object with currency codes as keys
 */
export const fetchExchangeRates = async () => {
    try {
        // Current date string for comparison (e.g., "2026-01-06")
        const today = new Date().toISOString().split('T')[0];

        // Check cache first
        const cachedRates = localStorage.getItem(EXCHANGE_RATE_API.cacheKey);
        const cachedDate = localStorage.getItem(EXCHANGE_RATE_API.cacheDateKey);

        if (cachedRates && cachedDate === today) {
            console.log('Using cached exchange rates for today:', today);
            return JSON.parse(cachedRates);
        }

        // Fetch fresh rates
        console.log('Fetching fresh exchange rates for new day:', today);
        const response = await fetch(`${EXCHANGE_RATE_API.endpoint}${BASE_CURRENCY}`);

        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();

        if (!data.rates) {
            throw new Error('Invalid API response format');
        }

        // Cache the rates and the date
        localStorage.setItem(EXCHANGE_RATE_API.cacheKey, JSON.stringify(data.rates));
        localStorage.setItem(EXCHANGE_RATE_API.cacheTimeKey, Date.now().toString());
        localStorage.setItem(EXCHANGE_RATE_API.cacheDateKey, today);

        return data.rates;
    } catch (error) {
        console.error('Error fetching exchange rates:', error);

        // Try to use cached rates even if from a previous day
        const cachedRates = localStorage.getItem(EXCHANGE_RATE_API.cacheKey);
        if (cachedRates) {
            console.warn('API failed, using existing cached rates from previous session');
            return JSON.parse(cachedRates);
        }

        // If no cache, return fallback rates
        console.error('No cached rates available, using fallback');
        return {
            USD: 1,
            NGN: 1650, // Approximate current rate
            GBP: 0.79  // Approximate current rate
        };
    }
};

/**
 * Get cached rates timestamp for display
 * @returns {string|null} Formatted timestamp or null if no cache
 */
export const getCachedRatesTime = () => {
    const cachedTime = localStorage.getItem(EXCHANGE_RATE_API.cacheTimeKey);
    if (!cachedTime) return null;

    const date = new Date(parseInt(cachedTime));
    return date.toLocaleString();
};
