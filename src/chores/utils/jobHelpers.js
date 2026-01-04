/**
 * Job Helper Utility Functions
 *
 * Handles job-related operations including:
 * - Lock/unlock logic based on chore completion
 * - Job completion and tracking
 * - Multiple completion events
 * - Job reset logic
 */

import {
    RECURRENCE_TYPE,
    APPROVAL_STATUS,
    createTransaction,
    TRANSACTION_TYPE
} from '../schema.js';
import { needsReset, isCurrentPeriod } from './dateTime.js';
import { multiplyCents } from './currency.js';

/**
 * Count completed chores by recurrence type for a user
 * @param {Object[]} chores - All chores
 * @param {string} userId - User ID
 * @param {string} recurrence - 'daily' or 'weekly'
 * @param {number} resetDay - Weekly reset day
 * @returns {number} Count of completed chores
 */
export const countCompletedChores = (chores, userId, recurrence, resetDay) => {
    return chores.filter(chore =>
        chore.userId === userId &&
        chore.recurrence === recurrence &&
        chore.completed &&
        !chore.pendingApproval &&
        isCurrentPeriod(chore.completedAt, recurrence, resetDay)
    ).length;
};

/**
 * Count total chores for a user by recurrence type
 * @param {Object[]} chores - All chores
 * @param {string} userId - User ID
 * @param {string} recurrence - 'daily' or 'weekly'
 * @returns {number} Total count of chores
 */
export const countTotalChores = (chores, userId, recurrence) => {
    return chores.filter(chore =>
        chore.userId === userId &&
        chore.recurrence === recurrence
    ).length;
};

/**
 * Check if all chores are completed for a user
 * @param {Object[]} chores - All chores
 * @param {string} userId - User ID
 * @param {number} resetDay - Weekly reset day
 * @returns {boolean} Whether all chores are completed
 */
export const areAllChoresCompleted = (chores, userId, resetDay) => {
    const userChores = chores.filter(c => c.userId === userId);
    if (userChores.length === 0) return true; // No chores = unlocked

    return userChores.every(chore =>
        chore.completed &&
        !chore.pendingApproval &&
        isCurrentPeriod(chore.completedAt, chore.recurrence, resetDay)
    );
};

/**
 * Check if a job is unlocked based on chore completion
 * @param {Object} job - Job to check
 * @param {Object[]} chores - All chores
 * @param {number} resetDay - Weekly reset day
 * @returns {boolean} Whether job is unlocked
 */
export const isJobUnlocked = (job, chores, resetDay) => {
    const { unlockConditions, userId } = job;

    // If no unlock conditions, job is always unlocked
    if (!unlockConditions) return true;

    // Check if "all chores required" is set
    if (unlockConditions.requireAllChores) {
        return areAllChoresCompleted(chores, userId, resetDay);
    }

    // Legacy: check by count
    if (unlockConditions.dailyChores === 0 && unlockConditions.weeklyChores === 0) {
        return true;
    }

    // Count completed daily chores
    const dailyCompleted = countCompletedChores(
        chores,
        userId,
        RECURRENCE_TYPE.DAILY,
        resetDay
    );

    // Count completed weekly chores
    const weeklyCompleted = countCompletedChores(
        chores,
        userId,
        RECURRENCE_TYPE.WEEKLY,
        resetDay
    );

    // Check if conditions are met
    const dailyMet = dailyCompleted >= (unlockConditions.dailyChores || 0);
    const weeklyMet = weeklyCompleted >= (unlockConditions.weeklyChores || 0);

    return dailyMet && weeklyMet;
};

/**
 * Get unlock progress for a job
 * @param {Object} job - Job to check
 * @param {Object[]} chores - All chores
 * @param {number} resetDay - Weekly reset day
 * @returns {{ dailyProgress: { current: number, required: number }, weeklyProgress: { current: number, required: number }, isUnlocked: boolean }}
 */
export const getUnlockProgress = (job, chores, resetDay) => {
    const { unlockConditions, userId } = job;

    const dailyRequired = unlockConditions?.dailyChores || 0;
    const weeklyRequired = unlockConditions?.weeklyChores || 0;

    const dailyCurrent = countCompletedChores(
        chores,
        userId,
        RECURRENCE_TYPE.DAILY,
        resetDay
    );

    const weeklyCurrent = countCompletedChores(
        chores,
        userId,
        RECURRENCE_TYPE.WEEKLY,
        resetDay
    );

    return {
        dailyProgress: {
            current: Math.min(dailyCurrent, dailyRequired),
            required: dailyRequired
        },
        weeklyProgress: {
            current: Math.min(weeklyCurrent, weeklyRequired),
            required: weeklyRequired
        },
        isUnlocked: isJobUnlocked(job, chores, resetDay)
    };
};

/**
 * Get completion count for current period
 * @param {Object} job - Job to check
 * @param {number} resetDay - Weekly reset day
 * @returns {number} Number of completions this period
 */
export const getCurrentPeriodCompletions = (job, resetDay) => {
    return job.completions
        .filter(c => isCurrentPeriod(c.timestamp, job.recurrence, resetDay))
        .reduce((sum, c) => sum + c.count, 0);
};

/**
 * Check if job can be completed
 * @param {Object} job - Job to check
 * @param {Object[]} chores - All chores
 * @param {number} resetDay - Weekly reset day
 * @returns {{ canComplete: boolean, reason: string | null }}
 */
export const canCompleteJob = (job, chores, resetDay) => {
    // Check if locked
    if (!isJobUnlocked(job, chores, resetDay)) {
        return { canComplete: false, reason: 'Job is locked. Complete more chores to unlock.' };
    }

    // Check if max completions reached
    if (job.maxCompletionsPerPeriod !== null) {
        const currentCount = getCurrentPeriodCompletions(job, resetDay);
        if (currentCount >= job.maxCompletionsPerPeriod) {
            return {
                canComplete: false,
                reason: `Maximum ${job.maxCompletionsPerPeriod} completions reached for this period.`
            };
        }
    }

    // For non-multiple completion jobs, check if already completed
    if (!job.allowMultipleCompletions) {
        const currentCount = getCurrentPeriodCompletions(job, resetDay);
        if (currentCount > 0) {
            return { canComplete: false, reason: 'Already completed this period.' };
        }
    }

    return { canComplete: true, reason: null };
};

/**
 * Create a job completion event
 * @param {Object} job - Job being completed
 * @param {number} count - Number of completions (default 1)
 * @returns {Object} Completion event
 */
export const createCompletionEvent = (job, count = 1) => {
    const totalEarned = multiplyCents(job.value, count);

    return {
        id: `completion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        count,
        valueAtCompletion: job.value,
        totalEarned,
        status: job.requiresApproval ? APPROVAL_STATUS.PENDING : APPROVAL_STATUS.APPROVED,
        approvedBy: null,
        approvedAt: null
    };
};

/**
 * Complete a job
 * @param {Object} job - Job to complete
 * @param {number} count - Number of completions (default 1)
 * @returns {Object} Updated job with new completion
 */
export const completeJob = (job, count = 1) => {
    const completion = createCompletionEvent(job, count);

    return {
        ...job,
        completions: [...job.completions, completion]
    };
};

/**
 * Get total pending earnings for a job
 * @param {Object} job - Job to check
 * @returns {number} Total pending earnings in cents
 */
export const getPendingEarnings = (job) => {
    return job.completions
        .filter(c => c.status === APPROVAL_STATUS.PENDING)
        .reduce((sum, c) => sum + c.totalEarned, 0);
};

/**
 * Get total approved earnings for a job (current period)
 * @param {Object} job - Job to check
 * @param {number} resetDay - Weekly reset day
 * @returns {number} Total approved earnings in cents
 */
export const getApprovedEarnings = (job, resetDay) => {
    return job.completions
        .filter(c =>
            c.status === APPROVAL_STATUS.APPROVED &&
            isCurrentPeriod(c.timestamp, job.recurrence, resetDay)
        )
        .reduce((sum, c) => sum + c.totalEarned, 0);
};

/**
 * Approve a job completion
 * @param {Object} job - Job with completion to approve
 * @param {string} completionId - ID of completion to approve
 * @param {string} approvedBy - Parent user ID
 * @returns {Object} Updated job
 */
export const approveCompletion = (job, completionId, approvedBy) => {
    return {
        ...job,
        completions: job.completions.map(c =>
            c.id === completionId
                ? {
                    ...c,
                    status: APPROVAL_STATUS.APPROVED,
                    approvedBy,
                    approvedAt: new Date().toISOString()
                }
                : c
        )
    };
};

/**
 * Reject a job completion
 * @param {Object} job - Job with completion to reject
 * @param {string} completionId - ID of completion to reject
 * @param {string} rejectedBy - Parent user ID
 * @returns {Object} Updated job
 */
export const rejectCompletion = (job, completionId, rejectedBy) => {
    return {
        ...job,
        completions: job.completions.map(c =>
            c.id === completionId
                ? {
                    ...c,
                    status: APPROVAL_STATUS.REJECTED,
                    approvedBy: rejectedBy,
                    approvedAt: new Date().toISOString()
                }
                : c
        )
    };
};

/**
 * Approve all pending completions for a job
 * @param {Object} job - Job to approve all completions
 * @param {string} approvedBy - Parent user ID
 * @returns {{ job: Object, totalApproved: number }}
 */
export const approveAllCompletions = (job, approvedBy) => {
    let totalApproved = 0;

    const updatedJob = {
        ...job,
        completions: job.completions.map(c => {
            if (c.status === APPROVAL_STATUS.PENDING) {
                totalApproved += c.totalEarned;
                return {
                    ...c,
                    status: APPROVAL_STATUS.APPROVED,
                    approvedBy,
                    approvedAt: new Date().toISOString()
                };
            }
            return c;
        })
    };

    return { job: updatedJob, totalApproved };
};

/**
 * Reset a job for a new period
 * @param {Object} job - Job to reset
 * @returns {Object} Reset job
 */
export const resetJob = (job) => {
    return {
        ...job,
        completions: [],
        lastReset: new Date().toISOString()
    };
};

/**
 * Check and reset job if needed
 * @param {Object} job - Job to check
 * @param {number} resetDay - Weekly reset day
 * @returns {Object} Job (possibly reset)
 */
export const checkAndResetJob = (job, resetDay) => {
    if (needsReset(job.lastReset, job.recurrence, resetDay)) {
        return resetJob(job);
    }
    return job;
};

/**
 * Update job lock status based on chore completion
 * @param {Object} job - Job to update
 * @param {Object[]} chores - All chores
 * @param {number} resetDay - Weekly reset day
 * @returns {Object} Updated job with correct lock status
 */
export const updateJobLockStatus = (job, chores, resetDay) => {
    const isUnlocked = isJobUnlocked(job, chores, resetDay);
    return {
        ...job,
        isLocked: !isUnlocked
    };
};

/**
 * Get jobs that need attention (pending approval)
 * @param {Object[]} jobs - All jobs
 * @returns {Object[]} Jobs with pending completions
 */
export const getJobsNeedingApproval = (jobs) => {
    return jobs.filter(job =>
        job.completions.some(c => c.status === APPROVAL_STATUS.PENDING)
    );
};

/**
 * Calculate total value for multiple completions
 * @param {number} valuePerCompletion - Value in cents per completion
 * @param {number} count - Number of completions
 * @returns {number} Total value in cents
 */
export const calculateTotalValue = (valuePerCompletion, count) => {
    return multiplyCents(valuePerCompletion, count);
};

/**
 * Get completion display text
 * @param {Object} job - Job to display
 * @param {number} resetDay - Weekly reset day
 * @returns {string} Display text (e.g., "3/∞" or "2/4")
 */
export const getCompletionDisplayText = (job, resetDay) => {
    const current = getCurrentPeriodCompletions(job, resetDay);

    if (!job.allowMultipleCompletions) {
        return current > 0 ? '✓' : '';
    }

    const max = job.maxCompletionsPerPeriod;
    return max !== null ? `${current}/${max}` : `${current}×`;
};

export default {
    countCompletedChores,
    isJobUnlocked,
    getUnlockProgress,
    getCurrentPeriodCompletions,
    canCompleteJob,
    createCompletionEvent,
    completeJob,
    getPendingEarnings,
    getApprovedEarnings,
    approveCompletion,
    rejectCompletion,
    approveAllCompletions,
    resetJob,
    checkAndResetJob,
    updateJobLockStatus,
    getJobsNeedingApproval,
    calculateTotalValue,
    getCompletionDisplayText
};
