/**
 * ChoreCard Component
 *
 * Displays an individual chore with completion status,
 * points, and interactive completion functionality.
 */

import React from 'react';
import { REPEAT_TYPES } from '../constants.js';

/**
 * Gem Icon Component
 */
export const GemIcon = ({ size = "w-6 h-6" }) => (
    <div className={`${size} relative inline-flex items-center justify-center`}>
        <span className="text-lg">💎</span>
    </div>
);

/**
 * Chore Card Component
 *
 * @param {Object} props
 * @param {Object} props.chore - Chore data object
 * @param {number} props.streak - Current streak count
 * @param {number} props.pendingCount - Number of pending approvals for this chore
 * @param {Function} props.onToggle - Callback when chore is clicked/toggled
 * @param {boolean} [props.disabled] - Whether interaction is disabled
 */
export const ChoreCard = ({
    chore,
    streak,
    pendingCount,
    onToggle,
    disabled = false
}) => {
    const { id, name, icon, points, completed, pendingApproval, repeatType } = chore;

    // Determine if card is clickable
    const canClick = !disabled && (repeatType === REPEAT_TYPES.MULTIPLE || !completed);

    // Calculate streak bonus
    const streakBonus = Math.floor(streak / 5);

    // Determine card styling based on state
    const getCardClasses = () => {
        const base = 'p-6 rounded-2xl cursor-pointer transition-all';

        if (completed && repeatType !== REPEAT_TYPES.MULTIPLE) {
            if (pendingApproval) {
                return `${base} bg-yellow-50 border-4 border-yellow-400`;
            }
            return `${base} bg-green-100 border-4 border-green-400`;
        }

        if (pendingCount > 0) {
            return `${base} bg-yellow-50 border-4 border-yellow-400`;
        }

        return `${base} bg-gradient-to-r from-purple-100 to-pink-100 border-4 border-purple-300 hover:scale-105 shine`;
    };

    // Determine checkbox styling
    const getCheckboxClasses = () => {
        const base = 'w-12 h-12 rounded-full border-4 flex items-center justify-center';

        if (completed && repeatType !== REPEAT_TYPES.MULTIPLE) {
            if (pendingApproval) {
                return `${base} bg-yellow-400 border-yellow-500`;
            }
            return `${base} bg-green-500 border-green-600`;
        }

        if (pendingCount > 0) {
            return `${base} bg-yellow-400 border-yellow-500`;
        }

        return `${base} bg-white border-purple-300`;
    };

    // Render checkbox content
    const renderCheckboxContent = () => {
        if (completed && repeatType !== REPEAT_TYPES.MULTIPLE) {
            if (pendingApproval) {
                return <span className="text-2xl">⏳</span>;
            }
            return <span className="text-3xl text-white">✔</span>;
        }

        if (repeatType === REPEAT_TYPES.MULTIPLE && pendingCount > 0) {
            return <span className="text-lg font-bold">{pendingCount}</span>;
        }

        return null;
    };

    const handleClick = () => {
        if (canClick && onToggle) {
            onToggle(id);
        }
    };

    return (
        <div
            onClick={handleClick}
            className={getCardClasses()}
            style={{ cursor: canClick ? 'pointer' : 'default' }}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <span className="text-5xl">{icon}</span>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-800">{name}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {/* Repeat type badges */}
                            {repeatType === REPEAT_TYPES.MULTIPLE && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                    🔁 Multi
                                </span>
                            )}
                            {repeatType === REPEAT_TYPES.ONCE && (
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                    🔲 Once
                                </span>
                            )}

                            {/* Pending badge */}
                            {pendingCount > 0 && (
                                <span className="approval-badge pending">
                                    ⏳ {pendingCount} pending
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className={getCheckboxClasses()}>
                    {renderCheckboxContent()}
                </div>
            </div>
        </div>
    );
};

/**
 * Management Chore Card (for chore management modal)
 *
 * @param {Object} props
 * @param {Object} props.chore - Chore data
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onSave - Save for later handler
 * @param {Function} props.onDelete - Delete handler
 */
export const ManagementChoreCard = ({
    chore,
    onEdit,
    onSave,
    onDelete
}) => {
    return (
        <div className="chore-card">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-3xl">{chore.icon}</span>
                    <div>
                        <div className="font-bold text-gray-800">{chore.name}</div>
                        <div className="text-sm text-gray-500">{chore.repeatType || 'daily'}</div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => onEdit(chore)}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                        title="Edit"
                    >
                        ✏️
                    </button>
                    <button
                        onClick={() => onSave(chore.id)}
                        className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                        title="Save for later"
                    >
                        💾
                    </button>
                    <button
                        onClick={() => onDelete(chore.id)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                        title="Delete"
                    >
                        🗑️
                    </button>
                </div>
            </div>
        </div>
    );
};

/**
 * Saved Chore Card (for saved chores list)
 *
 * @param {Object} props
 * @param {Object} props.chore - Chore data
 * @param {Function} props.onRestore - Restore handler
 * @param {Function} props.onDelete - Delete handler
 */
export const SavedChoreCard = ({
    chore,
    onRestore,
    onDelete
}) => {
    return (
        <div className="chore-card saved-later">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-3xl">{chore.icon}</span>
                    <div>
                        <div className="font-bold text-gray-800">{chore.name}</div>
                        <div className="text-sm text-gray-500">{chore.repeatType || 'daily'}</div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => onRestore(chore.id)}
                        className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                        title="Restore to active"
                    >
                        ➕
                    </button>
                    <button
                        onClick={() => onDelete(chore.id)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                        title="Delete"
                    >
                        🗑️
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChoreCard;
