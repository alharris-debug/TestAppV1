/**
 * ParentReview Component
 *
 * Modal for parents to review and approve/reject completed chores.
 */

import React from 'react';
import { REPEAT_TYPES } from '../constants.js';

/**
 * Review Card Component
 *
 * @param {Object} props
 * @param {Object} props.chore - Pending approval chore data
 * @param {string | undefined} props.decision - Current decision ('pass' | 'fail' | undefined)
 * @param {Function} props.onDecide - Decision handler (key, decision)
 */
export const ReviewCard = ({
    chore,
    decision,
    onDecide
}) => {
    const key = chore.approvalId || chore.id;

    return (
        <div className="parent-review-card">
            <div className="flex items-center gap-4 mb-3">
                <span className="text-4xl">{chore.icon}</span>
                <div className="flex-1">
                    <div className="font-bold text-lg text-gray-800">
                        {chore.name}
                        {chore.repeatType === REPEAT_TYPES.MULTIPLE && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full ml-2">
                                🔁
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-purple-600">
                        <span>💎 {chore.totalPoints} gems</span>
                        {chore.streakBonus > 0 && (
                            <span className="text-orange-500">
                                (+{chore.streakBonus} streak bonus)
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="review-actions">
                <button
                    onClick={() => onDecide(key, 'pass')}
                    className={`review-btn pass ${decision === 'pass' ? 'ring-4 ring-green-300' : ''}`}
                >
                    ✅ Approve
                </button>
                <button
                    onClick={() => onDecide(key, 'fail')}
                    className={`review-btn fail ${decision === 'fail' ? 'ring-4 ring-red-300' : ''}`}
                >
                    ❌ Redo
                </button>
            </div>
        </div>
    );
};

/**
 * Parent Review Modal Component
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility
 * @param {Function} props.onClose - Close handler
 * @param {Object[]} props.pendingApproval - Array of pending approval items
 * @param {Object.<string, string>} props.reviewDecisions - Map of approvalId to decision
 * @param {Function} props.onDecide - Decision handler
 * @param {Function} props.onSubmit - Submit reviews handler
 * @param {boolean} props.canSubmit - Whether all items have been reviewed
 * @param {number} props.reviewProgress - Number of items reviewed
 * @param {number} props.reviewTotal - Total items to review
 */
export const ParentReviewModal = ({
    isOpen,
    onClose,
    pendingApproval,
    reviewDecisions,
    onDecide,
    onSubmit,
    canSubmit,
    reviewProgress,
    reviewTotal
}) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content"
                style={{ maxWidth: '600px' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-purple-600">
                        👨‍👩‍👧 Review Chores
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                        ✕
                    </button>
                </div>

                {/* Instructions */}
                <p className="text-gray-600 mb-4">
                    Review each completed chore. Approved chores award gems!
                </p>

                {/* Review Cards */}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                    {pendingApproval.map(chore => {
                        const key = chore.approvalId || chore.id;
                        return (
                            <ReviewCard
                                key={key}
                                chore={chore}
                                decision={reviewDecisions[key]}
                                onDecide={onDecide}
                            />
                        );
                    })}

                    {pendingApproval.length === 0 && (
                        <div className="text-center text-gray-500 py-8">
                            No chores to review right now.
                        </div>
                    )}
                </div>

                {/* Submit Button */}
                <div className="mt-6 pt-4 border-t">
                    <button
                        onClick={onSubmit}
                        disabled={!canSubmit}
                        className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-lg hover:scale-102 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        Submit Reviews ({reviewProgress}/{reviewTotal})
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ParentReviewModal;
