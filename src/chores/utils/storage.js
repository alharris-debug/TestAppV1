/**
 * Storage Utility Functions
 *
 * This module handles persistence of chore data to localStorage.
 */

import { STORAGE_KEY } from '../constants.js';

/**
 * Save chore state to localStorage
 *
 * @param {Object} state - State to save
 * @param {Function} [onError] - Error callback
 * @returns {boolean} True if save succeeded
 */
export const saveChoreState = (state, onError) => {
    try {
        const data = JSON.stringify({
            ...state,
            savedAt: new Date().toISOString()
        });
        localStorage.setItem(STORAGE_KEY, data);
        return true;
    } catch (e) {
        console.error('Failed to save chore state:', e);
        if (onError) {
            onError(e.message || 'Failed to save progress');
        }
        return false;
    }
};

/**
 * Load chore state from localStorage
 *
 * @returns {Object | null} Saved state or null if not found/invalid
 */
export const loadChoreState = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return null;

        const data = JSON.parse(saved);

        // Basic validation
        if (typeof data !== 'object' || data === null) {
            console.warn('Invalid save data format');
            return null;
        }

        // Ensure arrays are arrays
        if (data.tasks && !Array.isArray(data.tasks)) {
            data.tasks = [];
        }
        if (data.savedChores && !Array.isArray(data.savedChores)) {
            data.savedChores = [];
        }
        if (data.pendingApproval && !Array.isArray(data.pendingApproval)) {
            data.pendingApproval = [];
        }

        return data;
    } catch (e) {
        console.error('Failed to load chore state:', e);
        return null;
    }
};

/**
 * Clear all saved chore data
 */
export const clearChoreState = () => {
    try {
        localStorage.removeItem(STORAGE_KEY);
        return true;
    } catch (e) {
        console.error('Failed to clear chore state:', e);
        return false;
    }
};

/**
 * Extract chore-specific data from full game state
 *
 * @param {Object} gameState - Full game state object
 * @returns {Object} Chore-specific state
 */
export const extractChoreState = (gameState) => {
    return {
        tasks: gameState.tasks,
        savedChores: gameState.savedChores,
        pendingApproval: gameState.pendingApproval,
        parentPassword: gameState.parentPassword,
        streak: gameState.streak,
        lastPlayDate: gameState.lastPlayDate
    };
};

/**
 * Merge chore state back into full game state
 *
 * @param {Object} gameState - Full game state
 * @param {Object} choreState - Chore-specific state to merge
 * @returns {Object} Merged state
 */
export const mergeChoreState = (gameState, choreState) => {
    return {
        ...gameState,
        tasks: choreState.tasks,
        savedChores: choreState.savedChores,
        pendingApproval: choreState.pendingApproval,
        parentPassword: choreState.parentPassword,
        streak: choreState.streak,
        lastPlayDate: choreState.lastPlayDate
    };
};
