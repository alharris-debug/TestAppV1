import React, { useState, useEffect, useCallback } from 'react';

// Import Family Economy system
import {
    useFamilyEconomy,
    usePatternLock,
    useMoneyAnimations,

    // Components
    ActiveUserHeader,
    UserSelector,
    UserEditorModal,
    JobCard,
    JobList,
    JobEditorModal,
    TransactionHistory,
    RecentTransactions,
    TransactionSummaryCard,
    ChoreCard,
    ChoreEditorModal,
    ChoreManagementModal,
    ParentReviewModal,
    PatternLockGrid,
    PasswordSetupModal,
    PasswordEntryModal,

    // Constants
    CHORE_ICONS,
    RECURRENCE_TYPE,

    // Utilities
    formatCents
} from './chores';

// Import styles
import './chores/styles/chores.css';

// ============ MAIN APP ============

const FamilyEconomyApp = () => {
    // Sound system (simplified)
    const [soundEnabled, setSoundEnabled] = useState(true);
    const soundSystem = {
        play: (sound) => {
            if (!soundEnabled) return;
            // Could add actual sounds here
        }
    };

    // Initialize Family Economy system
    const economy = useFamilyEconomy({ soundSystem });

    // Money animations
    const { showEarning, showSpending, showCashBurst, AnimationOverlay } = useMoneyAnimations(soundSystem);

    // Pattern lock for parent access
    const [pendingAction, setPendingAction] = useState(null);
    const patternLock = usePatternLock({
        storedPassword: economy.parentPassword,
        onPasswordSet: economy.setParentPassword,
        onVerificationSuccess: () => {
            if (pendingAction) {
                pendingAction();
                setPendingAction(null);
            }
        },
        soundSystem
    });

    // UI State
    const [activeTab, setActiveTab] = useState('chores'); // 'chores', 'jobs', 'history'
    const [showUserSelector, setShowUserSelector] = useState(false);
    const [showUserEditor, setShowUserEditor] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [showJobEditor, setShowJobEditor] = useState(false);
    const [editingJob, setEditingJob] = useState(null);
    const [showChoreEditor, setShowChoreEditor] = useState(false);
    const [editingChore, setEditingChore] = useState(null);
    const [showParentReview, setShowParentReview] = useState(false);

    // Request parent access
    const requireParentAccess = (action) => {
        setPendingAction(() => action);
        patternLock.requestAccess();
    };

    // Get current user's data
    const activeUser = economy.activeUser;
    const userChores = economy.activeUserChores || [];
    const userJobs = economy.activeUserJobs || [];
    const userTransactions = economy.activeUserTransactions || [];

    // Handle chore completion
    const handleCompleteChore = (choreId) => {
        const result = economy.completeChore(choreId);
        if (result?.requiresApproval) {
            // Will go to parent review
        }
    };

    // Handle job completion
    const handleCompleteJob = (jobId, count = 1) => {
        const result = economy.completeJob(jobId, count);
        if (result?.success && result?.earned) {
            showEarning(result.earned, result.jobTitle);
        }
    };

    // Calculate pending approvals count
    const pendingApprovalsCount = (economy.jobsNeedingApproval || []).length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
            {/* Header */}
            <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
                <div className="max-w-lg mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowUserSelector(true)}
                                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 rounded-full px-3 py-2 transition-all"
                            >
                                <span className="text-2xl">{activeUser?.avatar || '👤'}</span>
                                <span className="text-white font-semibold">{activeUser?.name || 'Select User'}</span>
                                <span className="text-white/60">▼</span>
                            </button>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Balance Display */}
                            <div className="text-right">
                                <div className="text-white/60 text-xs">Balance</div>
                                <div className="text-white font-bold text-xl">
                                    {formatCents(activeUser?.balance || 0)}
                                </div>
                                {(activeUser?.pendingBalance || 0) > 0 && (
                                    <div className="text-yellow-300 text-xs">
                                        +{formatCents(activeUser.pendingBalance)} pending
                                    </div>
                                )}
                            </div>

                            {/* Sound Toggle */}
                            <button
                                onClick={() => setSoundEnabled(!soundEnabled)}
                                className="text-2xl opacity-80 hover:opacity-100"
                            >
                                {soundEnabled ? '🔊' : '🔇'}
                            </button>
                        </div>
                    </div>

                    {/* Streak Display */}
                    {activeUser?.streak > 0 && (
                        <div className="mt-2 flex items-center justify-center gap-2 text-orange-300">
                            <span className="text-xl">🔥</span>
                            <span className="font-bold">{activeUser.streak} Day Streak!</span>
                        </div>
                    )}
                </div>
            </header>

            {/* Navigation Tabs */}
            <nav className="bg-white/10 backdrop-blur-sm border-b border-white/20">
                <div className="max-w-lg mx-auto px-4">
                    <div className="flex">
                        {[
                            { id: 'chores', label: '📋 Chores', badge: null },
                            { id: 'jobs', label: '💼 Jobs', badge: null },
                            { id: 'history', label: '📊 History', badge: null }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 py-3 text-center font-semibold transition-all relative ${
                                    activeTab === tab.id
                                        ? 'text-white border-b-2 border-white'
                                        : 'text-white/60 hover:text-white/80'
                                }`}
                            >
                                {tab.label}
                                {tab.badge && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-lg mx-auto px-4 py-6">
                {/* Chores Tab */}
                {activeTab === 'chores' && (
                    <div className="space-y-4">
                        {/* Parent Review Button */}
                        {pendingApprovalsCount > 0 && (
                            <button
                                onClick={() => requireParentAccess(() => setShowParentReview(true))}
                                className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                            >
                                <span>👨‍👩‍👧 Parent Review</span>
                                <span className="bg-red-500 text-white text-sm rounded-full px-2">
                                    {pendingApprovalsCount}
                                </span>
                            </button>
                        )}

                        {/* Daily Chores */}
                        <div>
                            <h2 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                                <span>📅</span> Daily Chores
                            </h2>
                            <div className="space-y-2">
                                {userChores.filter(c => c.recurrence === RECURRENCE_TYPE.DAILY).map(chore => (
                                    <ChoreCardSimple
                                        key={chore.id}
                                        chore={chore}
                                        onComplete={() => handleCompleteChore(chore.id)}
                                        onEdit={() => requireParentAccess(() => {
                                            setEditingChore(chore);
                                            setShowChoreEditor(true);
                                        })}
                                    />
                                ))}
                                {userChores.filter(c => c.recurrence === RECURRENCE_TYPE.DAILY).length === 0 && (
                                    <div className="text-white/60 text-center py-4">No daily chores yet</div>
                                )}
                            </div>
                        </div>

                        {/* Weekly Chores */}
                        <div>
                            <h2 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                                <span>📆</span> Weekly Chores
                            </h2>
                            <div className="space-y-2">
                                {userChores.filter(c => c.recurrence === RECURRENCE_TYPE.WEEKLY).map(chore => (
                                    <ChoreCardSimple
                                        key={chore.id}
                                        chore={chore}
                                        onComplete={() => handleCompleteChore(chore.id)}
                                        onEdit={() => requireParentAccess(() => {
                                            setEditingChore(chore);
                                            setShowChoreEditor(true);
                                        })}
                                    />
                                ))}
                                {userChores.filter(c => c.recurrence === RECURRENCE_TYPE.WEEKLY).length === 0 && (
                                    <div className="text-white/60 text-center py-4">No weekly chores yet</div>
                                )}
                            </div>
                        </div>

                        {/* Add Chore Button (Parent Only) */}
                        <button
                            onClick={() => requireParentAccess(() => {
                                setEditingChore(null);
                                setShowChoreEditor(true);
                            })}
                            className="w-full py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold flex items-center justify-center gap-2 border-2 border-dashed border-white/40"
                        >
                            <span>➕</span> Add Chore (Parent)
                        </button>
                    </div>
                )}

                {/* Jobs Tab */}
                {activeTab === 'jobs' && (
                    <div className="space-y-4">
                        <div className="bg-white/10 rounded-xl p-4 mb-4">
                            <p className="text-white/80 text-sm">
                                💡 Jobs earn real money! Complete your daily chores to unlock jobs.
                            </p>
                        </div>

                        {userJobs.map(job => (
                            <JobCardSimple
                                key={job.id}
                                job={job}
                                chores={userChores}
                                onComplete={(count) => handleCompleteJob(job.id, count)}
                                onEdit={() => requireParentAccess(() => {
                                    setEditingJob(job);
                                    setShowJobEditor(true);
                                })}
                            />
                        ))}

                        {userJobs.length === 0 && (
                            <div className="text-white/60 text-center py-8">
                                No jobs available yet. Parents can add jobs!
                            </div>
                        )}

                        {/* Add Job Button (Parent Only) */}
                        <button
                            onClick={() => requireParentAccess(() => {
                                setEditingJob(null);
                                setShowJobEditor(true);
                            })}
                            className="w-full py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold flex items-center justify-center gap-2 border-2 border-dashed border-white/40"
                        >
                            <span>➕</span> Add Job (Parent)
                        </button>
                    </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                    <div className="space-y-4">
                        {/* Summary Card */}
                        <div className="bg-white rounded-xl p-4 shadow-lg">
                            <h3 className="font-bold text-gray-800 mb-3">💰 Balance Summary</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-gray-500 text-sm">Available</div>
                                    <div className="text-2xl font-bold text-green-600">
                                        {formatCents(activeUser?.balance || 0)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-gray-500 text-sm">Pending</div>
                                    <div className="text-2xl font-bold text-yellow-600">
                                        {formatCents(activeUser?.pendingBalance || 0)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Transaction List */}
                        <div className="bg-white rounded-xl p-4 shadow-lg">
                            <h3 className="font-bold text-gray-800 mb-3">📜 Recent Transactions</h3>
                            {userTransactions.length > 0 ? (
                                <div className="space-y-2">
                                    {userTransactions.slice(0, 10).map(tx => (
                                        <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                            <div>
                                                <div className="font-medium text-gray-800">{tx.description}</div>
                                                <div className="text-xs text-gray-500">
                                                    {new Date(tx.date).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div className={`font-bold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {tx.amount >= 0 ? '+' : ''}{formatCents(tx.amount)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-gray-500 text-center py-4">
                                    No transactions yet
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* User Selector Modal */}
            {showUserSelector && (
                <div className="modal-overlay" onClick={() => setShowUserSelector(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-purple-600 mb-4">👥 Select User</h2>
                        <div className="space-y-2">
                            {economy.users.map(user => (
                                <button
                                    key={user.id}
                                    onClick={() => {
                                        economy.switchUser(user.id);
                                        setShowUserSelector(false);
                                    }}
                                    className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${
                                        user.id === economy.activeUserId
                                            ? 'bg-purple-100 border-2 border-purple-500'
                                            : 'bg-gray-100 hover:bg-gray-200'
                                    }`}
                                >
                                    <span className="text-3xl">{user.avatar}</span>
                                    <div className="text-left flex-1">
                                        <div className="font-semibold">{user.name}</div>
                                        <div className="text-sm text-gray-500">{user.role}</div>
                                    </div>
                                    <div className="text-green-600 font-bold">{formatCents(user.balance)}</div>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => {
                                setShowUserSelector(false);
                                requireParentAccess(() => {
                                    setEditingUser(null);
                                    setShowUserEditor(true);
                                });
                            }}
                            className="w-full mt-4 py-3 bg-purple-500 text-white rounded-xl font-semibold"
                        >
                            ➕ Add Family Member
                        </button>
                    </div>
                </div>
            )}

            {/* Pattern Lock Modals */}
            {patternLock.isSettingUp && (
                <PasswordSetupModal
                    isOpen={true}
                    onClose={() => patternLock.cancel()}
                    patternLock={patternLock}
                />
            )}

            {patternLock.isVerifying && (
                <PasswordEntryModal
                    isOpen={true}
                    onClose={() => patternLock.cancel()}
                    patternLock={patternLock}
                />
            )}

            {/* Money Animations */}
            <AnimationOverlay />
        </div>
    );
};

// ============ SIMPLE CARD COMPONENTS ============

const ChoreCardSimple = ({ chore, onComplete, onEdit }) => {
    const isCompleted = chore.completedToday || chore.completed;
    const isPending = chore.pendingApproval;

    return (
        <div className={`bg-white rounded-xl p-4 shadow-lg transition-all ${
            isCompleted ? 'opacity-60' : ''
        }`}>
            <div className="flex items-center gap-3">
                <span className="text-3xl">{chore.icon}</span>
                <div className="flex-1">
                    <div className="font-semibold text-gray-800">{chore.name}</div>
                    <div className="text-sm text-gray-500">
                        {chore.recurrence === RECURRENCE_TYPE.DAILY ? 'Daily' : 'Weekly'}
                        {chore.points && ` • 💎 ${chore.points} gems`}
                    </div>
                </div>
                <div className="flex gap-2">
                    {!isCompleted && !isPending && (
                        <button
                            onClick={onComplete}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold"
                        >
                            ✓ Done
                        </button>
                    )}
                    {isPending && (
                        <span className="bg-yellow-100 text-yellow-700 px-3 py-2 rounded-lg text-sm font-medium">
                            ⏳ Pending
                        </span>
                    )}
                    {isCompleted && (
                        <span className="bg-green-100 text-green-700 px-3 py-2 rounded-lg text-sm font-medium">
                            ✅ Complete
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

const JobCardSimple = ({ job, chores, onComplete, onEdit }) => {
    const isLocked = job.isLocked;
    const completionsToday = job.completions?.filter(c => {
        const today = new Date().toDateString();
        return new Date(c.date).toDateString() === today;
    }).length || 0;
    const maxCompletions = job.maxCompletionsPerPeriod;
    const canComplete = !isLocked && (!maxCompletions || completionsToday < maxCompletions);

    return (
        <div className={`bg-white rounded-xl p-4 shadow-lg transition-all ${
            isLocked ? 'opacity-60' : ''
        }`}>
            <div className="flex items-center gap-3">
                <span className="text-3xl">{job.icon || '💼'}</span>
                <div className="flex-1">
                    <div className="font-semibold text-gray-800">{job.title}</div>
                    <div className="text-sm text-gray-500">
                        {job.recurrence === RECURRENCE_TYPE.DAILY ? 'Daily' : 'Weekly'}
                        {job.allowMultipleCompletions && maxCompletions &&
                            ` • ${completionsToday}/${maxCompletions} today`
                        }
                    </div>
                    {isLocked && (
                        <div className="text-xs text-orange-600 mt-1">
                            🔒 Complete {job.unlockConditions?.dailyChores || 0} daily chores to unlock
                        </div>
                    )}
                </div>
                <div className="text-right">
                    <div className="text-green-600 font-bold text-lg">
                        {formatCents(job.value)}
                    </div>
                    {canComplete && (
                        <button
                            onClick={() => onComplete(1)}
                            className="mt-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-semibold"
                        >
                            💰 Earn
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FamilyEconomyApp;
