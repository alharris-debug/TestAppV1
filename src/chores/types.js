/**
 * Chore Management System Type Definitions
 *
 * This module provides JSDoc type definitions for the chore system.
 * These can be used for documentation and IDE support.
 */

/**
 * @typedef {'once' | 'daily' | 'multiple'} RepeatType
 * - 'once': Complete once, then permanently removed
 * - 'daily': Resets each day at midnight
 * - 'multiple': Can be completed multiple times per day
 */

/**
 * @typedef {Object} Chore
 * @property {number} id - Unique identifier for the chore
 * @property {string} name - Display name of the chore
 * @property {string} icon - Emoji icon representing the chore
 * @property {number} points - Gem points awarded for completion
 * @property {RepeatType} repeatType - How the chore repeats
 * @property {boolean} completed - Whether the chore is completed
 * @property {boolean} [pendingApproval] - Whether awaiting parent approval
 */

/**
 * @typedef {Object} PendingApproval
 * @property {number} id - Chore ID this approval relates to
 * @property {string} approvalId - Unique ID for this specific completion instance
 * @property {string} name - Chore name
 * @property {string} icon - Chore icon
 * @property {number} points - Base points
 * @property {number} totalPoints - Points including streak bonus
 * @property {number} streakBonus - Additional streak bonus points
 * @property {RepeatType} repeatType - Chore repeat type
 * @property {string} completedAt - ISO timestamp of completion
 */

/**
 * @typedef {Object} ChoreForm
 * @property {string} name - Chore name input value
 * @property {string} icon - Selected icon
 * @property {number} points - Gem reward value
 * @property {RepeatType} repeatType - Selected repeat type
 */

/**
 * @typedef {'pass' | 'fail'} ReviewDecision
 * - 'pass': Chore approved, gems awarded
 * - 'fail': Chore rejected, task reset for redo
 */

/**
 * @typedef {Object.<string, ReviewDecision>} ReviewDecisions
 * Map of approvalId to review decision
 */

/**
 * @typedef {Object} PatternLockState
 * @property {number[]} pattern - Array of dot indices in the pattern
 * @property {boolean} isDrawing - Whether user is currently drawing
 * @property {{x: number, y: number} | null} currentPoint - Current pointer position
 * @property {boolean} error - Whether pattern verification failed
 * @property {boolean} success - Whether pattern verification succeeded
 */

/**
 * @typedef {Object} ChoreState
 * @property {Chore[]} tasks - Active chores list
 * @property {Chore[]} savedChores - Archived chores for later
 * @property {PendingApproval[]} pendingApproval - Chores awaiting review
 * @property {number[] | null} parentPassword - Stored pattern lock password
 * @property {number} streak - Current daily streak count
 * @property {string | null} lastPlayDate - Last activity date string
 */

/**
 * @typedef {Object} ChoreModalState
 * @property {boolean} showChoreManagement - Main management modal visibility
 * @property {boolean} showChoreEditor - Chore editor modal visibility
 * @property {boolean} showParentReview - Parent review modal visibility
 * @property {boolean} showPasswordSetup - Pattern setup modal visibility
 * @property {boolean} showPasswordEntry - Pattern entry modal visibility
 * @property {'active' | 'saved'} choreManagementTab - Active tab in management
 * @property {Chore | null} editingChore - Currently editing chore (null = new)
 * @property {ChoreForm} choreForm - Form state for editor
 * @property {ReviewDecisions} reviewDecisions - Current review decisions
 */

export {};
