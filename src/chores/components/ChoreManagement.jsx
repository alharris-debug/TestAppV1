/**
 * ChoreManagement Component
 *
 * Parent-only modal for managing chores.
 * Includes tabs for active and saved chores.
 */

import React from 'react';
import { ManagementChoreCard, SavedChoreCard } from './ChoreCard.jsx';

/**
 * Management Tabs Component
 *
 * @param {Object} props
 * @param {'active' | 'saved'} props.activeTab - Current active tab
 * @param {Function} props.onTabChange - Tab change handler
 * @param {number} props.activeCount - Count of active chores
 * @param {number} props.savedCount - Count of saved chores
 */
export const ManagementTabs = ({
    activeTab,
    onTabChange,
    activeCount,
    savedCount
}) => {
    return (
        <div className="management-tabs">
            <button
                className={`management-tab ${activeTab === 'active' ? 'active' : ''}`}
                onClick={() => onTabChange('active')}
            >
                📋 Active ({activeCount})
            </button>
            <button
                className={`management-tab ${activeTab === 'saved' ? 'active' : ''}`}
                onClick={() => onTabChange('saved')}
            >
                💾 Saved ({savedCount})
            </button>
        </div>
    );
};

/**
 * Active Chores Tab Content
 *
 * @param {Object} props
 * @param {Object[]} props.tasks - Array of active tasks
 * @param {Function} props.onAddNew - Add new chore handler
 * @param {Function} props.onEdit - Edit chore handler
 * @param {Function} props.onSave - Save for later handler
 * @param {Function} props.onDelete - Delete chore handler
 */
export const ActiveChoresTab = ({
    tasks,
    onAddNew,
    onEdit,
    onSave,
    onDelete
}) => {
    return (
        <>
            <button
                onClick={onAddNew}
                className="w-full py-3 mb-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:scale-102 transition-all"
            >
                ➕ Add New Chore
            </button>

            <div className="space-y-3 max-h-64 overflow-y-auto">
                {tasks.map(chore => (
                    <ManagementChoreCard
                        key={chore.id}
                        chore={chore}
                        onEdit={onEdit}
                        onSave={onSave}
                        onDelete={onDelete}
                    />
                ))}

                {tasks.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                        No active chores. Click the button above to add one!
                    </div>
                )}
            </div>
        </>
    );
};

/**
 * Saved Chores Tab Content
 *
 * @param {Object} props
 * @param {Object[]} props.savedChores - Array of saved chores
 * @param {Function} props.onRestore - Restore chore handler
 * @param {Function} props.onDelete - Delete chore handler
 */
export const SavedChoresTab = ({
    savedChores,
    onRestore,
    onDelete
}) => {
    return (
        <div className="space-y-3 max-h-80 overflow-y-auto">
            {savedChores.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                    No saved chores. Use the 💾 button to save chores for later!
                </div>
            ) : (
                savedChores.map(chore => (
                    <SavedChoreCard
                        key={chore.id}
                        chore={chore}
                        onRestore={onRestore}
                        onDelete={onDelete}
                    />
                ))
            )}
        </div>
    );
};

/**
 * Chore Management Modal Component
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility
 * @param {Function} props.onClose - Close handler
 * @param {'active' | 'saved'} props.activeTab - Current active tab
 * @param {Function} props.onTabChange - Tab change handler
 * @param {Object[]} props.tasks - Array of active tasks
 * @param {Object[]} props.savedChores - Array of saved chores
 * @param {Function} props.onAddNew - Add new chore handler
 * @param {Function} props.onEdit - Edit chore handler
 * @param {Function} props.onSaveForLater - Save for later handler
 * @param {Function} props.onDelete - Delete chore handler
 * @param {Function} props.onRestore - Restore chore handler
 * @param {Function} props.onDeleteSaved - Delete saved chore handler
 * @param {Function} props.onResetPassword - Reset parent password handler
 */
export const ChoreManagementModal = ({
    isOpen,
    onClose,
    activeTab,
    onTabChange,
    tasks,
    savedChores,
    onAddNew,
    onEdit,
    onSaveForLater,
    onDelete,
    onRestore,
    onDeleteSaved,
    onResetPassword
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
                        ⚙️ Manage Chores
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                        ✕
                    </button>
                </div>

                {/* Tabs */}
                <ManagementTabs
                    activeTab={activeTab}
                    onTabChange={onTabChange}
                    activeCount={tasks.length}
                    savedCount={savedChores.length}
                />

                {/* Tab Content */}
                {activeTab === 'active' && (
                    <ActiveChoresTab
                        tasks={tasks}
                        onAddNew={onAddNew}
                        onEdit={onEdit}
                        onSave={onSaveForLater}
                        onDelete={onDelete}
                    />
                )}

                {activeTab === 'saved' && (
                    <SavedChoresTab
                        savedChores={savedChores}
                        onRestore={onRestore}
                        onDelete={onDeleteSaved}
                    />
                )}

                {/* Footer - Reset Password */}
                <div className="mt-6 pt-4 border-t">
                    <button
                        onClick={onResetPassword}
                        className="w-full py-2 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200"
                    >
                        🔄 Reset Parent Pattern
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChoreManagementModal;
