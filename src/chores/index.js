/**
 * Chore Management System
 *
 * A complete, modular chore management system for the ChoreQuest application.
 *
 * Features:
 * - CRUD operations for chores (Create, Read, Update, Delete)
 * - Parent approval workflow with streak bonuses
 * - Three repeat modes (once, daily, multiple)
 * - Save chores for later functionality
 * - 9-dot pattern lock security for parent access
 * - Automatic daily reset
 * - localStorage persistence
 * - Streak tracking system
 *
 * Usage:
 * ```javascript
 * import {
 *   useChoreManagement,
 *   usePatternLock,
 *   ChoreList,
 *   ChoreEditorModal,
 *   ChoreManagementModal,
 *   ParentReviewModal,
 *   PasswordSetupModal,
 *   PasswordEntryModal,
 *   INITIAL_TASKS,
 *   CHORE_ICONS,
 *   REPEAT_TYPES
 * } from './chores';
 *
 * // In your component:
 * const choreManager = useChoreManagement({
 *   initialTasks: savedGame?.tasks,
 *   initialSavedChores: savedGame?.savedChores,
 *   onGemsAwarded: (gems) => setGems(g => g + gems)
 * });
 *
 * const patternLock = usePatternLock({
 *   storedPassword: choreManager.parentPassword,
 *   onPasswordSet: choreManager.setParentPassword,
 *   onVerificationSuccess: () => choreManager.openChoreManagement()
 * });
 * ```
 */

// Constants
export {
    INITIAL_TASKS,
    CHORE_ICONS,
    REPEAT_TYPES,
    DEFAULT_CHORE_FORM,
    PATTERN_LOCK_CONFIG,
    STORAGE_KEY
} from './constants.js';

// Hooks
export { useChoreManagement, default as useChoreManagementHook } from './hooks/useChoreManagement.js';
export { usePatternLock, default as usePatternLockHook } from './hooks/usePatternLock.js';

// Components
export {
    ChoreCard,
    ManagementChoreCard,
    SavedChoreCard,
    GemIcon
} from './components/ChoreCard.jsx';

export { ChoreList, default as ChoreListComponent } from './components/ChoreList.jsx';

export {
    ChoreEditorModal,
    IconPicker,
    RepeatTypeSelector
} from './components/ChoreEditor.jsx';

export {
    ChoreManagementModal,
    ManagementTabs,
    ActiveChoresTab,
    SavedChoresTab
} from './components/ChoreManagement.jsx';

export {
    ParentReviewModal,
    ReviewCard
} from './components/ParentReview.jsx';

export {
    PatternLockGrid,
    PasswordSetupModal,
    PasswordEntryModal
} from './components/PatternLock.jsx';

// Utilities
export {
    getDotCenter,
    getPatternPath,
    verifyPattern,
    isPointNearDot,
    getPointerCoordinates,
    getRelativePosition,
    isPatternValid
} from './utils/patternLock.js';

export {
    createChore,
    createPendingApproval,
    canCompleteChore,
    resetDailyTasks,
    updateChore,
    calculateStreak,
    processReviewDecisions,
    getPendingCount,
    areAllChoresComplete
} from './utils/choreHelpers.js';

export {
    saveChoreState,
    loadChoreState,
    clearChoreState,
    extractChoreState,
    mergeChoreState
} from './utils/storage.js';

// Default export for convenience
export default {
    // Hooks
    useChoreManagement: null, // Will be set dynamically if needed
    usePatternLock: null,

    // Constants
    INITIAL_TASKS: null,
    CHORE_ICONS: null,
    REPEAT_TYPES: null
};
