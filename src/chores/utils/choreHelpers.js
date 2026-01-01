/**
 * Chore Helper Utility Functions
 *
 * This module provides utility functions for chore management operations.
 */

import { REPEAT_TYPES } from '../constants.js';

/**
 * Create a new chore object from form data
 *
 * @param {Object} formData - Form data for the chore
 * @param {string} formData.name - Chore name
 * @param {string} formData.icon - Chore icon emoji
 * @param {number} formData.points - Gem points reward
 * @param {string} formData.repeatType - Repeat type ('once'|'daily'|'multiple')
 * @returns {Object} New chore object
 */
export const createChore = (formData) => {
    return {
        id: Date.now(),
        name: formData.name.trim(),
        icon: formData.icon,
        points: parseInt(formData.points) || 5,
        repeatType: formData.repeatType || REPEAT_TYPES.DAILY,
        completed: false
    };
};

/**
 * Create a pending approval entry from a completed chore
 *
 * @param {Object} chore - The completed chore
 * @param {number} streak - Current streak count
 * @returns {Object} Pending approval entry
 */
export const createPendingApproval = (chore, streak) => {
    const streakBonus = Math.floor(streak / 5);
    const totalPoints = chore.points + streakBonus;

    return {
        ...chore,
        approvalId: `${chore.id}-${Date.now()}`,
        totalPoints,
        streakBonus,
        completedAt: new Date().toISOString()
    };
};

/**
 * Check if a chore can be completed
 *
 * @param {Object} chore - The chore to check
 * @returns {boolean} True if chore can be completed
 */
export const canCompleteChore = (chore) => {
    if (!chore) return false;
    // Multiple-type chores can always be completed
    if (chore.repeatType === REPEAT_TYPES.MULTIPLE) return true;
    // Other types can only be completed if not already completed
    return !chore.completed;
};

/**
 * Reset tasks for a new day
 * - Removes completed 'once' type tasks
 * - Resets 'daily' and 'multiple' tasks to incomplete
 *
 * @param {Object[]} tasks - Array of tasks
 * @returns {Object[]} Updated tasks array
 */
export const resetDailyTasks = (tasks) => {
    return tasks
        .filter(task => {
            // Remove completed one-time tasks
            if (task.repeatType === REPEAT_TYPES.ONCE && task.completed) {
                return false;
            }
            return true;
        })
        .map(task => {
            // Reset daily and multiple tasks
            if (task.repeatType === REPEAT_TYPES.DAILY ||
                task.repeatType === REPEAT_TYPES.MULTIPLE) {
                return { ...task, completed: false, pendingApproval: false };
            }
            return task;
        });
};

/**
 * Update a chore with new form data
 *
 * @param {Object} chore - Existing chore to update
 * @param {Object} formData - New form data
 * @returns {Object} Updated chore
 */
export const updateChore = (chore, formData) => {
    return {
        ...chore,
        name: formData.name.trim() || chore.name,
        icon: formData.icon,
        points: parseInt(formData.points) || chore.points,
        repeatType: formData.repeatType
    };
};

/**
 * Calculate streak update based on last play date
 *
 * @param {string | null} lastPlayDate - ISO date string of last activity
 * @param {number} currentStreak - Current streak count
 * @returns {number} Updated streak count
 */
export const calculateStreak = (lastPlayDate, currentStreak) => {
    if (!lastPlayDate) return currentStreak;

    const today = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastPlayDate === yesterday.toDateString()) {
        return currentStreak + 1;
    } else if (lastPlayDate !== today) {
        return 0;
    }

    return currentStreak;
};

/**
 * Process review decisions and calculate gems awarded
 *
 * @param {Object[]} pendingApproval - Array of pending approvals
 * @param {Object.<string, string>} decisions - Map of approvalId to decision
 * @returns {{gemsAwarded: number, approvedIds: string[], rejectedIds: string[]}}
 */
export const processReviewDecisions = (pendingApproval, decisions) => {
    let gemsAwarded = 0;
    const approvedIds = [];
    const rejectedIds = [];

    pendingApproval.forEach(chore => {
        const key = chore.approvalId || String(chore.id);
        const decision = decisions[key];

        if (decision === 'pass') {
            gemsAwarded += chore.totalPoints;
            approvedIds.push(key);
        } else if (decision === 'fail') {
            rejectedIds.push(key);
        }
    });

    return { gemsAwarded, approvedIds, rejectedIds };
};

/**
 * Get count of pending approvals for a specific chore
 *
 * @param {Object[]} pendingApproval - Array of pending approvals
 * @param {number} choreId - Chore ID to count
 * @returns {number} Count of pending approvals
 */
export const getPendingCount = (pendingApproval, choreId) => {
    return pendingApproval.filter(p => p.id === choreId).length;
};

/**
 * Check if all chores (excluding multiple type) are completed
 *
 * @param {Object[]} tasks - Array of tasks
 * @param {Object[]} pendingApproval - Array of pending approvals
 * @returns {boolean} True if all non-multiple chores are complete
 */
export const areAllChoresComplete = (tasks, pendingApproval) => {
    const nonMultipleTasks = tasks.filter(t => t.repeatType !== REPEAT_TYPES.MULTIPLE);

    if (nonMultipleTasks.length === 0) return false;
    if (pendingApproval.length > 0) return false;

    return nonMultipleTasks.every(task => task.completed && !task.pendingApproval);
};
