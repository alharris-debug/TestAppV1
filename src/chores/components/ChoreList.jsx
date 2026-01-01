/**
 * ChoreList Component
 *
 * Displays the list of today's chores with completion tracking.
 */

import React from 'react';
import { ChoreCard } from './ChoreCard.jsx';

/**
 * Chore List Component
 *
 * @param {Object} props
 * @param {Object[]} props.tasks - Array of task objects
 * @param {number} props.streak - Current streak count
 * @param {Object[]} props.pendingApproval - Array of pending approvals
 * @param {Function} props.onToggleTask - Task toggle handler
 * @param {Function} props.onOpenManagement - Open management modal handler
 * @param {Function} props.onOpenReview - Open parent review handler
 * @param {boolean} props.hasPendingChores - Whether there are pending chores
 * @param {boolean} props.allChoresComplete - Whether all chores are complete
 * @param {Function} props.getPendingCount - Get pending count for a chore ID
 */
export const ChoreList = ({
    tasks,
    streak,
    pendingApproval,
    onToggleTask,
    onOpenManagement,
    onOpenReview,
    hasPendingChores,
    allChoresComplete,
    getPendingCount
}) => {
    return (
        <div className="bg-white rounded-3xl shadow-2xl p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-purple-600">Today's Chores</h2>
                <button
                    onClick={onOpenManagement}
                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-xl font-semibold hover:bg-purple-200 transition-all flex items-center gap-2"
                >
                    ⚙️ Parent Settings
                </button>
            </div>

            {/* Task List */}
            <div className="space-y-4">
                {tasks.map(task => (
                    <ChoreCard
                        key={task.id}
                        chore={task}
                        streak={streak}
                        pendingCount={getPendingCount(task.id)}
                        onToggle={onToggleTask}
                    />
                ))}
            </div>

            {/* Empty state */}
            {tasks.length === 0 && (
                <div className="text-center text-gray-500 py-12">
                    <p className="text-xl">No chores yet!</p>
                    <p className="mt-2">Click "Parent Settings" to add some chores.</p>
                </div>
            )}

            {/* Review Button */}
            {hasPendingChores && (
                <button
                    onClick={onOpenReview}
                    className="request-approval-btn"
                >
                    👨‍👩‍👧 Ask Parent to Review ({pendingApproval.length} chore{pendingApproval.length !== 1 ? 's' : ''})
                </button>
            )}

            {/* Completion Message */}
            {allChoresComplete && (
                <div className="mt-8 p-6 bg-gradient-to-r from-yellow-200 to-orange-200 rounded-2xl text-center">
                    <p className="text-3xl font-bold text-orange-700">
                        🎉 All chores complete! Amazing work! 🎉
                    </p>
                </div>
            )}
        </div>
    );
};

export default ChoreList;
