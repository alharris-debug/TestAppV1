/**
 * useFamilyEconomy Hook
 *
 * Main hook for managing the family economy system including:
 * - User profiles and switching
 * - Jobs with cash rewards
 * - Enhanced chores with daily/weekly recurrence
 * - Transactions and balance tracking
 * - Lock/unlock logic
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
    RECURRENCE_TYPE,
    USER_ROLE,
    TRANSACTION_TYPE,
    APPROVAL_STATUS,
    createDefaultUser,
    createDefaultJob,
    createDefaultChore,
    createTransaction,
    createChoreTemplate,
    createJobTemplate,
    createDefaultFamilyState,
    FAMILY_STORAGE_KEY,
    DEFAULT_WEEKLY_RESET_DAY
} from '../schema.js';
import {
    needsReset,
    isCurrentPeriod,
    getStartOfToday,
    isYesterday
} from '../utils/dateTime.js';
import {
    isJobUnlocked,
    getUnlockProgress,
    getCurrentPeriodCompletions,
    canCompleteJob,
    completeJob,
    approveAllCompletions,
    resetJob,
    updateJobLockStatus,
    getJobsNeedingApproval
} from '../utils/jobHelpers.js';
import { addCents, subtractCents } from '../utils/currency.js';

/**
 * Main family economy hook
 * @param {Object} options
 * @param {Object} options.savedState - Previously saved state to restore
 * @param {Object} options.soundSystem - Sound system for audio feedback
 * @returns {Object} Family economy state and actions
 */
export const useFamilyEconomy = ({ savedState, soundSystem } = {}) => {
    // ========== STATE ==========

    // Initialize from saved state or defaults
    const initialState = savedState || createDefaultFamilyState();

    const [users, setUsers] = useState(initialState.users || []);
    const [activeUserId, setActiveUserId] = useState(initialState.activeUserId);
    const [jobs, setJobs] = useState(initialState.jobs || []);
    const [chores, setChores] = useState(initialState.chores || []);
    const [choreTemplates, setChoreTemplates] = useState(initialState.choreTemplates || []);
    const [jobTemplates, setJobTemplates] = useState(initialState.jobTemplates || []);
    const [transactions, setTransactions] = useState(initialState.transactions || []);
    const [redemptionItems, setRedemptionItems] = useState(initialState.redemptionItems || []);
    const [parentPassword, setParentPassword] = useState(initialState.parentPassword);
    const [settings, setSettings] = useState(initialState.settings || {
        weeklyResetDay: DEFAULT_WEEKLY_RESET_DAY,
        currency: 'USD',
        requireApprovalForJobs: true,
        requireApprovalForChores: true
    });

    // UI State
    const [showUserSelector, setShowUserSelector] = useState(false);
    const [showUserEditor, setShowUserEditor] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    // ========== COMPUTED VALUES ==========

    // Active user
    const activeUser = useMemo(() => {
        return users.find(u => u.id === activeUserId) || null;
    }, [users, activeUserId]);

    // Users by role
    const parentUsers = useMemo(() => {
        return users.filter(u => u.role === USER_ROLE.PARENT);
    }, [users]);

    const childUsers = useMemo(() => {
        return users.filter(u => u.role === USER_ROLE.CHILD);
    }, [users]);

    // Active user's chores
    const activeUserChores = useMemo(() => {
        if (!activeUserId) return [];
        return chores.filter(c => c.userId === activeUserId);
    }, [chores, activeUserId]);

    // Active user's jobs
    const activeUserJobs = useMemo(() => {
        if (!activeUserId) return [];
        return jobs.filter(j => j.userId === activeUserId);
    }, [jobs, activeUserId]);

    // Active user's transactions
    const activeUserTransactions = useMemo(() => {
        if (!activeUserId) return [];
        return transactions
            .filter(t => t.userId === activeUserId)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [transactions, activeUserId]);

    // Jobs needing approval (for parents)
    const jobsNeedingApproval = useMemo(() => {
        return getJobsNeedingApproval(jobs);
    }, [jobs]);

    // Weekly reset day from settings
    const weeklyResetDay = settings.weeklyResetDay || DEFAULT_WEEKLY_RESET_DAY;

    // ========== DAILY/WEEKLY RESET EFFECT ==========

    useEffect(() => {
        // Check and perform resets for all chores and jobs
        const today = getStartOfToday().toISOString();

        // Reset chores that need it
        setChores(prevChores =>
            prevChores.map(chore => {
                if (needsReset(chore.lastReset, chore.recurrence, weeklyResetDay)) {
                    return {
                        ...chore,
                        completed: false,
                        pendingApproval: false,
                        completedAt: null,
                        lastReset: today
                    };
                }
                return chore;
            })
        );

        // Reset jobs that need it
        setJobs(prevJobs =>
            prevJobs.map(job => {
                if (needsReset(job.lastReset, job.recurrence, weeklyResetDay)) {
                    return resetJob(job);
                }
                return job;
            })
        );

        // Update streaks for users
        setUsers(prevUsers =>
            prevUsers.map(user => {
                if (user.lastActiveDate && isYesterday(user.lastActiveDate)) {
                    // Streak continues
                    return user;
                } else if (user.lastActiveDate && !isCurrentPeriod(user.lastActiveDate, RECURRENCE_TYPE.DAILY, weeklyResetDay)) {
                    // Streak broken
                    return { ...user, currentStreak: 0 };
                }
                return user;
            })
        );
    }, [weeklyResetDay]);

    // Update job lock status when chores change
    useEffect(() => {
        setJobs(prevJobs =>
            prevJobs.map(job => updateJobLockStatus(job, chores, weeklyResetDay))
        );
    }, [chores, weeklyResetDay]);

    // ========== USER ACTIONS ==========

    /**
     * Add a new user
     */
    const addUser = useCallback((userData) => {
        const newUser = {
            ...createDefaultUser(userData.role),
            ...userData
        };

        setUsers(prev => [...prev, newUser]);

        // If there's no active user, make this user active
        // Or if this is the first child, make them active
        if (!activeUserId || (userData.role === USER_ROLE.CHILD && childUsers.length === 0)) {
            setActiveUserId(newUser.id);
        }

        soundSystem?.buttonClick?.();
        return newUser;
    }, [activeUserId, childUsers.length, soundSystem]);

    /**
     * Update a user
     */
    const updateUser = useCallback((userId, updates) => {
        setUsers(prev =>
            prev.map(user =>
                user.id === userId ? { ...user, ...updates } : user
            )
        );
        soundSystem?.buttonClick?.();
    }, [soundSystem]);

    /**
     * Delete a user
     */
    const deleteUser = useCallback((userId) => {
        setUsers(prev => prev.filter(u => u.id !== userId));

        // Also delete their chores, jobs, and transactions
        setChores(prev => prev.filter(c => c.userId !== userId));
        setJobs(prev => prev.filter(j => j.userId !== userId));
        setTransactions(prev => prev.filter(t => t.userId !== userId));

        // If deleting active user, switch to another
        if (activeUserId === userId) {
            const remaining = users.filter(u => u.id !== userId && u.role === USER_ROLE.CHILD);
            setActiveUserId(remaining.length > 0 ? remaining[0].id : null);
        }

        soundSystem?.buttonClick?.();
    }, [activeUserId, users, soundSystem]);

    /**
     * Switch active user
     */
    const switchUser = useCallback((userId) => {
        setActiveUserId(userId);
        setShowUserSelector(false);
        soundSystem?.tabSwitch?.();
    }, [soundSystem]);

    // ========== CHORE ACTIONS ==========

    /**
     * Add a new chore
     */
    const addChore = useCallback((choreData, userId = activeUserId) => {
        if (!userId) return null;

        const newChore = {
            ...createDefaultChore(userId),
            ...choreData,
            userId
        };

        setChores(prev => [...prev, newChore]);
        soundSystem?.buttonClick?.();
        return newChore;
    }, [activeUserId, soundSystem]);

    /**
     * Update a chore
     */
    const updateChore = useCallback((choreId, updates) => {
        setChores(prev =>
            prev.map(chore =>
                chore.id === choreId ? { ...chore, ...updates } : chore
            )
        );
        soundSystem?.buttonClick?.();
    }, [soundSystem]);

    /**
     * Delete a chore
     */
    const deleteChore = useCallback((choreId) => {
        setChores(prev => prev.filter(c => c.id !== choreId));
        soundSystem?.buttonClick?.();
    }, [soundSystem]);

    /**
     * Complete a chore
     */
    const completeChore = useCallback((choreId) => {
        const chore = chores.find(c => c.id === choreId);
        if (!chore || chore.completed) return;

        setChores(prev =>
            prev.map(c =>
                c.id === choreId
                    ? {
                        ...c,
                        completed: true,
                        pendingApproval: settings.requireApprovalForChores,
                        completedAt: new Date().toISOString()
                    }
                    : c
            )
        );

        // Update user streak
        if (activeUser) {
            const today = new Date().toDateString();
            const wasYesterday = isYesterday(activeUser.lastActiveDate);
            const isNewDay = activeUser.lastActiveDate !== today;

            if (isNewDay) {
                const newStreak = wasYesterday ? activeUser.currentStreak + 1 : 1;
                updateUser(activeUser.id, {
                    currentStreak: newStreak,
                    longestStreak: Math.max(newStreak, activeUser.longestStreak || 0),
                    lastActiveDate: today
                });

                if (newStreak > 1) {
                    soundSystem?.streakBonus?.();
                }
            }
        }

        soundSystem?.taskComplete?.();
    }, [chores, activeUser, settings.requireApprovalForChores, updateUser, soundSystem]);

    /**
     * Approve a chore
     */
    const approveChore = useCallback((choreId, approvedBy) => {
        const chore = chores.find(c => c.id === choreId);
        if (!chore || !chore.pendingApproval) return;

        setChores(prev =>
            prev.map(c =>
                c.id === choreId
                    ? { ...c, pendingApproval: false }
                    : c
            )
        );

        // Award gems to user
        const user = users.find(u => u.id === chore.userId);
        if (user) {
            // For now, chores still award gems (not cash)
            // This keeps the existing gem system intact
        }

        soundSystem?.taskComplete?.();
    }, [chores, users, soundSystem]);

    // ========== TEMPLATE ACTIONS ==========

    /**
     * Add a new chore template
     */
    const addChoreTemplate = useCallback((templateData) => {
        const newTemplate = {
            ...createChoreTemplate(),
            ...templateData
        };
        setChoreTemplates(prev => [...prev, newTemplate]);
        soundSystem?.buttonClick?.();
        return newTemplate;
    }, [soundSystem]);

    /**
     * Update a chore template
     */
    const updateChoreTemplate = useCallback((templateId, updates) => {
        setChoreTemplates(prev =>
            prev.map(t => t.id === templateId ? { ...t, ...updates } : t)
        );
        soundSystem?.buttonClick?.();
    }, [soundSystem]);

    /**
     * Delete a chore template
     */
    const deleteChoreTemplate = useCallback((templateId) => {
        setChoreTemplates(prev => prev.filter(t => t.id !== templateId));
        soundSystem?.buttonClick?.();
    }, [soundSystem]);

    /**
     * Apply a chore template to one or more users
     */
    const applyChoreTemplate = useCallback((templateId, userIds) => {
        const template = choreTemplates.find(t => t.id === templateId);
        if (!template) return [];

        const targetUserIds = Array.isArray(userIds) ? userIds : [userIds];
        const createdChores = [];

        targetUserIds.forEach(userId => {
            const newChore = {
                ...createDefaultChore(userId),
                name: template.name,
                icon: template.icon,
                points: template.points,
                recurrence: template.recurrence,
                templateId: template.id
            };
            createdChores.push(newChore);
        });

        setChores(prev => [...prev, ...createdChores]);
        soundSystem?.taskComplete?.();
        return createdChores;
    }, [choreTemplates, soundSystem]);

    /**
     * Add a new job template
     */
    const addJobTemplate = useCallback((templateData) => {
        const newTemplate = {
            ...createJobTemplate(),
            ...templateData
        };
        setJobTemplates(prev => [...prev, newTemplate]);
        soundSystem?.buttonClick?.();
        return newTemplate;
    }, [soundSystem]);

    /**
     * Update a job template
     */
    const updateJobTemplate = useCallback((templateId, updates) => {
        setJobTemplates(prev =>
            prev.map(t => t.id === templateId ? { ...t, ...updates } : t)
        );
        soundSystem?.buttonClick?.();
    }, [soundSystem]);

    /**
     * Delete a job template
     */
    const deleteJobTemplate = useCallback((templateId) => {
        setJobTemplates(prev => prev.filter(t => t.id !== templateId));
        soundSystem?.buttonClick?.();
    }, [soundSystem]);

    /**
     * Apply a job template to one or more users
     */
    const applyJobTemplate = useCallback((templateId, userIds, createdBy) => {
        const template = jobTemplates.find(t => t.id === templateId);
        if (!template) return [];

        const targetUserIds = Array.isArray(userIds) ? userIds : [userIds];
        const createdJobs = [];

        targetUserIds.forEach(userId => {
            const newJob = {
                ...createDefaultJob(userId, createdBy),
                title: template.title,
                description: template.description,
                icon: template.icon,
                value: template.value,
                recurrence: template.recurrence,
                unlockConditions: { ...template.unlockConditions },
                allowMultipleCompletions: template.allowMultipleCompletions,
                maxCompletionsPerPeriod: template.maxCompletionsPerPeriod,
                requiresApproval: template.requiresApproval,
                templateId: template.id
            };
            // Set initial lock status
            const lockedJob = updateJobLockStatus(newJob, chores, weeklyResetDay);
            createdJobs.push(lockedJob);
        });

        setJobs(prev => [...prev, ...createdJobs]);
        soundSystem?.taskComplete?.();
        return createdJobs;
    }, [jobTemplates, chores, weeklyResetDay, soundSystem]);

    // ========== JOB ACTIONS ==========

    /**
     * Add a new job
     */
    const addJob = useCallback((jobData, userId = activeUserId, createdBy) => {
        if (!userId) return null;

        const newJob = {
            ...createDefaultJob(userId, createdBy),
            ...jobData,
            userId
        };

        // Set initial lock status
        const lockedJob = updateJobLockStatus(newJob, chores, weeklyResetDay);
        setJobs(prev => [...prev, lockedJob]);

        soundSystem?.buttonClick?.();
        return lockedJob;
    }, [activeUserId, chores, weeklyResetDay, soundSystem]);

    /**
     * Update a job
     */
    const updateJob = useCallback((jobId, updates) => {
        setJobs(prev =>
            prev.map(job =>
                job.id === jobId ? { ...job, ...updates } : job
            )
        );
        soundSystem?.buttonClick?.();
    }, [soundSystem]);

    /**
     * Delete a job
     */
    const deleteJob = useCallback((jobId) => {
        setJobs(prev => prev.filter(j => j.id !== jobId));
        soundSystem?.buttonClick?.();
    }, [soundSystem]);

    /**
     * Complete a job (with optional count for multi-completion)
     */
    const completeJobAction = useCallback((jobId, count = 1) => {
        const job = jobs.find(j => j.id === jobId);
        if (!job) return { success: false, reason: 'Job not found' };

        const { canComplete, reason } = canCompleteJob(job, chores, weeklyResetDay);
        if (!canComplete) {
            return { success: false, reason };
        }

        const updatedJob = completeJob(job, count);
        setJobs(prev =>
            prev.map(j => j.id === jobId ? updatedJob : j)
        );

        // Update user's pending balance if requires approval
        if (job.requiresApproval) {
            const earned = job.value * count;
            const user = users.find(u => u.id === job.userId);
            if (user) {
                updateUser(user.id, {
                    pendingBalance: addCents(user.pendingBalance, earned)
                });
            }
        } else {
            // Auto-approved - add directly to balance
            const earned = job.value * count;
            const user = users.find(u => u.id === job.userId);
            if (user) {
                updateUser(user.id, {
                    cashBalance: addCents(user.cashBalance, earned)
                });

                // Create transaction
                const txn = createTransaction(
                    user.id,
                    TRANSACTION_TYPE.EARN,
                    earned,
                    `${job.title}${count > 1 ? ` (${count}×)` : ''}`
                );
                txn.jobId = job.id;
                txn.completionCount = count;
                txn.status = APPROVAL_STATUS.APPROVED;
                setTransactions(prev => [...prev, txn]);
            }
        }

        soundSystem?.purchase?.();
        return { success: true, earned: job.value * count, jobTitle: job.title };
    }, [jobs, chores, weeklyResetDay, users, updateUser, soundSystem]);

    /**
     * Approve all pending completions for a job
     */
    const approveJob = useCallback((jobId, approvedBy) => {
        const job = jobs.find(j => j.id === jobId);
        if (!job) return { success: false };

        const { job: updatedJob, totalApproved } = approveAllCompletions(job, approvedBy);

        setJobs(prev =>
            prev.map(j => j.id === jobId ? updatedJob : j)
        );

        // Move pending to actual balance
        const user = users.find(u => u.id === job.userId);
        if (user && totalApproved > 0) {
            updateUser(user.id, {
                cashBalance: addCents(user.cashBalance, totalApproved),
                pendingBalance: subtractCents(user.pendingBalance, totalApproved)
            });

            // Create transaction
            const pendingCompletions = job.completions.filter(c => c.status === APPROVAL_STATUS.PENDING);
            const totalCount = pendingCompletions.reduce((sum, c) => sum + c.count, 0);

            const txn = createTransaction(
                user.id,
                TRANSACTION_TYPE.EARN,
                totalApproved,
                `${job.title}${totalCount > 1 ? ` (${totalCount}×)` : ''}`
            );
            txn.jobId = job.id;
            txn.completionCount = totalCount;
            txn.approvedBy = approvedBy;
            txn.status = APPROVAL_STATUS.APPROVED;
            setTransactions(prev => [...prev, txn]);
        }

        soundSystem?.taskComplete?.();
        return { success: true, totalApproved };
    }, [jobs, users, updateUser, soundSystem]);

    /**
     * Reject all pending completions for a job
     */
    const rejectJob = useCallback((jobId, rejectedBy) => {
        const job = jobs.find(j => j.id === jobId);
        if (!job) return;

        // Calculate total that was pending
        const totalPending = job.completions
            .filter(c => c.status === APPROVAL_STATUS.PENDING)
            .reduce((sum, c) => sum + c.totalEarned, 0);

        // Update job - mark all pending as rejected
        setJobs(prev =>
            prev.map(j => {
                if (j.id !== jobId) return j;
                return {
                    ...j,
                    completions: j.completions.map(c =>
                        c.status === APPROVAL_STATUS.PENDING
                            ? { ...c, status: APPROVAL_STATUS.REJECTED, approvedBy: rejectedBy, approvedAt: new Date().toISOString() }
                            : c
                    )
                };
            })
        );

        // Remove from pending balance
        const user = users.find(u => u.id === job.userId);
        if (user && totalPending > 0) {
            updateUser(user.id, {
                pendingBalance: subtractCents(user.pendingBalance, totalPending)
            });
        }

        soundSystem?.defeat?.();
    }, [jobs, users, updateUser, soundSystem]);

    // ========== TRANSACTION ACTIONS ==========

    /**
     * Redeem cash for a reward
     */
    const redeemCash = useCallback((userId, amount, description) => {
        const user = users.find(u => u.id === userId);
        if (!user || user.cashBalance < amount) {
            return { success: false, reason: 'Insufficient balance' };
        }

        // Deduct from balance
        updateUser(userId, {
            cashBalance: subtractCents(user.cashBalance, amount)
        });

        // Create transaction
        const txn = createTransaction(
            userId,
            TRANSACTION_TYPE.REDEEM,
            -amount, // Negative for redemption
            description
        );
        setTransactions(prev => [...prev, txn]);

        soundSystem?.purchase?.();
        return { success: true };
    }, [users, updateUser, soundSystem]);

    /**
     * Add a manual balance adjustment (parent only)
     */
    const adjustBalance = useCallback((userId, amount, description, adjustedBy) => {
        const user = users.find(u => u.id === userId);
        if (!user) return;

        updateUser(userId, {
            cashBalance: addCents(user.cashBalance, amount)
        });

        const txn = createTransaction(
            userId,
            TRANSACTION_TYPE.ADJUST,
            amount,
            description
        );
        txn.approvedBy = adjustedBy;
        txn.status = APPROVAL_STATUS.APPROVED;
        setTransactions(prev => [...prev, txn]);

        soundSystem?.buttonClick?.();
    }, [users, updateUser, soundSystem]);

    // ========== PERSISTENCE ==========

    /**
     * Get current state for saving
     */
    const getState = useCallback(() => ({
        users,
        activeUserId,
        jobs,
        chores,
        choreTemplates,
        jobTemplates,
        transactions,
        redemptionItems,
        parentPassword,
        settings,
        lastSaved: new Date().toISOString()
    }), [users, activeUserId, jobs, chores, choreTemplates, jobTemplates, transactions, redemptionItems, parentPassword, settings]);

    /**
     * Save state to localStorage
     */
    const saveState = useCallback(() => {
        try {
            const state = getState();
            localStorage.setItem(FAMILY_STORAGE_KEY, JSON.stringify(state));
            return true;
        } catch (e) {
            console.error('Failed to save family economy state:', e);
            return false;
        }
    }, [getState]);

    // Auto-save on state changes
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            saveState();
        }, 500); // Debounce saves

        return () => clearTimeout(timeoutId);
    }, [users, activeUserId, jobs, chores, choreTemplates, jobTemplates, transactions, redemptionItems, parentPassword, settings, saveState]);

    // ========== RETURN ==========

    return {
        // State
        users,
        activeUser,
        activeUserId,
        parentUsers,
        childUsers,
        jobs,
        chores,
        choreTemplates,
        jobTemplates,
        transactions,
        redemptionItems,
        parentPassword,
        settings,

        // Filtered data
        activeUserChores,
        activeUserJobs,
        activeUserTransactions,
        jobsNeedingApproval,

        // UI State
        showUserSelector,
        setShowUserSelector,
        showUserEditor,
        setShowUserEditor,
        editingUser,
        setEditingUser,

        // User actions
        addUser,
        updateUser,
        deleteUser,
        switchUser,

        // Chore actions
        addChore,
        updateChore,
        deleteChore,
        completeChore,
        approveChore,

        // Job actions
        addJob,
        updateJob,
        deleteJob,
        completeJob: completeJobAction,
        approveJob,
        rejectJob,

        // Template actions
        addChoreTemplate,
        updateChoreTemplate,
        deleteChoreTemplate,
        applyChoreTemplate,
        addJobTemplate,
        updateJobTemplate,
        deleteJobTemplate,
        applyJobTemplate,

        // Transaction actions
        redeemCash,
        adjustBalance,

        // Settings
        setParentPassword,
        setSettings,
        setRedemptionItems,

        // Helpers
        getUnlockProgress: (job) => getUnlockProgress(job, chores, weeklyResetDay),
        canCompleteJob: (job) => canCompleteJob(job, chores, weeklyResetDay),
        getCurrentPeriodCompletions: (job) => getCurrentPeriodCompletions(job, weeklyResetDay),

        // Persistence
        getState,
        saveState
    };
};

/**
 * Load saved family economy state from localStorage
 */
export const loadFamilyEconomyState = () => {
    try {
        const saved = localStorage.getItem(FAMILY_STORAGE_KEY);
        if (!saved) return null;

        const data = JSON.parse(saved);

        // Basic validation
        if (typeof data !== 'object' || data === null) {
            return null;
        }

        // Ensure arrays exist
        data.users = Array.isArray(data.users) ? data.users : [];
        data.jobs = Array.isArray(data.jobs) ? data.jobs : [];
        data.chores = Array.isArray(data.chores) ? data.chores : [];
        data.choreTemplates = Array.isArray(data.choreTemplates) ? data.choreTemplates : [];
        data.jobTemplates = Array.isArray(data.jobTemplates) ? data.jobTemplates : [];
        data.transactions = Array.isArray(data.transactions) ? data.transactions : [];
        data.redemptionItems = Array.isArray(data.redemptionItems) ? data.redemptionItems : [];

        return data;
    } catch (e) {
        console.error('Failed to load family economy state:', e);
        return null;
    }
};

export default useFamilyEconomy;
