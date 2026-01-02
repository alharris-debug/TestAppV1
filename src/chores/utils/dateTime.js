/**
 * Date & Time Utility Functions
 *
 * Handles daily/weekly reset logic, date comparisons,
 * and period tracking for the recurrence system.
 */

import { RECURRENCE_TYPE, DEFAULT_WEEKLY_RESET_DAY, WEEK_DAYS } from '../schema.js';

/**
 * Get start of today (midnight local time)
 * @returns {Date}
 */
export const getStartOfToday = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
};

/**
 * Get start of this week based on reset day
 * @param {number} resetDay - Day of week (0 = Sunday, 1 = Monday, etc.)
 * @returns {Date}
 */
export const getStartOfWeek = (resetDay = DEFAULT_WEEKLY_RESET_DAY) => {
    const now = new Date();
    const currentDay = now.getDay();

    // Calculate days to subtract to get to the reset day
    let daysToSubtract = currentDay - resetDay;
    if (daysToSubtract < 0) {
        daysToSubtract += 7;
    }

    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - daysToSubtract);
    weekStart.setHours(0, 0, 0, 0);

    return weekStart;
};

/**
 * Get end of today (23:59:59.999 local time)
 * @returns {Date}
 */
export const getEndOfToday = () => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    return now;
};

/**
 * Get end of this week based on reset day
 * @param {number} resetDay - Day of week for reset
 * @returns {Date}
 */
export const getEndOfWeek = (resetDay = DEFAULT_WEEKLY_RESET_DAY) => {
    const weekStart = getStartOfWeek(resetDay);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return weekEnd;
};

/**
 * Check if a date is today
 * @param {string | Date} date - Date to check
 * @returns {boolean}
 */
export const isToday = (date) => {
    const check = new Date(date);
    const today = new Date();
    return check.toDateString() === today.toDateString();
};

/**
 * Check if a date is yesterday
 * @param {string | Date} date - Date to check
 * @returns {boolean}
 */
export const isYesterday = (date) => {
    const check = new Date(date);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return check.toDateString() === yesterday.toDateString();
};

/**
 * Check if a date is within the current week
 * @param {string | Date} date - Date to check
 * @param {number} resetDay - Day of week for reset
 * @returns {boolean}
 */
export const isThisWeek = (date, resetDay = DEFAULT_WEEKLY_RESET_DAY) => {
    const check = new Date(date);
    const weekStart = getStartOfWeek(resetDay);
    const weekEnd = getEndOfWeek(resetDay);
    return check >= weekStart && check <= weekEnd;
};

/**
 * Check if a date is within the current period (daily or weekly)
 * @param {string | Date} date - Date to check
 * @param {string} recurrence - 'daily' or 'weekly'
 * @param {number} resetDay - Day of week for weekly reset
 * @returns {boolean}
 */
export const isCurrentPeriod = (date, recurrence, resetDay = DEFAULT_WEEKLY_RESET_DAY) => {
    if (recurrence === RECURRENCE_TYPE.DAILY) {
        return isToday(date);
    } else if (recurrence === RECURRENCE_TYPE.WEEKLY) {
        return isThisWeek(date, resetDay);
    }
    return false;
};

/**
 * Check if a reset is needed based on last reset time
 * @param {string | Date} lastReset - Last reset timestamp
 * @param {string} recurrence - 'daily' or 'weekly'
 * @param {number} resetDay - Day of week for weekly reset
 * @returns {boolean}
 */
export const needsReset = (lastReset, recurrence, resetDay = DEFAULT_WEEKLY_RESET_DAY) => {
    if (!lastReset) return true;

    const lastResetDate = new Date(lastReset);

    if (recurrence === RECURRENCE_TYPE.DAILY) {
        const todayStart = getStartOfToday();
        return lastResetDate < todayStart;
    } else if (recurrence === RECURRENCE_TYPE.WEEKLY) {
        const weekStart = getStartOfWeek(resetDay);
        return lastResetDate < weekStart;
    }

    return false;
};

/**
 * Get the next reset time
 * @param {string} recurrence - 'daily' or 'weekly'
 * @param {number} resetDay - Day of week for weekly reset
 * @returns {Date}
 */
export const getNextResetTime = (recurrence, resetDay = DEFAULT_WEEKLY_RESET_DAY) => {
    const now = new Date();

    if (recurrence === RECURRENCE_TYPE.DAILY) {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow;
    } else if (recurrence === RECURRENCE_TYPE.WEEKLY) {
        const weekEnd = getEndOfWeek(resetDay);
        const nextWeekStart = new Date(weekEnd);
        nextWeekStart.setDate(nextWeekStart.getDate() + 1);
        nextWeekStart.setHours(0, 0, 0, 0);
        return nextWeekStart;
    }

    return now;
};

/**
 * Get time remaining until next reset
 * @param {string} recurrence - 'daily' or 'weekly'
 * @param {number} resetDay - Day of week for weekly reset
 * @returns {{ hours: number, minutes: number, seconds: number, totalMs: number }}
 */
export const getTimeUntilReset = (recurrence, resetDay = DEFAULT_WEEKLY_RESET_DAY) => {
    const now = new Date();
    const nextReset = getNextResetTime(recurrence, resetDay);
    const totalMs = nextReset.getTime() - now.getTime();

    const hours = Math.floor(totalMs / (1000 * 60 * 60));
    const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((totalMs % (1000 * 60)) / 1000);

    return { hours, minutes, seconds, totalMs };
};

/**
 * Format a date for display
 * @param {string | Date} date - Date to format
 * @param {string} format - 'short', 'long', 'time', 'relative'
 * @returns {string}
 */
export const formatDate = (date, format = 'short') => {
    const d = new Date(date);

    switch (format) {
        case 'short':
            return d.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });

        case 'long':
            return d.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });

        case 'time':
            return d.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit'
            });

        case 'datetime':
            return d.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            });

        case 'relative':
            return getRelativeTime(d);

        default:
            return d.toLocaleDateString();
    }
};

/**
 * Get relative time string (e.g., "2 hours ago", "Yesterday")
 * @param {Date} date - Date to convert
 * @returns {string}
 */
export const getRelativeTime = (date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return formatDate(date, 'short');
};

/**
 * Get day name from day number
 * @param {number} dayNum - Day of week (0-6)
 * @returns {string}
 */
export const getDayName = (dayNum) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNum] || '';
};

/**
 * Get period label (e.g., "Today", "This Week")
 * @param {string} recurrence - 'daily' or 'weekly'
 * @returns {string}
 */
export const getPeriodLabel = (recurrence) => {
    return recurrence === RECURRENCE_TYPE.DAILY ? 'Today' : 'This Week';
};

/**
 * Check if date A is before date B
 * @param {string | Date} a - First date
 * @param {string | Date} b - Second date
 * @returns {boolean}
 */
export const isBefore = (a, b) => {
    return new Date(a) < new Date(b);
};

/**
 * Check if date A is after date B
 * @param {string | Date} a - First date
 * @param {string | Date} b - Second date
 * @returns {boolean}
 */
export const isAfter = (a, b) => {
    return new Date(a) > new Date(b);
};

/**
 * Get number of days between two dates
 * @param {string | Date} a - First date
 * @param {string | Date} b - Second date
 * @returns {number}
 */
export const daysBetween = (a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    const diffMs = Math.abs(dateB.getTime() - dateA.getTime());
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

export default {
    getStartOfToday,
    getStartOfWeek,
    getEndOfToday,
    getEndOfWeek,
    isToday,
    isYesterday,
    isThisWeek,
    isCurrentPeriod,
    needsReset,
    getNextResetTime,
    getTimeUntilReset,
    formatDate,
    getRelativeTime,
    getDayName,
    getPeriodLabel,
    isBefore,
    isAfter,
    daysBetween
};
