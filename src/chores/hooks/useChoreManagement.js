/**
 * useChoreManagement Hook
 *
 * Custom React hook for managing chore state and operations.
 * Provides CRUD operations for chores, approval workflow, and streak management.
 */

import { useState, useCallback, useEffect } from 'react';
import {
    createChore,
    createPendingApproval,
    canCompleteChore,
    resetDailyTasks,
    updateChore as updateChoreHelper,
    calculateStreak,
    processReviewDecisions,
    getPendingCount,
    areAllChoresComplete
} from '../utils/choreHelpers.js';
import { INITIAL_TASKS, DEFAULT_CHORE_FORM } from '../constants.js';

/**
 * Hook for chore management functionality
 *
 * @param {Object} options - Hook options
 * @param {Object[]} [options.initialTasks] - Initial tasks array
 * @param {Object[]} [options.initialSavedChores] - Initial saved chores array
 * @param {Object[]} [options.initialPendingApproval] - Initial pending approvals array
 * @param {number[]} [options.initialParentPassword] - Initial parent password
 * @param {number} [options.initialStreak] - Initial streak count
 * @param {string} [options.initialLastPlayDate] - Initial last play date
 * @param {Function} [options.onGemsAwarded] - Callback when gems are awarded
 * @param {Object} [options.soundSystem] - Optional sound system for audio feedback
 * @returns {Object} Chore management state and handlers
 */
export const useChoreManagement = ({
    initialTasks,
    initialSavedChores = [],
    initialPendingApproval = [],
    initialParentPassword = null,
    initialStreak = 0,
    initialLastPlayDate = null,
    onGemsAwarded,
    soundSystem
}) => {
    // Core state
    const [tasks, setTasks] = useState(initialTasks || INITIAL_TASKS);
    const [savedChores, setSavedChores] = useState(initialSavedChores);
    const [pendingApproval, setPendingApproval] = useState(initialPendingApproval);
    const [parentPassword, setParentPassword] = useState(initialParentPassword);
    const [streak, setStreak] = useState(initialStreak);
    const [lastPlayDate, setLastPlayDate] = useState(initialLastPlayDate);

    // UI state
    const [showChoreManagement, setShowChoreManagement] = useState(false);
    const [showChoreEditor, setShowChoreEditor] = useState(false);
    const [showParentReview, setShowParentReview] = useState(false);
    const [choreManagementTab, setChoreManagementTab] = useState('active');
    const [editingChore, setEditingChore] = useState(null);
    const [choreForm, setChoreForm] = useState(DEFAULT_CHORE_FORM);
    const [reviewDecisions, setReviewDecisions] = useState({});

    // Daily reset effect
    useEffect(() => {
        const today = new Date().toDateString();

        if (lastPlayDate && lastPlayDate !== today) {
            // Reset tasks for new day
            setTasks(prevTasks => resetDailyTasks(prevTasks));

            // Update streak
            const newStreak = calculateStreak(lastPlayDate, streak);
            setStreak(newStreak);

            if (newStreak > streak && soundSystem?.streakBonus) {
                soundSystem.streakBonus();
            }
        }

        setLastPlayDate(today);
    }, [lastPlayDate, streak, soundSystem]);

    /**
     * Toggle task completion
     */
    const toggleTask = useCallback((taskId) => {
        const task = tasks.find(t => t.id === taskId);
        if (!canCompleteChore(task)) return;

        // Create pending approval entry
        const approval = createPendingApproval(task, streak);
        setPendingApproval(prev => [...prev, approval]);

        // Update task state (mark completed for non-multiple types)
        if (task.repeatType !== 'multiple') {
            setTasks(prevTasks =>
                prevTasks.map(t =>
                    t.id === taskId
                        ? { ...t, completed: true, pendingApproval: true }
                        : t
                )
            );
        }

        if (soundSystem?.buttonClick) {
            soundSystem.buttonClick();
        }
    }, [tasks, streak, soundSystem]);

    /**
     * Add a new chore
     */
    const addNewChore = useCallback(() => {
        if (!choreForm.name.trim()) return;

        const newChore = createChore(choreForm);
        setTasks(prev => [...prev, newChore]);
        setChoreForm(DEFAULT_CHORE_FORM);
        setShowChoreEditor(false);

        if (soundSystem?.buttonClick) {
            soundSystem.buttonClick();
        }
    }, [choreForm, soundSystem]);

    /**
     * Update an existing chore
     */
    const updateChore = useCallback(() => {
        if (!editingChore) return;

        setTasks(prev =>
            prev.map(task =>
                task.id === editingChore.id
                    ? updateChoreHelper(task, choreForm)
                    : task
            )
        );

        setEditingChore(null);
        setShowChoreEditor(false);
        setChoreForm(DEFAULT_CHORE_FORM);

        if (soundSystem?.buttonClick) {
            soundSystem.buttonClick();
        }
    }, [editingChore, choreForm, soundSystem]);

    /**
     * Delete a chore
     */
    const deleteChore = useCallback((choreId) => {
        setTasks(prev => prev.filter(t => t.id !== choreId));
        setPendingApproval(prev => prev.filter(t => t.id !== choreId));

        if (soundSystem?.buttonClick) {
            soundSystem.buttonClick();
        }
    }, [soundSystem]);

    /**
     * Save a chore for later
     */
    const saveChoreForLater = useCallback((choreId) => {
        const chore = tasks.find(t => t.id === choreId);
        if (!chore) return;

        setSavedChores(prev => [...prev, { ...chore, completed: false }]);
        setTasks(prev => prev.filter(t => t.id !== choreId));

        if (soundSystem?.buttonClick) {
            soundSystem.buttonClick();
        }
    }, [tasks, soundSystem]);

    /**
     * Restore a saved chore to active
     */
    const restoreChore = useCallback((choreId) => {
        const chore = savedChores.find(c => c.id === choreId);
        if (!chore) return;

        setTasks(prev => [...prev, { ...chore, completed: false }]);
        setSavedChores(prev => prev.filter(c => c.id !== choreId));

        if (soundSystem?.buttonClick) {
            soundSystem.buttonClick();
        }
    }, [savedChores, soundSystem]);

    /**
     * Delete a saved chore
     */
    const deleteSavedChore = useCallback((choreId) => {
        setSavedChores(prev => prev.filter(c => c.id !== choreId));

        if (soundSystem?.buttonClick) {
            soundSystem.buttonClick();
        }
    }, [soundSystem]);

    /**
     * Open chore editor (for new or existing chore)
     */
    const openChoreEditor = useCallback((chore = null) => {
        if (chore) {
            setEditingChore(chore);
            setChoreForm({
                name: chore.name,
                icon: chore.icon,
                points: chore.points,
                repeatType: chore.repeatType || 'daily'
            });
        } else {
            setEditingChore(null);
            setChoreForm(DEFAULT_CHORE_FORM);
        }
        setShowChoreEditor(true);
    }, []);

    /**
     * Close chore editor
     */
    const closeChoreEditor = useCallback(() => {
        setShowChoreEditor(false);
        setEditingChore(null);
        setChoreForm(DEFAULT_CHORE_FORM);
    }, []);

    /**
     * Set review decision for a pending approval
     */
    const setReviewDecision = useCallback((approvalKey, decision) => {
        setReviewDecisions(prev => ({ ...prev, [approvalKey]: decision }));
    }, []);

    /**
     * Submit all review decisions
     */
    const submitReviews = useCallback(() => {
        const { gemsAwarded, approvedIds, rejectedIds } = processReviewDecisions(
            pendingApproval,
            reviewDecisions
        );

        // Award gems
        if (gemsAwarded > 0 && onGemsAwarded) {
            onGemsAwarded(gemsAwarded);

            if (soundSystem?.taskComplete) {
                soundSystem.taskComplete();
            }
        }

        // Get reviewed chore IDs
        const reviewedTaskIds = new Set(
            pendingApproval
                .filter(p => {
                    const key = p.approvalId || String(p.id);
                    return approvedIds.includes(key) || rejectedIds.includes(key);
                })
                .map(p => p.id)
        );

        // Update task states
        setTasks(prev =>
            prev.map(task => {
                if (!reviewedTaskIds.has(task.id) || task.repeatType === 'multiple') {
                    return task;
                }

                const approval = pendingApproval.find(p => p.id === task.id);
                const key = approval?.approvalId || String(task.id);

                if (rejectedIds.includes(key)) {
                    // Failed - reset to incomplete
                    return { ...task, completed: false, pendingApproval: false };
                }

                // Passed - mark as fully completed
                return { ...task, pendingApproval: false };
            })
        );

        // Remove reviewed items from pending
        setPendingApproval(prev =>
            prev.filter(p => {
                const key = p.approvalId || String(p.id);
                return !approvedIds.includes(key) && !rejectedIds.includes(key);
            })
        );

        // Close review modal and reset decisions
        setShowParentReview(false);
        setReviewDecisions({});
    }, [pendingApproval, reviewDecisions, onGemsAwarded, soundSystem]);

    /**
     * Open parent review modal
     */
    const openParentReview = useCallback(() => {
        setReviewDecisions({});
        setShowParentReview(true);
    }, []);

    /**
     * Close parent review modal
     */
    const closeParentReview = useCallback(() => {
        setShowParentReview(false);
        setReviewDecisions({});
    }, []);

    /**
     * Open chore management modal
     */
    const openChoreManagement = useCallback(() => {
        setShowChoreManagement(true);
    }, []);

    /**
     * Close chore management modal
     */
    const closeChoreManagement = useCallback(() => {
        setShowChoreManagement(false);
    }, []);

    /**
     * Reset parent password
     */
    const resetParentPassword = useCallback(() => {
        setParentPassword(null);
    }, []);

    // Computed values
    const hasPendingChores = pendingApproval.length > 0;
    const allChoresComplete = areAllChoresComplete(tasks, pendingApproval);
    const reviewProgress = Object.keys(reviewDecisions).length;
    const reviewTotal = pendingApproval.length;
    const canSubmitReviews = reviewProgress === reviewTotal && reviewTotal > 0;

    return {
        // Core state
        tasks,
        savedChores,
        pendingApproval,
        parentPassword,
        streak,
        lastPlayDate,

        // UI state
        showChoreManagement,
        showChoreEditor,
        showParentReview,
        choreManagementTab,
        editingChore,
        choreForm,
        reviewDecisions,

        // Computed values
        hasPendingChores,
        allChoresComplete,
        reviewProgress,
        reviewTotal,
        canSubmitReviews,

        // State setters
        setTasks,
        setSavedChores,
        setPendingApproval,
        setParentPassword,
        setStreak,
        setChoreManagementTab,
        setChoreForm,

        // Actions
        toggleTask,
        addNewChore,
        updateChore,
        deleteChore,
        saveChoreForLater,
        restoreChore,
        deleteSavedChore,
        openChoreEditor,
        closeChoreEditor,
        setReviewDecision,
        submitReviews,
        openParentReview,
        closeParentReview,
        openChoreManagement,
        closeChoreManagement,
        resetParentPassword,

        // Utilities
        getPendingCount: (choreId) => getPendingCount(pendingApproval, choreId),

        // For persistence
        getState: () => ({
            tasks,
            savedChores,
            pendingApproval,
            parentPassword,
            streak,
            lastPlayDate
        })
    };
};

export default useChoreManagement;
