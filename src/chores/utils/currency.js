/**
 * Currency Utility Functions
 *
 * Handles all currency operations in cents to avoid floating point errors.
 * Display functions convert to dollars with proper formatting.
 */

/**
 * Convert dollars to cents
 * @param {number} dollars - Amount in dollars
 * @returns {number} Amount in cents
 */
export const dollarsToCents = (dollars) => {
    return Math.round(dollars * 100);
};

/**
 * Convert cents to dollars
 * @param {number} cents - Amount in cents
 * @returns {number} Amount in dollars
 */
export const centsToDollars = (cents) => {
    return cents / 100;
};

/**
 * Format cents as a dollar string
 * @param {number} cents - Amount in cents
 * @param {boolean} showSign - Whether to show +/- sign
 * @returns {string} Formatted dollar string (e.g., "$5.00")
 */
export const formatCents = (cents, showSign = false) => {
    const dollars = Math.abs(cents) / 100;
    const formatted = dollars.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    if (showSign && cents > 0) {
        return '+' + formatted;
    } else if (cents < 0) {
        return '-' + formatted;
    }

    return formatted;
};

/**
 * Format cents as a short dollar string (no cents if whole dollar)
 * @param {number} cents - Amount in cents
 * @returns {string} Short formatted string (e.g., "$5" or "$5.50")
 */
export const formatCentsShort = (cents) => {
    const dollars = cents / 100;
    if (cents % 100 === 0) {
        return `$${Math.floor(dollars)}`;
    }
    return formatCents(cents);
};

/**
 * Parse a dollar string to cents
 * @param {string} dollarString - String like "$5.00" or "5.50"
 * @returns {number} Amount in cents
 */
export const parseDollarString = (dollarString) => {
    // Remove currency symbol and any non-numeric characters except decimal
    const cleaned = dollarString.replace(/[^0-9.-]/g, '');
    const dollars = parseFloat(cleaned) || 0;
    return dollarsToCents(dollars);
};

/**
 * Validate a cents amount
 * @param {number} cents - Amount to validate
 * @param {number} min - Minimum allowed (default 1 cent)
 * @param {number} max - Maximum allowed (default $10000)
 * @returns {boolean} Whether amount is valid
 */
export const isValidCentsAmount = (cents, min = 1, max = 1000000) => {
    return Number.isInteger(cents) && cents >= min && cents <= max;
};

/**
 * Calculate number of dollar bills for animation
 * Rounds to create satisfying visual effect
 * @param {number} cents - Amount in cents
 * @returns {number} Number of dollar bills to animate
 */
export const calculateBillCount = (cents) => {
    const dollars = cents / 100;

    // For small amounts, show at least 1 bill
    if (dollars < 1) return 1;

    // Round up for satisfaction
    return Math.ceil(dollars);
};

/**
 * Calculate coins breakdown for animation
 * @param {number} cents - Remaining cents after dollar bills
 * @returns {{ quarters: number, dimes: number, nickels: number, pennies: number }}
 */
export const calculateCoins = (cents) => {
    let remaining = cents % 100; // Only the cents portion

    const quarters = Math.floor(remaining / 25);
    remaining -= quarters * 25;

    const dimes = Math.floor(remaining / 10);
    remaining -= dimes * 10;

    const nickels = Math.floor(remaining / 5);
    remaining -= nickels * 5;

    const pennies = remaining;

    return { quarters, dimes, nickels, pennies };
};

/**
 * Add two cent amounts safely
 * @param {number} a - First amount in cents
 * @param {number} b - Second amount in cents
 * @returns {number} Sum in cents
 */
export const addCents = (a, b) => {
    return (a || 0) + (b || 0);
};

/**
 * Subtract cents safely (allows negative result)
 * @param {number} a - Amount to subtract from
 * @param {number} b - Amount to subtract
 * @returns {number} Difference in cents
 */
export const subtractCents = (a, b) => {
    return (a || 0) - (b || 0);
};

/**
 * Multiply cents by a count
 * @param {number} cents - Amount per unit
 * @param {number} count - Number of units
 * @returns {number} Total in cents
 */
export const multiplyCents = (cents, count) => {
    return Math.round(cents * count);
};

/**
 * Check if user can afford an amount
 * @param {number} balance - Current balance in cents
 * @param {number} cost - Cost in cents
 * @returns {boolean} Whether user can afford it
 */
export const canAfford = (balance, cost) => {
    return balance >= cost;
};

/**
 * Calculate percentage of total
 * @param {number} amount - Amount in cents
 * @param {number} total - Total in cents
 * @returns {number} Percentage (0-100)
 */
export const percentageOf = (amount, total) => {
    if (total === 0) return 0;
    return Math.round((amount / total) * 100);
};

export default {
    dollarsToCents,
    centsToDollars,
    formatCents,
    formatCentsShort,
    parseDollarString,
    isValidCentsAmount,
    calculateBillCount,
    calculateCoins,
    addCents,
    subtractCents,
    multiplyCents,
    canAfford,
    percentageOf
};
