/**
 * Chore Management System & Family Economy
 *
 * A complete, modular chore management and family economy system.
 *
 * Features:
 * - CRUD operations for chores and jobs
 * - Parent approval workflow with streak bonuses
 * - Daily/weekly recurrence for chores and jobs
 * - Job lock/unlock based on chore completion
 * - Multiple completion events for jobs
 * - Cash balance and transaction tracking
 * - Multi-user profiles (parents and children)
 * - 9-dot pattern lock security for parent access
 * - localStorage persistence
 *
 * Usage:
 * ```javascript
 * import {
 *   useChoreManagement,
 *   usePatternLock,
 *   useFamilyEconomy,
 *   ChoreList,
 *   JobList,
 *   TransactionHistory,
 *   INITIAL_TASKS,
 *   CHORE_ICONS
 * } from './chores';
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

// Schema and Types
export {
    RECURRENCE_TYPE,
    USER_ROLE,
    TRANSACTION_TYPE,
    APPROVAL_STATUS,
    createDefaultUser,
    createDefaultJob,
    createDefaultChore,
    createTransaction
} from './schema.js';

// Hooks
export { useChoreManagement, default as useChoreManagementHook } from './hooks/useChoreManagement.js';
export { usePatternLock, default as usePatternLockHook } from './hooks/usePatternLock.js';
export { useFamilyEconomy, loadFamilyEconomyState, default as useFamilyEconomyHook } from './hooks/useFamilyEconomy.js';

// Core Chore Components
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

// Family Economy Components
export {
    UserAvatar,
    UserBalance,
    UserStreak,
    UserSelector,
    UserEditorModal,
    ActiveUserHeader
} from './components/UserProfile.jsx';

export {
    UnlockProgressBar,
    UnlockStatus,
    CompletionCounter,
    MultipleCompletionInput,
    JobCard,
    JobList
} from './components/JobCard.jsx';

export {
    JobEditorModal,
    JobIconPicker,
    CashValueInput,
    RecurrenceSelector,
    UnlockConditionsEditor,
    MultipleCompletionSettings,
    ApprovalToggle,
    DEFAULT_JOB_FORM
} from './components/JobEditor.jsx';

export {
    TransactionIcon,
    TransactionAmount,
    TransactionStatus,
    TransactionItem,
    TransactionGroupHeader,
    TransactionFilterTabs,
    TransactionSummaryCard,
    TransactionHistory,
    RecentTransactions
} from './components/TransactionHistory.jsx';

export {
    FlyingBill,
    FlyingCoin,
    MoneyRain,
    CashBurst,
    MoneyCounter,
    EarningToast,
    SpendingToast,
    useMoneyAnimations,
    MONEY_ANIMATION_CSS
} from './components/MoneyAnimation.jsx';

// Pattern Lock Utilities
export {
    getDotCenter,
    getPatternPath,
    verifyPattern,
    isPointNearDot,
    getPointerCoordinates,
    getRelativePosition,
    isPatternValid
} from './utils/patternLock.js';

// Chore Utilities
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

// Storage Utilities
export {
    saveChoreState,
    loadChoreState,
    clearChoreState,
    extractChoreState,
    mergeChoreState
} from './utils/storage.js';

// Currency Utilities
export {
    dollarsToCents,
    centsToDollars,
    formatCents,
    formatCentsShort,
    multiplyCents,
    calculateBillCount
} from './utils/currency.js';

// Date/Time Utilities
export {
    getStartOfToday,
    getStartOfWeek,
    needsReset,
    isToday,
    isThisWeek,
    isCurrentPeriod,
    formatDate,
    getNextResetTime,
    getTimeUntilReset,
    DEFAULT_WEEKLY_RESET_DAY
} from './utils/dateTime.js';

// Job Utilities
export {
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
} from './utils/jobHelpers.js';

// Default export for convenience
export default {
    // Hooks
    useChoreManagement: null,
    usePatternLock: null,
    useFamilyEconomy: null,

    // Constants
    INITIAL_TASKS: null,
    CHORE_ICONS: null,
    REPEAT_TYPES: null,
    RECURRENCE_TYPE: null
};
