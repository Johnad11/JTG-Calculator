import { BASE_CURRENCY } from '../constants';

/**
 * Convert amount from selected currency to base currency (USD)
 * @param {number} amount - Amount in the selected currency
 * @param {string} fromCurrency - Currency code (USD, NGN, GBP)
 * @param {object} rates - Exchange rates object
 * @returns {number} Amount in USD
 */
export const toBase = (amount, fromCurrency, rates) => {
    if (!amount || isNaN(amount)) return 0;
    if (fromCurrency === BASE_CURRENCY) return parseFloat(amount);

    const rate = rates[fromCurrency];
    if (!rate) {
        console.warn(`No rate found for ${fromCurrency}, returning original amount`);
        return parseFloat(amount);
    }

    // Convert to base: amount / rate
    return parseFloat(amount) / rate;
};

/**
 * Convert amount from base currency (USD) to selected currency
 * @param {number} amount - Amount in USD
 * @param {string} toCurrency - Currency code (USD, NGN, GBP)
 * @param {object} rates - Exchange rates object
 * @returns {number} Amount in selected currency
 */
export const fromBase = (amount, toCurrency, rates) => {
    if (!amount || isNaN(amount)) return 0;
    if (toCurrency === BASE_CURRENCY) return parseFloat(amount);

    const rate = rates[toCurrency];
    if (!rate) {
        console.warn(`No rate found for ${toCurrency}, returning original amount`);
        return parseFloat(amount);
    }

    // Convert from base: amount * rate
    return parseFloat(amount) * rate;
};

/**
 * Format currency value with proper decimals and symbol
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @param {string} symbol - Currency symbol
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency, symbol) => {
    if (!amount || isNaN(amount)) return `${symbol}0.00`;

    // NGN typically doesn't use decimals in display
    const decimals = currency === 'NGN' ? 0 : 2;
    const formatted = parseFloat(amount).toFixed(decimals);

    return `${symbol}${parseFloat(formatted).toLocaleString()}`;
};

/**
 * Convert a value for display (from base to selected currency)
 * @param {string|number} value - Value stored in base currency
 * @param {string} currency - Target currency code
 * @param {object} rates - Exchange rates object
 * @returns {number} Converted value
 */
export const convertForDisplay = (value, currency, rates) => {
    return fromBase(parseFloat(value) || 0, currency, rates);
};

/**
 * Convert user input to base currency for storage
 * @param {string|number} value - User input in selected currency
 * @param {string} currency - Current currency code
 * @param {object} rates - Exchange rates object
 * @returns {number} Value in base currency
 */
export const convertForStorage = (value, currency, rates) => {
    return toBase(parseFloat(value) || 0, currency, rates);
};
