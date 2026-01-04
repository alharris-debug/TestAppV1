/**
 * Chore Management System Constants
 *
 * This module contains all constants used by the chore management system.
 */

/**
 * Default chores provided when the app first loads
 */
export const INITIAL_TASKS = [
    { id: 1, name: 'Do the dishes', icon: '🍽️', completed: false, points: 5, repeatType: 'daily' },
    { id: 2, name: 'Clean your room', icon: '🛏️', completed: false, points: 10, repeatType: 'daily' },
    { id: 3, name: 'Take care of the cat', icon: '🐱', completed: false, points: 5, repeatType: 'multiple' },
    { id: 4, name: 'Practice music', icon: '🎸', completed: false, points: 8, repeatType: 'daily' }
];

/**
 * Available icons for chore customization
 */
export const CHORE_ICONS = [
    '📋', '🧹', '🍽️', '🛏️', '🐕', '🐱',
    '🧺', '📚', '🎹', '🌱', '🗑️', '🚿',
    '🦷', '👕', '🧸', '✏️'
];

/**
 * Chore repeat types
 * - 'once': Complete once, then permanently removed
 * - 'daily': Resets each day at midnight
 * - 'multiple': Can be completed multiple times per day
 */
export const REPEAT_TYPES = {
    ONCE: 'once',
    DAILY: 'daily',
    MULTIPLE: 'multiple'
};

/**
 * Default form values for creating/editing chores
 */
export const DEFAULT_CHORE_FORM = {
    name: '',
    icon: '📋',
    repeatType: REPEAT_TYPES.DAILY
};

/**
 * Pattern lock configuration
 */
export const PATTERN_LOCK_CONFIG = {
    MIN_DOTS: 4,          // Minimum dots required for a valid pattern
    DOT_COUNT: 9,         // Total dots in the 3x3 grid
    DOT_HIT_RADIUS: 35,   // Pixel radius for detecting dot hover/touch
};

/**
 * Local storage key for saving chore data
 */
export const STORAGE_KEY = 'chorequest_save_v3';
