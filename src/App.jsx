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

    // Get users for assignment dropdowns (all users can have chores/jobs)
    const assignableUsers = economy.users;
    // Keep childUsers for backward compatibility in some places
    const childUsers = economy.users.filter(u => u.role === 'child');

    // Track if editor was opened from management modal (to return there after save)
    const [openedFromManagement, setOpenedFromManagement] = useState(false);

    // Helper to close editor and return to management modal if needed
    const closeChoreEditor = () => {
        setShowChoreEditor(false);
        if (openedFromManagement) {
            setShowManagement(true);
            setOpenedFromManagement(false);
        }
    };

    const closeJobEditor = () => {
        setShowJobEditor(false);
        if (openedFromManagement) {
            setShowManagement(true);
            setOpenedFromManagement(false);
        }
    };

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
                repeatType: chore.recurrence || RECURRENCE_TYPE.DAILY,
                assignTo: chore.userId ? [chore.userId] : [] // Empty if unassigned (library item)
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
                assignTo: job.userId ? [job.userId] : [] // Empty if unassigned (library item)
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

        const choreData = {
            name: choreForm.name,
            icon: choreForm.icon,
            recurrence: choreForm.repeatType
        };

        if (editingChore) {
            if (choreForm.assignTo.length === 0) {
                // Unassign - make inactive (set userId to null)
                economy.updateChore(editingChore.id, { ...choreData, userId: null });
            } else {
                // Update existing chore with first selected user
                economy.updateChore(editingChore.id, { ...choreData, userId: choreForm.assignTo[0] });
                // If additional users selected, create new chores for them
                choreForm.assignTo.slice(1).forEach(userId => {
                    economy.addChore(choreData, userId);
                });
            }
        } else {
            if (choreForm.assignTo.length === 0) {
                // Create unassigned chore (inactive/library item)
                economy.addChore(choreData, null);
            } else {
                // Create new chore for each selected user
                choreForm.assignTo.forEach(userId => {
                    economy.addChore(choreData, userId);
                });
            }
        }
        closeChoreEditor();
    };

    const handleSaveJob = () => {
        if (!jobForm.title.trim()) return;

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
            if (jobForm.assignTo.length === 0) {
                // Unassign - make inactive (set userId to null)
                economy.updateJob(editingJob.id, { ...jobData, userId: null });
            } else {
                // Update existing job with first selected user
                economy.updateJob(editingJob.id, { ...jobData, userId: jobForm.assignTo[0] });
                // If additional users selected, create new jobs for them
                jobForm.assignTo.slice(1).forEach(userId => {
                    economy.addJob(jobData, userId);
                });
            }
        } else {
            if (jobForm.assignTo.length === 0) {
                // Create unassigned job (inactive/library item)
                economy.addJob(jobData, null);
            } else {
                // Create new job for each selected user
                jobForm.assignTo.forEach(userId => {
                    economy.addJob(jobData, userId);
                });
            }
        }
        closeJobEditor();
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
                    requiresApproval: template.requiresApproval !== false
                });
            }
        } else {
            setEditingTemplate(null);
            setTemplateForm({
                name: '',
                title: '',
                icon: type === 'chore' ? '📋' : '💼',
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

    // Calculate pending approvals - both jobs and chores
    const choresNeedingApproval = economy.chores.filter(c => c.pendingApproval);
    const pendingApprovalsCount = (economy.jobsNeedingApproval || []).length + choresNeedingApproval.length;

    // Separate assigned (active) and unassigned (library) chores
    const activeChores = economy.chores.filter(c => c.userId);
    const libraryChores = economy.chores.filter(c => !c.userId);

    // Separate assigned (active) and unassigned (library) jobs
    const activeJobs = economy.jobs.filter(j => j.userId);
    const libraryJobs = economy.jobs.filter(j => !j.userId);

    // Group active chores by name+icon+recurrence for management display
    const groupedChores = activeChores.reduce((acc, chore) => {
        const key = `${chore.name}|${chore.icon}|${chore.recurrence}`;
        if (!acc[key]) {
            acc[key] = {
                name: chore.name,
                icon: chore.icon,
                recurrence: chore.recurrence,
                assignments: []
            };
        }
        const user = economy.users.find(u => u.id === chore.userId);
        acc[key].assignments.push({ choreId: chore.id, userId: chore.userId, userName: user?.name || 'Unknown', userAvatar: user?.avatar || '👤' });
        return acc;
    }, {});

    // Group active jobs by title+icon+recurrence+value for management display
    const groupedJobs = activeJobs.reduce((acc, job) => {
        const key = `${job.title}|${job.icon}|${job.recurrence}|${job.value}`;
        if (!acc[key]) {
            acc[key] = {
                title: job.title,
                icon: job.icon || '💼',
                recurrence: job.recurrence,
                value: job.value,
                assignments: []
            };
        }
        const user = economy.users.find(u => u.id === job.userId);
        acc[key].assignments.push({ jobId: job.id, userId: job.userId, userName: user?.name || 'Unknown', userAvatar: user?.avatar || '👤' });
        return acc;
    }, {});

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
                <div className="modal-overlay" onClick={closeChoreEditor}>
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
                                    Assign To (optional)
                                </label>
                                <p className="text-xs text-gray-500 mb-2">
                                    Leave empty to save to library. Select people to make it active.
                                </p>
                                {assignableUsers.length === 0 ? (
                                    <p className="text-xs text-yellow-600">No family members yet. Chore will be saved to library.</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-lg bg-gray-50">
                                        {assignableUsers.map(user => (
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
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={closeChoreEditor}
                                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveChore}
                                className="flex-1 py-3 bg-purple-500 text-white rounded-xl font-semibold"
                            >
                                {choreForm.assignTo.length === 0
                                    ? 'Save to Library'
                                    : choreForm.assignTo.length > 1
                                        ? `Create for ${choreForm.assignTo.length} people`
                                        : 'Create & Assign'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Job Editor Modal */}
            {showJobEditor && (
                <div className="modal-overlay" onClick={closeJobEditor}>
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
                                    Assign To (optional)
                                </label>
                                <p className="text-xs text-gray-500 mb-2">
                                    Leave empty to save to library. Select people to make it active.
                                </p>
                                {assignableUsers.length === 0 ? (
                                    <p className="text-xs text-yellow-600">No family members yet. Job will be saved to library.</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-lg bg-gray-50">
                                        {assignableUsers.map(user => (
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
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={closeJobEditor}
                                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveJob}
                                className="flex-1 py-3 bg-purple-500 text-white rounded-xl font-semibold"
                            >
                                {jobForm.assignTo.length === 0
                                    ? 'Save to Library'
                                    : jobForm.assignTo.length > 1
                                        ? `Create for ${jobForm.assignTo.length} people`
                                        : 'Create & Assign'}
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
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', maxHeight: '80vh', overflow: 'auto' }}>
                        <h2 className="text-xl font-bold text-purple-600 mb-4">
                            👨‍👩‍👧 Parent Review
                        </h2>
                        {pendingApprovalsCount === 0 ? (
                            <p className="text-gray-600 text-center py-4">No items pending approval!</p>
                        ) : (
                            <div className="space-y-4">
                                {/* Pending Chores */}
                                {choresNeedingApproval.length > 0 && (
                                    <>
                                        <h3 className="font-semibold text-gray-700 text-sm">📋 Chores</h3>
                                        {choresNeedingApproval.map(chore => {
                                            const user = economy.users.find(u => u.id === chore.userId);
                                            return (
                                                <div key={chore.id} className="bg-blue-50 rounded-xl p-4">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <span className="text-2xl">{chore.icon || '📋'}</span>
                                                        <div className="flex-1">
                                                            <div className="font-semibold text-gray-800">{chore.name}</div>
                                                            <div className="text-sm text-gray-500">
                                                                {user?.name}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => economy.approveChore(chore.id, 'parent')}
                                                            className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold"
                                                        >
                                                            ✓ Approve
                                                        </button>
                                                        <button
                                                            onClick={() => economy.updateChore(chore.id, { pendingApproval: false, completed: false })}
                                                            className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold"
                                                        >
                                                            ✕ Reject
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </>
                                )}

                                {/* Pending Jobs */}
                                {economy.jobsNeedingApproval.length > 0 && (
                                    <>
                                        <h3 className="font-semibold text-gray-700 text-sm">💼 Jobs</h3>
                                        {economy.jobsNeedingApproval.map(job => {
                                            const pendingCount = job.completions.filter(c => c.status === 'pending').length;
                                            const pendingValue = pendingCount * job.value;
                                            const user = economy.users.find(u => u.id === job.userId);
                                            return (
                                                <div key={job.id} className="bg-green-50 rounded-xl p-4">
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
                                                            onClick={() => economy.approveJob(job.id, 'parent')}
                                                            className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold"
                                                        >
                                                            ✓ Approve
                                                        </button>
                                                        <button
                                                            onClick={() => economy.rejectJob(job.id, 'parent')}
                                                            className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold"
                                                        >
                                                            ✕ Reject
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </>
                                )}
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
                                onClick={() => setManagementTab('library')}
                                className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                                    managementTab === 'library'
                                        ? 'bg-purple-500 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                📚 Library
                                {(libraryChores.length > 0 || libraryJobs.length > 0) && (
                                    <span className="ml-1 bg-gray-300 text-gray-700 text-xs px-1.5 py-0.5 rounded-full">
                                        {libraryChores.length + libraryJobs.length}
                                    </span>
                                )}
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
                                        setOpenedFromManagement(true);
                                        setShowManagement(false);
                                        openChoreEditor();
                                    }}
                                    className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
                                >
                                    <span>➕</span> Create New Chore
                                </button>

                                {/* Existing Chores List - Grouped */}
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-gray-700">All Chores:</h4>
                                    {Object.keys(groupedChores).length === 0 ? (
                                        <p className="text-gray-500 text-sm">No chores created yet.</p>
                                    ) : (
                                        Object.values(groupedChores).map((group, idx) => (
                                            <div key={idx} className="bg-gray-50 rounded-lg p-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">{group.icon}</span>
                                                    <div className="flex-1">
                                                        <div className="font-medium">{group.name}</div>
                                                        <div className="text-xs text-gray-500">{group.recurrence}</div>
                                                    </div>
                                                </div>
                                                <div className="mt-2 flex flex-wrap gap-1">
                                                    {group.assignments.map(assignment => (
                                                        <span
                                                            key={assignment.choreId}
                                                            className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs"
                                                        >
                                                            <span>{assignment.userAvatar}</span>
                                                            <span>{assignment.userName}</span>
                                                            <button
                                                                onClick={() => {
                                                                    const chore = economy.chores.find(c => c.id === assignment.choreId);
                                                                    if (chore) {
                                                                        setOpenedFromManagement(true);
                                                                        setShowManagement(false);
                                                                        openChoreEditor(chore);
                                                                    }
                                                                }}
                                                                className="ml-1 text-purple-500 hover:text-purple-700"
                                                                title="Edit this assignment"
                                                            >
                                                                ✏️
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
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
                                        setOpenedFromManagement(true);
                                        setShowManagement(false);
                                        openJobEditor();
                                    }}
                                    className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
                                >
                                    <span>➕</span> Create New Job
                                </button>

                                {/* Existing Jobs List - Grouped */}
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-gray-700">All Jobs:</h4>
                                    {Object.keys(groupedJobs).length === 0 ? (
                                        <p className="text-gray-500 text-sm">No jobs created yet.</p>
                                    ) : (
                                        Object.values(groupedJobs).map((group, idx) => (
                                            <div key={idx} className="bg-gray-50 rounded-lg p-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">{group.icon}</span>
                                                    <div className="flex-1">
                                                        <div className="font-medium">{group.title}</div>
                                                        <div className="text-xs text-gray-500">
                                                            {formatCents(group.value)} • {group.recurrence}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-2 flex flex-wrap gap-1">
                                                    {group.assignments.map(assignment => (
                                                        <span
                                                            key={assignment.jobId}
                                                            className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs"
                                                        >
                                                            <span>{assignment.userAvatar}</span>
                                                            <span>{assignment.userName}</span>
                                                            <button
                                                                onClick={() => {
                                                                    const job = economy.jobs.find(j => j.id === assignment.jobId);
                                                                    if (job) {
                                                                        setOpenedFromManagement(true);
                                                                        setShowManagement(false);
                                                                        openJobEditor(job);
                                                                    }
                                                                }}
                                                                className="ml-1 text-green-500 hover:text-green-700"
                                                                title="Edit this assignment"
                                                            >
                                                                ✏️
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Library Tab Content - Unassigned chores and jobs */}
                        {managementTab === 'library' && (
                            <div className="space-y-4">
                                <p className="text-sm text-gray-600 mb-2">
                                    Unassigned chores and jobs. Edit to assign to family members.
                                </p>

                                {/* Library Chores */}
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-gray-700">📋 Chores in Library:</h4>
                                    {libraryChores.length === 0 ? (
                                        <p className="text-gray-500 text-sm">No unassigned chores. Create a chore and leave assignment empty to add here.</p>
                                    ) : (
                                        libraryChores.map(chore => (
                                            <div key={chore.id} className="bg-blue-50 rounded-lg p-3 flex items-center gap-3">
                                                <span className="text-2xl">{chore.icon}</span>
                                                <div className="flex-1">
                                                    <div className="font-medium">{chore.name}</div>
                                                    <div className="text-xs text-gray-500">{chore.recurrence}</div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setOpenedFromManagement(true);
                                                        setShowManagement(false);
                                                        openChoreEditor(chore);
                                                    }}
                                                    className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded-lg text-sm font-medium"
                                                >
                                                    Assign
                                                </button>
                                                <button
                                                    onClick={() => economy.deleteChore(chore.id)}
                                                    className="text-red-500 hover:text-red-700 px-2"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Library Jobs */}
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-gray-700">💼 Jobs in Library:</h4>
                                    {libraryJobs.length === 0 ? (
                                        <p className="text-gray-500 text-sm">No unassigned jobs. Create a job and leave assignment empty to add here.</p>
                                    ) : (
                                        libraryJobs.map(job => (
                                            <div key={job.id} className="bg-green-50 rounded-lg p-3 flex items-center gap-3">
                                                <span className="text-2xl">{job.icon || '💼'}</span>
                                                <div className="flex-1">
                                                    <div className="font-medium">{job.title}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {formatCents(job.value)} • {job.recurrence}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setOpenedFromManagement(true);
                                                        setShowManagement(false);
                                                        openJobEditor(job);
                                                    }}
                                                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-medium"
                                                >
                                                    Assign
                                                </button>
                                                <button
                                                    onClick={() => economy.deleteJob(job.id)}
                                                    className="text-red-500 hover:text-red-700 px-2"
                                                >
                                                    🗑️
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

const ChoreCardSimple = ({ chore, onComplete }) => {
    const isCompleted = chore.completed;
    const isPending = chore.pendingApproval;

    // Determine card state and styling
    const getCardStyle = () => {
        if (isCompleted && !isPending) {
            return 'bg-green-100 border-2 border-green-400';
        }
        if (isPending) {
            return 'bg-yellow-50 border-2 border-yellow-400';
        }
        return 'bg-white border-2 border-transparent hover:border-gray-200';
    };

    return (
        <div className={`rounded-xl p-4 shadow-lg transition-all ${getCardStyle()}`}>
            <div className="flex items-center gap-3">
                {/* Status indicator overlay on icon */}
                <div className="relative">
                    <span className={`text-3xl ${isCompleted ? 'opacity-50' : ''}`}>{chore.icon}</span>
                    {isCompleted && !isPending && (
                        <div className="absolute -top-1 -right-1 bg-green-500 rounded-full w-5 h-5 flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                        </div>
                    )}
                    {isPending && (
                        <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full w-5 h-5 flex items-center justify-center">
                            <span className="text-white text-xs">⏳</span>
                        </div>
                    )}
                </div>
                <div className="flex-1">
                    <div className={`font-semibold ${isCompleted ? 'text-green-700' : isPending ? 'text-yellow-700' : 'text-gray-800'}`}>
                        {chore.name}
                    </div>
                    <div className="text-sm text-gray-500">
                        {chore.recurrence === RECURRENCE_TYPE.DAILY ? 'Daily' : 'Weekly'}
                    </div>
                </div>
                <div className="flex gap-2 items-center">
                    {!isCompleted && !isPending && (
                        <button
                            onClick={onComplete}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold shadow-md"
                        >
                            ✓ Done
                        </button>
                    )}
                    {isPending && (
                        <div className="bg-yellow-200 text-yellow-800 px-3 py-2 rounded-lg text-sm font-bold">
                            PENDING
                        </div>
                    )}
                    {isCompleted && !isPending && (
                        <div className="bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-bold">
                            COMPLETE
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const JobCardSimple = ({ job, chores, onComplete }) => {
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

    // Check for pending completions
    const hasPending = job.completions?.some(c => c.status === 'pending') || false;

    const maxCompletions = job.maxCompletionsPerPeriod;
    const isMaxedOut = maxCompletions && completionCount >= maxCompletions;
    const hasCompletedOnce = completionCount > 0 && !job.allowMultipleCompletions;

    // Job is "done" if it's single-completion and completed, or maxed out for multi-completion
    const isDone = hasCompletedOnce || isMaxedOut;

    // Can only complete if not locked, not done, and (no max or under max)
    const canComplete = !isLocked && !isDone && (!maxCompletions || completionCount < maxCompletions);

    // Determine card state and styling
    const getCardStyle = () => {
        if (isLocked) {
            return 'bg-gray-100 border-2 border-gray-300 opacity-60';
        }
        if (isDone && !hasPending) {
            return 'bg-green-100 border-2 border-green-400';
        }
        if (hasPending) {
            return 'bg-yellow-50 border-2 border-yellow-400';
        }
        return 'bg-white border-2 border-transparent hover:border-gray-200';
    };

    return (
        <div className={`rounded-xl p-4 shadow-lg transition-all ${getCardStyle()}`}>
            <div className="flex items-center gap-3">
                {/* Status indicator overlay on icon */}
                <div className="relative">
                    <span className={`text-3xl ${isDone ? 'opacity-50' : ''}`}>{job.icon || '💼'}</span>
                    {isDone && !hasPending && (
                        <div className="absolute -top-1 -right-1 bg-green-500 rounded-full w-5 h-5 flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                        </div>
                    )}
                    {hasPending && (
                        <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full w-5 h-5 flex items-center justify-center">
                            <span className="text-white text-xs">⏳</span>
                        </div>
                    )}
                    {isLocked && (
                        <div className="absolute -top-1 -right-1 bg-gray-500 rounded-full w-5 h-5 flex items-center justify-center">
                            <span className="text-white text-xs">🔒</span>
                        </div>
                    )}
                </div>
                <div className="flex-1">
                    <div className={`font-semibold ${isDone ? 'text-green-700' : hasPending ? 'text-yellow-700' : isLocked ? 'text-gray-500' : 'text-gray-800'}`}>
                        {job.title}
                    </div>
                    <div className="text-sm text-gray-500">
                        {formatCents(job.value)} • {job.recurrence === RECURRENCE_TYPE.DAILY ? 'Daily' : 'Weekly'}
                        {job.allowMultipleCompletions && maxCompletions &&
                            ` • ${completionCount}/${maxCompletions}`
                        }
                    </div>
                    {isLocked && (
                        <div className="text-xs text-orange-600 mt-1">
                            Complete {job.unlockConditions?.dailyChores || 0} daily chores to unlock
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {canComplete && (
                        <button
                            onClick={() => onComplete(1)}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold shadow-md"
                        >
                            ✓ Done
                        </button>
                    )}
                    {hasPending && (
                        <div className="bg-yellow-200 text-yellow-800 px-3 py-2 rounded-lg text-sm font-bold">
                            PENDING
                        </div>
                    )}
                    {isDone && !hasPending && (
                        <div className="bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-bold">
                            COMPLETE
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FamilyEconomyApp;
