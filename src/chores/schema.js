/**
 * Family Economy System - Data Schema & Types
 *
 * This module defines the data structures for:
 * - User profiles (kids and parents)
 * - Jobs with cash rewards
 * - Enhanced chores with daily/weekly recurrence
 * - Transactions and balance tracking
 */

// ============ ENUMS & CONSTANTS ============

/**
 * Recurrence types for chores and jobs
 */
export const RECURRENCE_TYPE = {
    DAILY: 'daily',
    WEEKLY: 'weekly'
};

/**
 * User roles
 */
export const USER_ROLE = {
    PARENT: 'parent',
    CHILD: 'child'
};

/**
 * Transaction types
 */
export const TRANSACTION_TYPE = {
    EARN: 'earn',      // Earned from job completion
    REDEEM: 'redeem',  // Spent on rewards/items
    BONUS: 'bonus',    // Bonus rewards (streaks, etc.)
    ADJUST: 'adjust'   // Parent adjustment
};

/**
 * Approval status
 */
export const APPROVAL_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
};

/**
 * Days of the week for weekly reset
 */
export const WEEK_DAYS = {
    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6
};

/**
 * Default weekly reset day (Sunday midnight)
 */
export const DEFAULT_WEEKLY_RESET_DAY = WEEK_DAYS.SUNDAY;

// ============ TYPE DEFINITIONS (JSDoc) ============

/**
 * @typedef {'daily' | 'weekly'} RecurrenceType
 */

/**
 * @typedef {'parent' | 'child'} UserRole
 */

/**
 * @typedef {'earn' | 'redeem' | 'bonus' | 'adjust'} TransactionType
 */

/**
 * @typedef {'pending' | 'approved' | 'rejected'} ApprovalStatus
 */

/**
 * User Profile
 * @typedef {Object} User
 * @property {string} id - Unique user identifier
 * @property {string} name - Display name
 * @property {string} avatar - Avatar emoji or image reference
 * @property {UserRole} role - 'parent' or 'child'
 * @property {number} cashBalance - Current cash balance in cents
 * @property {number} pendingBalance - Pending approval balance in cents
 * @property {number} currentStreak - Current consecutive day streak
 * @property {number} longestStreak - Personal best streak
 * @property {string | null} lastActiveDate - ISO date string of last activity
 * @property {string} createdAt - ISO timestamp
 */

/**
 * Job Completion Event
 * @typedef {Object} JobCompletionEvent
 * @property {string} id - Unique event identifier
 * @property {string} timestamp - ISO timestamp of completion
 * @property {number} count - Number of completions in this event (for multi-completion jobs)
 * @property {number} valueAtCompletion - Job value in cents at time of completion
 * @property {number} totalEarned - Total cash earned (count × value) in cents
 * @property {ApprovalStatus} status - 'pending' | 'approved' | 'rejected'
 * @property {string | null} approvedBy - Parent user ID who approved
 * @property {string | null} approvedAt - ISO timestamp of approval
 */

/**
 * Unlock Conditions for Jobs
 * @typedef {Object} UnlockConditions
 * @property {number} dailyChores - Number of daily chores needed to unlock
 * @property {number} weeklyChores - Number of weekly chores needed to unlock
 */

/**
 * Job
 * @typedef {Object} Job
 * @property {string} id - Unique job identifier
 * @property {string} title - Job title/name
 * @property {string} description - Job description
 * @property {string} icon - Emoji icon
 * @property {number} value - Cash value in cents
 * @property {string} userId - Assigned user ID
 * @property {RecurrenceType} recurrence - 'daily' or 'weekly'
 * @property {boolean} isLocked - Whether job is currently locked
 * @property {UnlockConditions} unlockConditions - Conditions to unlock
 * @property {boolean} allowMultipleCompletions - Can be completed multiple times per period
 * @property {number | null} maxCompletionsPerPeriod - Max completions (null = unlimited)
 * @property {JobCompletionEvent[]} completions - Completion events for current period
 * @property {string} lastReset - ISO timestamp of last daily/weekly reset
 * @property {boolean} requiresApproval - Whether parent approval is needed
 * @property {string} createdAt - ISO timestamp
 * @property {string} createdBy - Parent user ID who created
 */

/**
 * Enhanced Chore (extends existing chore system)
 * @typedef {Object} Chore
 * @property {string} id - Unique chore identifier
 * @property {string} name - Chore name
 * @property {string} icon - Emoji icon
 * @property {number} points - Gem points awarded
 * @property {RecurrenceType} recurrence - 'daily' or 'weekly'
 * @property {string} userId - Assigned user ID
 * @property {boolean} completed - Whether completed this period
 * @property {boolean} pendingApproval - Awaiting parent approval
 * @property {string | null} completedAt - ISO timestamp of completion
 * @property {string} lastReset - ISO timestamp of last reset
 * @property {string} createdAt - ISO timestamp
 */

/**
 * Transaction Record
 * @typedef {Object} Transaction
 * @property {string} id - Unique transaction identifier
 * @property {string} userId - User who earned/spent
 * @property {TransactionType} type - 'earn' | 'redeem' | 'bonus' | 'adjust'
 * @property {number} amount - Amount in cents (positive for earn, negative for redeem)
 * @property {string} date - ISO timestamp
 * @property {string} description - Human-readable description
 * @property {string | null} jobId - Related job ID (if type is 'earn')
 * @property {number | null} completionCount - Number of completions (for multi-completion jobs)
 * @property {string | null} approvedBy - Parent user ID who approved
 * @property {ApprovalStatus} status - 'pending' | 'approved' | 'rejected'
 */

/**
 * Redemption Item (things kids can "buy")
 * @typedef {Object} RedemptionItem
 * @property {string} id - Unique item identifier
 * @property {string} name - Item name
 * @property {string} description - Item description
 * @property {string} icon - Emoji icon
 * @property {number} price - Price in cents
 * @property {boolean} isActive - Whether available for redemption
 * @property {string} createdAt - ISO timestamp
 */

/**
 * Family/Household State
 * @typedef {Object} FamilyState
 * @property {string} id - Unique family identifier
 * @property {User[]} users - All family members
 * @property {string | null} activeUserId - Currently selected user
 * @property {Job[]} jobs - All jobs
 * @property {Chore[]} chores - All chores
 * @property {Transaction[]} transactions - All transactions
 * @property {RedemptionItem[]} redemptionItems - Available rewards
 * @property {number[]} parentPassword - Pattern lock password
 * @property {Object} settings - Family settings
 * @property {string} lastSaved - ISO timestamp of last save
 */

// ============ DEFAULT VALUES ============

/**
 * Default user avatars
 */
export const DEFAULT_AVATARS = ['👦', '👧', '👨', '👩', '🧒', '👶', '🧑', '👱'];

/**
 * Default job icons
 */
export const JOB_ICONS = [
    '🧹', '🧺', '🍽️', '🚗', '🌱', '🐕', '🛒', '📚',
    '🧼', '🪣', '🗑️', '🚿', '🛏️', '👕', '🧸', '✨'
];

/**
 * Quick-select cash amounts (in cents)
 */
export const QUICK_AMOUNTS = [
    { label: '$0.25', cents: 25 },
    { label: '$0.50', cents: 50 },
    { label: '$1.00', cents: 100 },
    { label: '$2.50', cents: 250 },
    { label: '$5.00', cents: 500 },
    { label: '$10.00', cents: 1000 }
];

/**
 * Default new user
 * @param {UserRole} role
 * @returns {User}
 */
export const createDefaultUser = (role = USER_ROLE.CHILD) => ({
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: '',
    avatar: role === USER_ROLE.PARENT ? '👨' : '👦',
    role,
    cashBalance: 0,
    pendingBalance: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: null,
    createdAt: new Date().toISOString()
});

/**
 * Default new job
 * @param {string} userId
 * @param {string} createdBy
 * @returns {Job}
 */
export const createDefaultJob = (userId, createdBy) => ({
    id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: '',
    description: '',
    icon: '✨',
    value: 100, // $1.00 default
    userId,
    recurrence: RECURRENCE_TYPE.DAILY,
    isLocked: false,
    unlockConditions: {
        dailyChores: 0,
        weeklyChores: 0
    },
    allowMultipleCompletions: false,
    maxCompletionsPerPeriod: null,
    completions: [],
    lastReset: new Date().toISOString(),
    requiresApproval: true,
    createdAt: new Date().toISOString(),
    createdBy
});

/**
 * Default enhanced chore
 * @param {string} userId
 * @returns {Chore}
 */
export const createDefaultChore = (userId) => ({
    id: `chore_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: '',
    icon: '📋',
    points: 5,
    recurrence: RECURRENCE_TYPE.DAILY,
    userId,
    completed: false,
    pendingApproval: false,
    completedAt: null,
    lastReset: new Date().toISOString(),
    createdAt: new Date().toISOString()
});

/**
 * Default transaction
 * @param {string} userId
 * @param {TransactionType} type
 * @param {number} amount
 * @param {string} description
 * @returns {Transaction}
 */
export const createTransaction = (userId, type, amount, description) => ({
    id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    type,
    amount,
    date: new Date().toISOString(),
    description,
    jobId: null,
    completionCount: null,
    approvedBy: null,
    status: type === TRANSACTION_TYPE.REDEEM ? APPROVAL_STATUS.APPROVED : APPROVAL_STATUS.PENDING
});

/**
 * Default chore template (not assigned to a user)
 * @returns {Object}
 */
export const createChoreTemplate = () => ({
    id: `chore_template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: '',
    icon: '📋',
    points: 5,
    recurrence: RECURRENCE_TYPE.DAILY,
    createdAt: new Date().toISOString()
});

/**
 * Default job template (not assigned to a user)
 * @returns {Object}
 */
export const createJobTemplate = () => ({
    id: `job_template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: '',
    description: '',
    icon: '✨',
    value: 100, // $1.00 default
    recurrence: RECURRENCE_TYPE.DAILY,
    unlockConditions: {
        dailyChores: 0,
        weeklyChores: 0
    },
    allowMultipleCompletions: false,
    maxCompletionsPerPeriod: null,
    requiresApproval: true,
    createdAt: new Date().toISOString()
});

/**
 * Default family state
 * @returns {FamilyState}
 */
export const createDefaultFamilyState = () => ({
    id: `family_${Date.now()}`,
    users: [],
    activeUserId: null,
    jobs: [],
    chores: [],
    choreTemplates: [],
    jobTemplates: [],
    transactions: [],
    redemptionItems: [],
    parentPassword: null,
    settings: {
        weeklyResetDay: DEFAULT_WEEKLY_RESET_DAY,
        currency: 'USD',
        requireApprovalForJobs: true,
        requireApprovalForChores: true
    },
    lastSaved: new Date().toISOString()
});

// ============ STORAGE KEY ============

export const FAMILY_STORAGE_KEY = 'family_economy_v1';
