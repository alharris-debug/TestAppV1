import React, { useState, useEffect, useCallback, useRef } from 'react';

// Import Family Economy system
import {
    useFamilyEconomy,
    loadFamilyEconomyState,
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
    DEFAULT_CHORE_FORM,
    DEFAULT_JOB_FORM,

    // Utilities
    formatCents,
    dollarsToCents
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

    // Initialize Family Economy system with saved state from localStorage
    const economy = useFamilyEconomy({
        savedState: loadFamilyEconomyState(),
        soundSystem
    });

    // Money animations
    const { showEarning, showSpending, showCashBurst, AnimationOverlay } = useMoneyAnimations(soundSystem);

    // Pattern lock for parent access - use ref to avoid stale closure
    const pendingActionRef = useRef(null);
    const patternLock = usePatternLock({
        storedPassword: economy.parentPassword,
        onPasswordSet: economy.setParentPassword,
        onVerificationSuccess: () => {
            if (pendingActionRef.current) {
                pendingActionRef.current();
                pendingActionRef.current = null;
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

    // Form State - assignTo is now an array for multi-select
    const [choreForm, setChoreForm] = useState({ ...DEFAULT_CHORE_FORM, assignTo: [] });
    const [jobForm, setJobForm] = useState({ ...DEFAULT_JOB_FORM, assignTo: [] });
    const [userForm, setUserForm] = useState({ name: '', avatar: '👤', role: 'child' });

    // Get child users for assignment dropdowns
    const childUsers = economy.users.filter(u => u.role === 'child');

    // Toggle user selection for multi-select
    const toggleChoreAssignment = (userId) => {
        setChoreForm(prev => ({
            ...prev,
            assignTo: prev.assignTo.includes(userId)
                ? prev.assignTo.filter(id => id !== userId)
                : [...prev.assignTo, userId]
        }));
    };

    const toggleJobAssignment = (userId) => {
        setJobForm(prev => ({
            ...prev,
            assignTo: prev.assignTo.includes(userId)
                ? prev.assignTo.filter(id => id !== userId)
                : [...prev.assignTo, userId]
        }));
    };

    // Reset form when opening editors
    const openChoreEditor = (chore = null) => {
        if (chore) {
            setChoreForm({
                name: chore.name || '',
                icon: chore.icon || '📋',
                points: chore.points || 5,
                repeatType: chore.recurrence || RECURRENCE_TYPE.DAILY,
                assignTo: [chore.userId] // Single user when editing existing
            });
            setEditingChore(chore);
        } else {
            setChoreForm({ ...DEFAULT_CHORE_FORM, assignTo: [] });
            setEditingChore(null);
        }
        setShowChoreEditor(true);
    };

    const openJobEditor = (job = null) => {
        if (job) {
            setJobForm({
                title: job.title || '',
                icon: job.icon || '💼',
                value: job.value || 100,
                recurrence: job.recurrence || RECURRENCE_TYPE.DAILY,
                unlockConditions: job.unlockConditions || { dailyChores: 0, weeklyChores: 0 },
                allowMultipleCompletions: job.allowMultipleCompletions || false,
                maxCompletionsPerPeriod: job.maxCompletionsPerPeriod || null,
                requiresApproval: job.requiresApproval !== false,
                description: job.description || '',
                assignTo: [job.userId] // Single user when editing existing
            });
            setEditingJob(job);
        } else {
            setJobForm({ ...DEFAULT_JOB_FORM, assignTo: [] });
            setEditingJob(null);
        }
        setShowJobEditor(true);
    };

    const openUserEditor = (user = null) => {
        if (user) {
            setUserForm({
                name: user.name || '',
                avatar: user.avatar || '👤',
                role: user.role || 'child'
            });
            setEditingUser(user);
        } else {
            setUserForm({ name: '', avatar: '👤', role: 'child' });
            setEditingUser(null);
        }
        setShowUserEditor(true);
    };

    // Save handlers
    const handleSaveChore = () => {
        if (!choreForm.name.trim()) return;
        if (!choreForm.assignTo || choreForm.assignTo.length === 0) return; // Must have assigned user(s)

        const choreData = {
            name: choreForm.name,
            icon: choreForm.icon,
            points: choreForm.points,
            recurrence: choreForm.repeatType
        };

        if (editingChore) {
            // Update existing chore - only update for first selected user
            economy.updateChore(editingChore.id, { ...choreData, userId: choreForm.assignTo[0] });
        } else {
            // Create new chore for each selected user
            choreForm.assignTo.forEach(userId => {
                economy.addChore(choreData, userId);
            });
        }
        setShowChoreEditor(false);
    };

    const handleSaveJob = () => {
        if (!jobForm.title.trim()) return;
        if (!jobForm.assignTo || jobForm.assignTo.length === 0) return; // Must have assigned user(s)

        const jobData = {
            title: jobForm.title,
            icon: jobForm.icon,
            value: jobForm.value,
            recurrence: jobForm.recurrence,
            unlockConditions: jobForm.unlockConditions,
            allowMultipleCompletions: jobForm.allowMultipleCompletions,
            maxCompletionsPerPeriod: jobForm.maxCompletionsPerPeriod,
            requiresApproval: jobForm.requiresApproval,
            description: jobForm.description
        };

        if (editingJob) {
            // Update existing job - only update for first selected user
            economy.updateJob(editingJob.id, { ...jobData, userId: jobForm.assignTo[0] });
        } else {
            // Create new job for each selected user
            jobForm.assignTo.forEach(userId => {
                economy.addJob(jobData, userId);
            });
        }
        setShowJobEditor(false);
    };

    const handleSaveUser = () => {
        if (!userForm.name.trim()) return;

        if (editingUser) {
            economy.updateUser(editingUser.id, userForm);
        } else {
            economy.addUser(userForm);
        }
        setShowUserEditor(false);
    };

    // Request parent access
    const requireParentAccess = (action) => {
        pendingActionRef.current = action;
        patternLock.requestAccess();
    };

    // Get current user's data
    const activeUser = economy.activeUser;
    const isParent = activeUser?.role === 'parent';
    const userChores = economy.activeUserChores || [];
    const userJobs = economy.activeUserJobs || [];
    const userTransactions = economy.activeUserTransactions || [];

    // Management modal state (unified for chores and jobs)
    const [showManagement, setShowManagement] = useState(false);
    const [managementTab, setManagementTab] = useState('chores'); // 'chores', 'jobs', or 'templates'

    // Template state
    const [selectedUsersForTemplate, setSelectedUsersForTemplate] = useState([]);
    const [showTemplateEditor, setShowTemplateEditor] = useState(false);
    const [templateType, setTemplateType] = useState('chore'); // 'chore' or 'job'
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [templateForm, setTemplateForm] = useState({
        name: '',
        title: '',
        icon: '📋',
        points: 5,
        value: 100,
        recurrence: RECURRENCE_TYPE.DAILY,
        unlockConditions: { dailyChores: 0, weeklyChores: 0 },
        allowMultipleCompletions: false,
        maxCompletionsPerPeriod: null,
        requiresApproval: true
    });

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
            // Pass count to show multiplier in animation
            showEarning(result.earned, result.jobTitle, true, count);
        }
    };

    // Template helpers
    const openTemplateEditor = (type, template = null) => {
        setTemplateType(type);
        if (template) {
            setEditingTemplate(template);
            if (type === 'chore') {
                setTemplateForm({
                    name: template.name || '',
                    icon: template.icon || '📋',
                    points: template.points || 5,
                    recurrence: template.recurrence || RECURRENCE_TYPE.DAILY,
                    title: '',
                    value: 100,
                    unlockConditions: { dailyChores: 0, weeklyChores: 0 },
                    allowMultipleCompletions: false,
                    maxCompletionsPerPeriod: null,
                    requiresApproval: true
                });
            } else {
                setTemplateForm({
                    name: '',
                    title: template.title || '',
                    icon: template.icon || '💼',
                    value: template.value || 100,
                    recurrence: template.recurrence || RECURRENCE_TYPE.DAILY,
                    unlockConditions: template.unlockConditions || { dailyChores: 0, weeklyChores: 0 },
                    allowMultipleCompletions: template.allowMultipleCompletions || false,
                    maxCompletionsPerPeriod: template.maxCompletionsPerPeriod || null,
                    requiresApproval: template.requiresApproval !== false,
                    points: 5
                });
            }
        } else {
            setEditingTemplate(null);
            setTemplateForm({
                name: '',
                title: '',
                icon: type === 'chore' ? '📋' : '💼',
                points: 5,
                value: 100,
                recurrence: RECURRENCE_TYPE.DAILY,
                unlockConditions: { dailyChores: 0, weeklyChores: 0 },
                allowMultipleCompletions: false,
                maxCompletionsPerPeriod: null,
                requiresApproval: true
            });
        }
        setShowTemplateEditor(true);
    };

    const handleSaveTemplate = () => {
        if (templateType === 'chore') {
            if (!templateForm.name.trim()) return;
            const templateData = {
                name: templateForm.name,
                icon: templateForm.icon,
                points: templateForm.points,
                recurrence: templateForm.recurrence
            };
            if (editingTemplate) {
                economy.updateChoreTemplate(editingTemplate.id, templateData);
            } else {
                economy.addChoreTemplate(templateData);
            }
        } else {
            if (!templateForm.title.trim()) return;
            const templateData = {
                title: templateForm.title,
                icon: templateForm.icon,
                value: templateForm.value,
                recurrence: templateForm.recurrence,
                unlockConditions: templateForm.unlockConditions,
                allowMultipleCompletions: templateForm.allowMultipleCompletions,
                maxCompletionsPerPeriod: templateForm.maxCompletionsPerPeriod,
                requiresApproval: templateForm.requiresApproval
            };
            if (editingTemplate) {
                economy.updateJobTemplate(editingTemplate.id, templateData);
            } else {
                economy.addJobTemplate(templateData);
            }
        }
        setShowTemplateEditor(false);
    };

    const handleApplyTemplate = (template, type) => {
        if (selectedUsersForTemplate.length === 0) return;
        if (type === 'chore') {
            economy.applyChoreTemplate(template.id, selectedUsersForTemplate);
        } else {
            economy.applyJobTemplate(template.id, selectedUsersForTemplate, activeUser?.id);
        }
        setSelectedUsersForTemplate([]);
    };

    const toggleUserSelection = (userId) => {
        setSelectedUsersForTemplate(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
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
                            {/* Parent Review Button in Header - always show for parents */}
                            {isParent && (
                                <button
                                    onClick={() => requireParentAccess(() => setShowParentReview(true))}
                                    className={`relative ${pendingApprovalsCount > 0 ? 'bg-yellow-500 hover:bg-yellow-400' : 'bg-gray-400 hover:bg-gray-500'} text-white rounded-full p-2 transition-all`}
                                    title={pendingApprovalsCount > 0 ? "Review pending approvals" : "No pending approvals"}
                                >
                                    <span className="text-xl">👨‍👩‍👧</span>
                                    {pendingApprovalsCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                            {pendingApprovalsCount}
                                        </span>
                                    )}
                                </button>
                            )}

                            {/* Balance Display */}
                            <div className="text-right">
                                <div className="text-white/60 text-xs">Balance</div>
                                <div className="text-white font-bold text-xl">
                                    {formatCents(activeUser?.cashBalance || 0)}
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
                    {activeUser?.currentStreak > 0 && (
                        <div className="mt-2 flex items-center justify-center gap-2 text-orange-300">
                            <span className="text-xl">🔥</span>
                            <span className="font-bold">{activeUser.currentStreak} Day Streak!</span>
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
                                        onEdit={() => requireParentAccess(() => openChoreEditor(chore))}
                                        isParent={isParent}
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
                                        onEdit={() => requireParentAccess(() => openChoreEditor(chore))}
                                        isParent={isParent}
                                    />
                                ))}
                                {userChores.filter(c => c.recurrence === RECURRENCE_TYPE.WEEKLY).length === 0 && (
                                    <div className="text-white/60 text-center py-4">No weekly chores yet</div>
                                )}
                            </div>
                        </div>

                        {/* Manage Chores Button (Parent Only) */}
                        {isParent && (
                            <button
                                onClick={() => requireParentAccess(() => {
                                    setManagementTab('chores');
                                    setShowManagement(true);
                                })}
                                className="w-full py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold flex items-center justify-center gap-2 border-2 border-dashed border-white/40"
                            >
                                <span>⚙️</span> Manage Chores & Jobs
                            </button>
                        )}
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
                                onEdit={() => requireParentAccess(() => openJobEditor(job))}
                                isParent={isParent}
                            />
                        ))}

                        {userJobs.length === 0 && (
                            <div className="text-white/60 text-center py-8">
                                No jobs available yet.{!isParent && ' Ask a parent to add some!'}
                            </div>
                        )}

                        {/* Manage Jobs Button (Parent Only) */}
                        {isParent && (
                            <button
                                onClick={() => requireParentAccess(() => {
                                    setManagementTab('jobs');
                                    setShowManagement(true);
                                })}
                                className="w-full py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold flex items-center justify-center gap-2 border-2 border-dashed border-white/40"
                            >
                                <span>⚙️</span> Manage Chores & Jobs
                            </button>
                        )}
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
                                        {formatCents(activeUser?.cashBalance || 0)}
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
                                    <div className="text-green-600 font-bold">{formatCents(user.cashBalance)}</div>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => {
                                setShowUserSelector(false);
                                requireParentAccess(() => openUserEditor());
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

            {/* Chore Editor Modal */}
            {showChoreEditor && (
                <div className="modal-overlay" onClick={() => setShowChoreEditor(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-purple-600 mb-4">
                            {editingChore ? '✏️ Edit Chore' : '➕ Add Chore'}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={choreForm.name}
                                    onChange={(e) => setChoreForm({...choreForm, name: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    placeholder="e.g., Make bed"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(CHORE_ICONS).map(([key, icon]) => (
                                        <button
                                            key={key}
                                            onClick={() => setChoreForm({...choreForm, icon})}
                                            className={`text-2xl p-2 rounded-lg ${choreForm.icon === icon ? 'bg-purple-100 ring-2 ring-purple-500' : 'bg-gray-100'}`}
                                        >
                                            {icon}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                                <select
                                    value={choreForm.repeatType}
                                    onChange={(e) => setChoreForm({...choreForm, repeatType: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                >
                                    <option value={RECURRENCE_TYPE.DAILY}>Daily</option>
                                    <option value={RECURRENCE_TYPE.WEEKLY}>Weekly</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Assign To {!editingChore && '(select one or more)'}
                                </label>
                                {childUsers.length === 0 ? (
                                    <p className="text-xs text-red-500">Add a child first before creating chores.</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-lg bg-gray-50">
                                        {childUsers.map(user => (
                                            <button
                                                key={user.id}
                                                type="button"
                                                onClick={() => toggleChoreAssignment(user.id)}
                                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                                                    choreForm.assignTo.includes(user.id)
                                                        ? 'bg-purple-500 text-white'
                                                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                                                }`}
                                            >
                                                <span>{user.avatar}</span>
                                                <span>{user.name}</span>
                                                {choreForm.assignTo.includes(user.id) && <span>✓</span>}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {editingChore && (
                                    <p className="text-xs text-gray-500 mt-1">Select a different child to reassign this chore.</p>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowChoreEditor(false)}
                                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveChore}
                                disabled={choreForm.assignTo.length === 0 || childUsers.length === 0}
                                className={`flex-1 py-3 rounded-xl font-semibold ${
                                    choreForm.assignTo.length > 0 && childUsers.length > 0
                                        ? 'bg-purple-500 text-white'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                {editingChore ? 'Save' : `Create${choreForm.assignTo.length > 1 ? ` for ${choreForm.assignTo.length} children` : ''}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Job Editor Modal */}
            {showJobEditor && (
                <div className="modal-overlay" onClick={() => setShowJobEditor(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-purple-600 mb-4">
                            {editingJob ? '✏️ Edit Job' : '➕ Add Job'}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={jobForm.title}
                                    onChange={(e) => setJobForm({...jobForm, title: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    placeholder="e.g., Vacuum living room"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Value ($)</label>
                                <input
                                    type="number"
                                    step="0.25"
                                    min="0"
                                    value={(jobForm.value / 100).toFixed(2)}
                                    onChange={(e) => setJobForm({...jobForm, value: Math.round(parseFloat(e.target.value || 0) * 100)})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                                <select
                                    value={jobForm.recurrence}
                                    onChange={(e) => setJobForm({...jobForm, recurrence: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                >
                                    <option value={RECURRENCE_TYPE.DAILY}>Daily</option>
                                    <option value={RECURRENCE_TYPE.WEEKLY}>Weekly</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Unlock after completing # daily chores
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={jobForm.unlockConditions.dailyChores}
                                    onChange={(e) => setJobForm({
                                        ...jobForm,
                                        unlockConditions: {...jobForm.unlockConditions, dailyChores: parseInt(e.target.value) || 0}
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="allowMultiple"
                                    checked={jobForm.allowMultipleCompletions}
                                    onChange={(e) => setJobForm({
                                        ...jobForm,
                                        allowMultipleCompletions: e.target.checked,
                                        maxCompletionsPerPeriod: e.target.checked ? (jobForm.maxCompletionsPerPeriod || 3) : null
                                    })}
                                    className="w-5 h-5 rounded"
                                />
                                <label htmlFor="allowMultiple" className="text-sm font-medium text-gray-700">
                                    Allow multiple completions per day
                                </label>
                            </div>
                            {jobForm.allowMultipleCompletions && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Max completions per day
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={jobForm.maxCompletionsPerPeriod || 3}
                                        onChange={(e) => setJobForm({
                                            ...jobForm,
                                            maxCompletionsPerPeriod: parseInt(e.target.value) || 1
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="requiresApproval"
                                    checked={jobForm.requiresApproval}
                                    onChange={(e) => setJobForm({...jobForm, requiresApproval: e.target.checked})}
                                    className="w-5 h-5 rounded"
                                />
                                <label htmlFor="requiresApproval" className="text-sm font-medium text-gray-700">
                                    Requires parent approval
                                </label>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Assign To {!editingJob && '(select one or more)'}
                                </label>
                                {childUsers.length === 0 ? (
                                    <p className="text-xs text-red-500">Add a child first before creating jobs.</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-lg bg-gray-50">
                                        {childUsers.map(user => (
                                            <button
                                                key={user.id}
                                                type="button"
                                                onClick={() => toggleJobAssignment(user.id)}
                                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                                                    jobForm.assignTo.includes(user.id)
                                                        ? 'bg-purple-500 text-white'
                                                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                                                }`}
                                            >
                                                <span>{user.avatar}</span>
                                                <span>{user.name}</span>
                                                {jobForm.assignTo.includes(user.id) && <span>✓</span>}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {editingJob && (
                                    <p className="text-xs text-gray-500 mt-1">Select a different child to reassign this job.</p>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowJobEditor(false)}
                                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveJob}
                                disabled={jobForm.assignTo.length === 0 || childUsers.length === 0}
                                className={`flex-1 py-3 rounded-xl font-semibold ${
                                    jobForm.assignTo.length > 0 && childUsers.length > 0
                                        ? 'bg-purple-500 text-white'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                {editingJob ? 'Save' : `Create${jobForm.assignTo.length > 1 ? ` for ${jobForm.assignTo.length} children` : ''}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* User Editor Modal */}
            {showUserEditor && (
                <div className="modal-overlay" onClick={() => setShowUserEditor(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-purple-600 mb-4">
                            {editingUser ? '✏️ Edit Family Member' : '➕ Add Family Member'}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={userForm.name}
                                    onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    placeholder="e.g., Emma"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Avatar</label>
                                <div className="flex flex-wrap gap-2">
                                    {['👧', '👦', '👩', '👨', '👶', '🧒', '👱‍♀️', '👱', '🧑', '👴', '👵'].map(emoji => (
                                        <button
                                            key={emoji}
                                            onClick={() => setUserForm({...userForm, avatar: emoji})}
                                            className={`text-2xl p-2 rounded-lg ${userForm.avatar === emoji ? 'bg-purple-100 ring-2 ring-purple-500' : 'bg-gray-100'}`}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <select
                                    value={userForm.role}
                                    onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="child">Child</option>
                                    <option value="parent">Parent</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowUserEditor(false)}
                                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveUser}
                                className="flex-1 py-3 bg-purple-500 text-white rounded-xl font-semibold"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Parent Review Modal */}
            {showParentReview && (
                <div className="modal-overlay" onClick={() => setShowParentReview(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <h2 className="text-xl font-bold text-purple-600 mb-4">
                            👨‍👩‍👧 Parent Review
                        </h2>
                        {economy.jobsNeedingApproval.length === 0 ? (
                            <p className="text-gray-600 text-center py-4">No items pending approval!</p>
                        ) : (
                            <div className="space-y-4">
                                {economy.jobsNeedingApproval.map(job => {
                                    const pendingCount = job.completions.filter(c => c.status === 'pending').length;
                                    const pendingValue = pendingCount * job.value;
                                    const user = economy.users.find(u => u.id === job.userId);
                                    return (
                                        <div key={job.id} className="bg-gray-50 rounded-xl p-4">
                                            <div className="flex items-center gap-3 mb-3">
                                                <span className="text-2xl">{job.icon || '💼'}</span>
                                                <div className="flex-1">
                                                    <div className="font-semibold text-gray-800">{job.title}</div>
                                                    <div className="text-sm text-gray-500">
                                                        {user?.name} • {pendingCount}x = {formatCents(pendingValue)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        economy.approveJob(job.id, 'parent');
                                                    }}
                                                    className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold"
                                                >
                                                    ✓ Approve
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        economy.rejectJob(job.id, 'parent');
                                                    }}
                                                    className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold"
                                                >
                                                    ✕ Reject
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        <button
                            onClick={() => setShowParentReview(false)}
                            className="w-full mt-4 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Unified Management Modal */}
            {showManagement && (
                <div className="modal-overlay" onClick={() => setShowManagement(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '80vh', overflow: 'auto' }}>
                        <h2 className="text-xl font-bold text-purple-600 mb-4">
                            ⚙️ Manage Chores & Jobs
                        </h2>

                        {/* Tabs */}
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setManagementTab('chores')}
                                className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                                    managementTab === 'chores'
                                        ? 'bg-purple-500 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                📋 Chores
                            </button>
                            <button
                                onClick={() => setManagementTab('jobs')}
                                className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                                    managementTab === 'jobs'
                                        ? 'bg-purple-500 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                💼 Jobs
                            </button>
                            <button
                                onClick={() => setManagementTab('templates')}
                                className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                                    managementTab === 'templates'
                                        ? 'bg-purple-500 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                📑 Templates
                            </button>
                        </div>

                        {/* Chores Tab Content */}
                        {managementTab === 'chores' && (
                            <div className="space-y-4">
                                <p className="text-sm text-gray-600 mb-2">
                                    Create chores and assign them to family members.
                                </p>

                                {/* Add New Chore Button */}
                                <button
                                    onClick={() => {
                                        setShowManagement(false);
                                        openChoreEditor();
                                    }}
                                    className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
                                >
                                    <span>➕</span> Create New Chore
                                </button>

                                {/* Existing Chores List */}
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-gray-700">All Chores:</h4>
                                    {economy.chores.length === 0 ? (
                                        <p className="text-gray-500 text-sm">No chores created yet.</p>
                                    ) : (
                                        economy.chores.map(chore => {
                                            const assignedUser = economy.users.find(u => u.id === chore.userId);
                                            return (
                                                <div key={chore.id} className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
                                                    <span className="text-2xl">{chore.icon}</span>
                                                    <div className="flex-1">
                                                        <div className="font-medium">{chore.name}</div>
                                                        <div className="text-xs text-gray-500">
                                                            {chore.recurrence} • Assigned to: {assignedUser?.name || 'Unknown'}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            setShowManagement(false);
                                                            openChoreEditor(chore);
                                                        }}
                                                        className="text-purple-600 hover:text-purple-800 px-2"
                                                    >
                                                        ✏️
                                                    </button>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Jobs Tab Content */}
                        {managementTab === 'jobs' && (
                            <div className="space-y-4">
                                <p className="text-sm text-gray-600 mb-2">
                                    Create paid jobs and assign them to family members.
                                </p>

                                {/* Add New Job Button */}
                                <button
                                    onClick={() => {
                                        setShowManagement(false);
                                        openJobEditor();
                                    }}
                                    className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
                                >
                                    <span>➕</span> Create New Job
                                </button>

                                {/* Existing Jobs List */}
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-gray-700">All Jobs:</h4>
                                    {economy.jobs.length === 0 ? (
                                        <p className="text-gray-500 text-sm">No jobs created yet.</p>
                                    ) : (
                                        economy.jobs.map(job => {
                                            const assignedUser = economy.users.find(u => u.id === job.userId);
                                            return (
                                                <div key={job.id} className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
                                                    <span className="text-2xl">{job.icon || '💼'}</span>
                                                    <div className="flex-1">
                                                        <div className="font-medium">{job.title}</div>
                                                        <div className="text-xs text-gray-500">
                                                            {formatCents(job.value)} • {job.recurrence} • {assignedUser?.name || 'Unknown'}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            setShowManagement(false);
                                                            openJobEditor(job);
                                                        }}
                                                        className="text-purple-600 hover:text-purple-800 px-2"
                                                    >
                                                        ✏️
                                                    </button>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Templates Tab Content */}
                        {managementTab === 'templates' && (
                            <div className="space-y-4">
                                <p className="text-sm text-gray-600 mb-2">
                                    Create templates and apply them to multiple children at once.
                                </p>

                                {/* Create Template Buttons */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openTemplateEditor('chore')}
                                        className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold text-sm"
                                    >
                                        + Chore Template
                                    </button>
                                    <button
                                        onClick={() => openTemplateEditor('job')}
                                        className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold text-sm"
                                    >
                                        + Job Template
                                    </button>
                                </div>

                                {/* Child User Selection */}
                                <div className="bg-blue-50 rounded-lg p-3">
                                    <h4 className="font-semibold text-gray-700 mb-2">Select Children to Apply Templates:</h4>
                                    {childUsers.length === 0 ? (
                                        <p className="text-gray-500 text-sm">No children added yet.</p>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {childUsers.map(user => (
                                                <button
                                                    key={user.id}
                                                    onClick={() => toggleUserSelection(user.id)}
                                                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                                                        selectedUsersForTemplate.includes(user.id)
                                                            ? 'bg-purple-500 text-white'
                                                            : 'bg-white text-gray-700 border border-gray-300'
                                                    }`}
                                                >
                                                    {user.avatar} {user.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Chore Templates */}
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-gray-700">Chore Templates:</h4>
                                    {(economy.choreTemplates || []).length === 0 ? (
                                        <p className="text-gray-500 text-sm">No chore templates yet.</p>
                                    ) : (
                                        (economy.choreTemplates || []).map(template => (
                                            <div key={template.id} className="bg-gray-50 rounded-lg p-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">{template.icon}</span>
                                                    <div className="flex-1">
                                                        <div className="font-medium">{template.name}</div>
                                                        <div className="text-xs text-gray-500">
                                                            {template.recurrence} • {template.points} gems
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => openTemplateEditor('chore', template)}
                                                        className="text-purple-600 hover:text-purple-800 px-2"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={() => economy.deleteChoreTemplate(template.id)}
                                                        className="text-red-500 hover:text-red-700 px-2"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => handleApplyTemplate(template, 'chore')}
                                                    disabled={selectedUsersForTemplate.length === 0}
                                                    className={`mt-2 w-full py-1 rounded-lg text-sm font-medium ${
                                                        selectedUsersForTemplate.length > 0
                                                            ? 'bg-purple-500 text-white hover:bg-purple-600'
                                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                    }`}
                                                >
                                                    Apply to {selectedUsersForTemplate.length} selected
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Job Templates */}
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-gray-700">Job Templates:</h4>
                                    {(economy.jobTemplates || []).length === 0 ? (
                                        <p className="text-gray-500 text-sm">No job templates yet.</p>
                                    ) : (
                                        (economy.jobTemplates || []).map(template => (
                                            <div key={template.id} className="bg-gray-50 rounded-lg p-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">{template.icon}</span>
                                                    <div className="flex-1">
                                                        <div className="font-medium">{template.title}</div>
                                                        <div className="text-xs text-gray-500">
                                                            {formatCents(template.value)} • {template.recurrence}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => openTemplateEditor('job', template)}
                                                        className="text-purple-600 hover:text-purple-800 px-2"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={() => economy.deleteJobTemplate(template.id)}
                                                        className="text-red-500 hover:text-red-700 px-2"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => handleApplyTemplate(template, 'job')}
                                                    disabled={selectedUsersForTemplate.length === 0}
                                                    className={`mt-2 w-full py-1 rounded-lg text-sm font-medium ${
                                                        selectedUsersForTemplate.length > 0
                                                            ? 'bg-green-500 text-white hover:bg-green-600'
                                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                    }`}
                                                >
                                                    Apply to {selectedUsersForTemplate.length} selected
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => setShowManagement(false)}
                            className="w-full mt-4 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Template Editor Modal */}
            {showTemplateEditor && (
                <div className="modal-overlay" onClick={() => setShowTemplateEditor(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-purple-600 mb-4">
                            {editingTemplate ? '✏️ Edit' : '➕ Create'} {templateType === 'chore' ? 'Chore' : 'Job'} Template
                        </h2>
                        <div className="space-y-4">
                            {templateType === 'chore' ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                        <input
                                            type="text"
                                            value={templateForm.name}
                                            onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            placeholder="e.g., Make bed"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(CHORE_ICONS).map(([key, icon]) => (
                                                <button
                                                    key={key}
                                                    onClick={() => setTemplateForm({...templateForm, icon})}
                                                    className={`text-2xl p-2 rounded-lg ${templateForm.icon === icon ? 'bg-purple-100 ring-2 ring-purple-500' : 'bg-gray-100'}`}
                                                >
                                                    {icon}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                                        <select
                                            value={templateForm.recurrence}
                                            onChange={(e) => setTemplateForm({...templateForm, recurrence: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        >
                                            <option value={RECURRENCE_TYPE.DAILY}>Daily</option>
                                            <option value={RECURRENCE_TYPE.WEEKLY}>Weekly</option>
                                        </select>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                        <input
                                            type="text"
                                            value={templateForm.title}
                                            onChange={(e) => setTemplateForm({...templateForm, title: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            placeholder="e.g., Vacuum living room"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Value ($)</label>
                                        <input
                                            type="number"
                                            step="0.25"
                                            min="0"
                                            value={(templateForm.value / 100).toFixed(2)}
                                            onChange={(e) => setTemplateForm({...templateForm, value: Math.round(parseFloat(e.target.value || 0) * 100)})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                                        <select
                                            value={templateForm.recurrence}
                                            onChange={(e) => setTemplateForm({...templateForm, recurrence: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        >
                                            <option value={RECURRENCE_TYPE.DAILY}>Daily</option>
                                            <option value={RECURRENCE_TYPE.WEEKLY}>Weekly</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Unlock after completing # daily chores
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={templateForm.unlockConditions.dailyChores}
                                            onChange={(e) => setTemplateForm({
                                                ...templateForm,
                                                unlockConditions: {...templateForm.unlockConditions, dailyChores: parseInt(e.target.value) || 0}
                                            })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="templateRequiresApproval"
                                            checked={templateForm.requiresApproval}
                                            onChange={(e) => setTemplateForm({...templateForm, requiresApproval: e.target.checked})}
                                            className="w-5 h-5 rounded"
                                        />
                                        <label htmlFor="templateRequiresApproval" className="text-sm font-medium text-gray-700">
                                            Requires parent approval
                                        </label>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowTemplateEditor(false)}
                                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveTemplate}
                                className="flex-1 py-3 bg-purple-500 text-white rounded-xl font-semibold"
                            >
                                Save Template
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Money Animations */}
            <AnimationOverlay />
        </div>
    );
};

// ============ SIMPLE CARD COMPONENTS ============

const ChoreCardSimple = ({ chore, onComplete, onEdit, isParent }) => {
    const isCompleted = chore.completed;
    const isPending = chore.pendingApproval;

    return (
        <div className={`bg-white rounded-xl p-4 shadow-lg transition-all ${
            isCompleted ? 'bg-green-50 border-2 border-green-200' : ''
        }`}>
            <div className="flex items-center gap-3">
                <span className={`text-3xl ${isCompleted ? 'grayscale' : ''}`}>{chore.icon}</span>
                <div className="flex-1">
                    <div className={`font-semibold ${isCompleted ? 'text-green-700 line-through' : 'text-gray-800'}`}>
                        {chore.name}
                    </div>
                    <div className="text-sm text-gray-500">
                        {chore.recurrence === RECURRENCE_TYPE.DAILY ? 'Daily' : 'Weekly'}
                        {chore.points && ` • 💎 ${chore.points} gems`}
                    </div>
                </div>
                <div className="flex gap-2 items-center">
                    {isParent && (
                        <button
                            onClick={onEdit}
                            className="bg-purple-100 hover:bg-purple-200 text-purple-600 px-3 py-2 rounded-lg font-semibold text-sm"
                            title="Edit"
                        >
                            ✏️ Edit
                        </button>
                    )}
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
                    {isCompleted && !isPending && (
                        <span className="bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-medium">
                            ✅ Done!
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

const JobCardSimple = ({ job, chores, onComplete, onEdit, isParent }) => {
    const isLocked = job.isLocked;

    // Count completions for current period (uses timestamp, not date)
    // For daily jobs: count today's completions
    // For weekly jobs: count all completions since last reset (stored in completions array)
    const completionCount = job.completions?.filter(c => {
        if (job.recurrence === RECURRENCE_TYPE.DAILY) {
            const today = new Date().toDateString();
            return new Date(c.timestamp).toDateString() === today;
        } else {
            // Weekly jobs - all completions in array are current period (reset clears them)
            return true;
        }
    }).reduce((sum, c) => sum + (c.count || 1), 0) || 0;

    const maxCompletions = job.maxCompletionsPerPeriod;
    const isMaxedOut = maxCompletions && completionCount >= maxCompletions;
    const hasCompletedOnce = completionCount > 0 && !job.allowMultipleCompletions;

    // Job is "done" if it's single-completion and completed, or maxed out for multi-completion
    const isDone = hasCompletedOnce || isMaxedOut;

    // Can only complete if not locked, not done, and (no max or under max)
    const canComplete = !isLocked && !isDone && (!maxCompletions || completionCount < maxCompletions);

    return (
        <div className={`bg-white rounded-xl p-4 shadow-lg transition-all ${
            isLocked ? 'opacity-60' : isDone ? 'bg-green-50 border-2 border-green-200' : ''
        }`}>
            <div className="flex items-center gap-3">
                <span className={`text-3xl ${isDone ? 'grayscale' : ''}`}>{job.icon || '💼'}</span>
                <div className="flex-1">
                    <div className={`font-semibold ${isDone ? 'text-green-700' : 'text-gray-800'}`}>
                        {job.title}
                    </div>
                    <div className="text-sm text-gray-500">
                        {job.recurrence === RECURRENCE_TYPE.DAILY ? 'Daily' : 'Weekly'}
                        {job.allowMultipleCompletions && maxCompletions &&
                            ` • ${completionCount}/${maxCompletions} ${job.recurrence === RECURRENCE_TYPE.DAILY ? 'today' : 'this week'}`
                        }
                    </div>
                    {isLocked && (
                        <div className="text-xs text-orange-600 mt-1">
                            🔒 Complete {job.unlockConditions?.dailyChores || 0} daily chores to unlock
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {isParent && (
                        <button
                            onClick={onEdit}
                            className="bg-purple-100 hover:bg-purple-200 text-purple-600 px-3 py-2 rounded-lg font-semibold text-sm"
                            title="Edit"
                        >
                            ✏️ Edit
                        </button>
                    )}
                    <div className="text-right">
                        <div className={`font-bold text-lg ${isDone ? 'text-green-600' : 'text-green-600'}`}>
                            {formatCents(job.value)}
                        </div>
                        {canComplete ? (
                            <button
                                onClick={() => onComplete(1)}
                                className="mt-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                            >
                                ✓ Done
                            </button>
                        ) : isDone ? (
                            <span className="mt-1 inline-block bg-green-500 text-white px-3 py-1 rounded-lg text-sm font-medium">
                                ✅ Done!
                            </span>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FamilyEconomyApp;
