import React, { useState, useEffect, useCallback, useRef } from 'react';

// Import Family Economy system
import {
    useFamilyEconomy,
    loadFamilyEconomyState,
    usePatternLock,
    useMoneyAnimations,
    useSoundSystem,
    useEmailRecovery,

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
    PatternRecoveryModal,

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
    // Sound system with Web Audio API
    const soundSystem = useSoundSystem();

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

    // Email recovery for pattern lock (feature flagged - see config/features.js)
    const emailRecovery = useEmailRecovery({
        onRecoverySuccess: () => {
            // Pattern was reset - trigger setup mode on next parent action
            economy.setParentPassword(null);
        }
    });

    // UI State
    const [activeTab, setActiveTab] = useState('chores'); // 'chores', 'jobs'
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [showRecoveryModal, setShowRecoveryModal] = useState(false);
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

        // Helper to check if user already has this chore assigned
        const userHasChore = (userId) => {
            return economy.chores.some(c =>
                c.userId === userId &&
                c.name === choreData.name &&
                c.icon === choreData.icon &&
                c.recurrence === choreData.recurrence &&
                c.id !== editingChore?.id // Exclude the chore being edited
            );
        };

        if (editingChore) {
            if (choreForm.assignTo.length === 0) {
                // Unassign - make inactive (set userId to null)
                economy.updateChore(editingChore.id, { ...choreData, userId: null });
            } else {
                // Update existing chore with first selected user
                economy.updateChore(editingChore.id, { ...choreData, userId: choreForm.assignTo[0] });
                // If additional users selected, create new chores for them (skip duplicates)
                choreForm.assignTo.slice(1).forEach(userId => {
                    if (!userHasChore(userId)) {
                        economy.addChore(choreData, userId);
                    }
                });
            }
        } else {
            if (choreForm.assignTo.length === 0) {
                // Create unassigned chore (inactive/library item)
                economy.addChore(choreData, null);
            } else {
                // Create new chore for each selected user (skip duplicates)
                choreForm.assignTo.forEach(userId => {
                    if (!userHasChore(userId)) {
                        economy.addChore(choreData, userId);
                    }
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

    // Spending modal state
    const [showSpendingModal, setShowSpendingModal] = useState(false);
    const [spendingForm, setSpendingForm] = useState({ amount: '', description: '' });

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
            // Will go to parent review - play approval needed sound
            soundSystem.approvalNeeded();
        } else {
            // Completed instantly
            soundSystem.taskComplete();
        }
    };

    // Handle job completion
    const handleCompleteJob = (jobId, count = 1) => {
        const result = economy.completeJob(jobId, count);
        if (result?.success && result?.earned) {
            // Pass count to show multiplier in animation
            showEarning(result.earned, result.jobTitle, true, count);
            // Play cash register sound for earning money
            soundSystem.cashRegister();
        } else if (result?.requiresApproval) {
            soundSystem.approvalNeeded();
        } else {
            soundSystem.taskComplete();
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
        <div className="min-h-screen bg-slate-900">
            {/* Header */}
            <header className="bg-slate-800 border-b border-slate-700">
                <div className="max-w-lg mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowUserSelector(true)}
                                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 rounded-full px-3 py-2 transition-all"
                            >
                                <span className="text-2xl">{activeUser?.avatar || '👤'}</span>
                                <span className="text-white font-semibold">{activeUser?.name || 'Select User'}</span>
                                <span className="text-slate-400">▼</span>
                            </button>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Parent Review Button in Header - always show for parents */}
                            {isParent && (
                                <button
                                    onClick={() => requireParentAccess(() => setShowParentReview(true))}
                                    className={`relative ${pendingApprovalsCount > 0 ? 'bg-amber-500 hover:bg-amber-400' : 'bg-slate-600 hover:bg-slate-500'} text-white rounded-full p-2 transition-all`}
                                    title={pendingApprovalsCount > 0 ? "Review pending approvals" : "No pending approvals"}
                                >
                                    <span className="text-xl">👨‍👩‍👧‍👦</span>
                                    {pendingApprovalsCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                            {pendingApprovalsCount}
                                        </span>
                                    )}
                                </button>
                            )}

                            {/* Balance Display - Clickable for History */}
                            <button
                                onClick={() => setShowHistoryModal(true)}
                                className="text-right hover:bg-slate-700/50 rounded-lg px-2 py-1 -mr-2 transition-colors"
                            >
                                <div className="text-slate-400 text-xs">Balance</div>
                                <div className="text-emerald-400 font-bold text-xl">
                                    {formatCents(activeUser?.cashBalance || 0)}
                                </div>
                                {(activeUser?.pendingBalance || 0) > 0 && (
                                    <div className="text-amber-400 text-xs">
                                        +{formatCents(activeUser.pendingBalance)} pending
                                    </div>
                                )}
                            </button>

                            {/* Sound Toggle */}
                            <button
                                onClick={() => {
                                    soundSystem.toggleEnabled();
                                    soundSystem.buttonClick();
                                }}
                                className="text-2xl opacity-80 hover:opacity-100"
                            >
                                {soundSystem.settings.enabled ? '🔊' : '🔇'}
                            </button>
                        </div>
                    </div>

                    {/* Streak Display */}
                    {activeUser?.currentStreak > 0 && (
                        <div className="mt-2 flex items-center justify-center gap-2 text-amber-400">
                            <span className="text-xl">🔥</span>
                            <span className="font-bold">{activeUser.currentStreak} Day Streak!</span>
                        </div>
                    )}
                </div>
            </header>

            {/* Navigation Tabs */}
            <nav className="bg-slate-800 border-b border-slate-700">
                <div className="max-w-lg mx-auto px-4">
                    <div className="flex">
                        {[
                            { id: 'chores', label: 'Tasks', icon: '✓' },
                            { id: 'jobs', label: 'Jobs', icon: '💵' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    soundSystem.tabSwitch();
                                }}
                                className={`flex-1 py-3 text-center font-semibold transition-all relative flex items-center justify-center gap-2 ${
                                    activeTab === tab.id
                                        ? 'text-white border-b-2 border-violet-500'
                                        : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                <span>{tab.icon}</span>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-lg mx-auto px-4 py-6">
                {/* Chores Tab */}
                {activeTab === 'chores' && (
                    <div className="space-y-6">
                        {/* Daily Chores */}
                        <div>
                            <h2 className="text-slate-200 font-bold text-lg mb-3 flex items-center gap-2">
                                <span className="text-violet-400">◉</span> Daily Tasks
                            </h2>
                            <div className="space-y-3">
                                {userChores.filter(c => c.recurrence === RECURRENCE_TYPE.DAILY).map(chore => (
                                    <ChoreCardSimple
                                        key={chore.id}
                                        chore={chore}
                                        onComplete={() => handleCompleteChore(chore.id)}
                                    />
                                ))}
                                {userChores.filter(c => c.recurrence === RECURRENCE_TYPE.DAILY).length === 0 && (
                                    <div className="text-slate-500 text-center py-4 bg-slate-800/50 rounded-xl">No daily tasks yet</div>
                                )}
                            </div>
                        </div>

                        {/* Weekly Chores */}
                        <div>
                            <h2 className="text-slate-200 font-bold text-lg mb-3 flex items-center gap-2">
                                <span className="text-cyan-400">◎</span> Weekly Tasks
                            </h2>
                            <div className="space-y-3">
                                {userChores.filter(c => c.recurrence === RECURRENCE_TYPE.WEEKLY).map(chore => (
                                    <ChoreCardSimple
                                        key={chore.id}
                                        chore={chore}
                                        onComplete={() => handleCompleteChore(chore.id)}
                                    />
                                ))}
                                {userChores.filter(c => c.recurrence === RECURRENCE_TYPE.WEEKLY).length === 0 && (
                                    <div className="text-slate-500 text-center py-4 bg-slate-800/50 rounded-xl">No weekly tasks yet</div>
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
                                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold flex items-center justify-center gap-2 border border-dashed border-slate-600"
                            >
                                <span>⚙</span> Manage Tasks & Jobs
                            </button>
                        )}
                    </div>
                )}

                {/* Jobs Tab */}
                {activeTab === 'jobs' && (
                    <div className="space-y-4">
                        <div className="bg-slate-800 rounded-xl p-4 mb-4 border border-slate-700">
                            <p className="text-slate-300 text-sm">
                                💡 Jobs earn real money! Complete your daily tasks to unlock jobs.
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
                            <div className="text-slate-500 text-center py-8 bg-slate-800/50 rounded-xl">
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
                                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold flex items-center justify-center gap-2 border border-dashed border-slate-600"
                            >
                                <span>⚙</span> Manage Tasks & Jobs
                            </button>
                        )}
                    </div>
                )}

            </main>

            {/* History Modal */}
            {showHistoryModal && (
                <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
                    <div className="modal-content bg-slate-800 border border-slate-700" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', maxHeight: '80vh', overflow: 'auto' }}>
                        <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
                            <span className="text-emerald-400">$</span> {activeUser?.name}'s Balance
                        </h2>

                        {/* Balance Summary */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-slate-900/50 rounded-lg p-3">
                                <div className="text-slate-400 text-sm">Available</div>
                                <div className="text-2xl font-bold text-emerald-400">
                                    {formatCents(activeUser?.cashBalance || 0)}
                                </div>
                            </div>
                            <div className="bg-slate-900/50 rounded-lg p-3">
                                <div className="text-slate-400 text-sm">Pending</div>
                                <div className="text-2xl font-bold text-amber-400">
                                    {formatCents(activeUser?.pendingBalance || 0)}
                                </div>
                            </div>
                        </div>

                        {/* Spend Money Button - Password Protected */}
                        {isParent && activeUser && (activeUser.cashBalance || 0) > 0 && (
                            <button
                                onClick={() => requireParentAccess(() => {
                                    setSpendingForm({ amount: '', description: '' });
                                    setShowHistoryModal(false);
                                    setShowSpendingModal(true);
                                })}
                                className="w-full mb-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
                            >
                                <span>💸</span> Record Spending
                            </button>
                        )}

                        {/* Transaction List */}
                        <div className="border-t border-slate-700 pt-4">
                            <h3 className="font-bold text-slate-200 mb-3">Recent Transactions</h3>
                            {userTransactions.length > 0 ? (
                                <div className="space-y-2">
                                    {userTransactions.slice(0, 15).map(tx => (
                                        <div key={tx.id} className="flex items-center justify-between py-3 border-b border-slate-700 last:border-0">
                                            <div>
                                                <div className="font-medium text-slate-200">{tx.description}</div>
                                                <div className="text-xs text-slate-500">
                                                    {new Date(tx.date).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div className={`font-bold ${tx.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {tx.amount >= 0 ? '+' : ''}{formatCents(tx.amount)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-slate-500 text-center py-4">
                                    No transactions yet
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setShowHistoryModal(false)}
                            className="w-full mt-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl font-semibold"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* User Selector Modal */}
            {showUserSelector && (
                <div className="modal-overlay" onClick={() => setShowUserSelector(false)}>
                    <div className="modal-content bg-slate-800 border border-slate-700" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-slate-100 mb-4">Select User</h2>
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
                                            ? 'bg-violet-600/30 border-2 border-violet-500'
                                            : 'bg-slate-700 hover:bg-slate-600 border-2 border-transparent'
                                    }`}
                                >
                                    <span className="text-3xl">{user.avatar}</span>
                                    <div className="text-left flex-1">
                                        <div className="font-semibold text-slate-100">{user.name}</div>
                                        <div className="text-sm text-slate-400">{user.role}</div>
                                    </div>
                                    <div className="text-emerald-400 font-bold">{formatCents(user.cashBalance)}</div>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => {
                                setShowUserSelector(false);
                                requireParentAccess(() => openUserEditor());
                            }}
                            className="w-full mt-4 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold"
                        >
                            + Add Family Member
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
                    emailRecovery={emailRecovery}
                />
            )}

            {patternLock.isVerifying && (
                <PasswordEntryModal
                    isOpen={true}
                    onClose={() => patternLock.cancel()}
                    patternLock={patternLock}
                    onForgotPattern={() => {
                        patternLock.cancel();
                        setShowRecoveryModal(true);
                    }}
                />
            )}

            {/* Pattern Recovery Modal (Email-based) */}
            <PatternRecoveryModal
                isOpen={showRecoveryModal}
                onClose={() => setShowRecoveryModal(false)}
                emailRecovery={emailRecovery}
                onRecoveryComplete={() => setShowRecoveryModal(false)}
            />

            {/* Chore Editor Modal */}
            {showChoreEditor && (
                <div className="modal-overlay" onClick={closeChoreEditor}>
                    <div className="modal-content bg-slate-800 border border-slate-700" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-slate-100 mb-4">
                            {editingChore ? 'Edit Task' : 'New Task'}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={choreForm.name}
                                    onChange={(e) => setChoreForm({...choreForm, name: e.target.value})}
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                                    placeholder="e.g., Make bed"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Icon</label>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(CHORE_ICONS).map(([key, icon]) => (
                                        <button
                                            key={key}
                                            onClick={() => setChoreForm({...choreForm, icon})}
                                            className={`text-2xl p-2 rounded-lg ${choreForm.icon === icon ? 'bg-violet-600 ring-2 ring-violet-400' : 'bg-slate-700 hover:bg-slate-600'}`}
                                        >
                                            {icon}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Frequency</label>
                                <select
                                    value={choreForm.repeatType}
                                    onChange={(e) => setChoreForm({...choreForm, repeatType: e.target.value})}
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100"
                                >
                                    <option value={RECURRENCE_TYPE.DAILY}>Daily</option>
                                    <option value={RECURRENCE_TYPE.WEEKLY}>Weekly</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Assign To (optional)
                                </label>
                                <p className="text-xs text-slate-500 mb-2">
                                    Leave empty to save to library. Select people to make it active.
                                </p>
                                {assignableUsers.length === 0 ? (
                                    <p className="text-xs text-amber-400">No family members yet. Task will be saved to library.</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2 p-2 border border-slate-600 rounded-lg bg-slate-900/50">
                                        {assignableUsers.map(user => (
                                            <button
                                                key={user.id}
                                                type="button"
                                                onClick={() => toggleChoreAssignment(user.id)}
                                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                                                    choreForm.assignTo.includes(user.id)
                                                        ? 'bg-violet-600 text-white'
                                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
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
                                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveChore}
                                className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold"
                            >
                                {editingChore
                                    ? 'Save'
                                    : choreForm.assignTo.length === 0
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
                    <div className="modal-content bg-slate-800 border border-slate-700" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-slate-100 mb-4">
                            {editingJob ? 'Edit Job' : 'New Job'}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={jobForm.title}
                                    onChange={(e) => setJobForm({...jobForm, title: e.target.value})}
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-violet-500"
                                    placeholder="e.g., Vacuum living room"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Value ($)</label>
                                <input
                                    type="number"
                                    step="0.25"
                                    min="0"
                                    value={(jobForm.value / 100).toFixed(2)}
                                    onChange={(e) => setJobForm({...jobForm, value: Math.round(parseFloat(e.target.value || 0) * 100)})}
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Frequency</label>
                                <select
                                    value={jobForm.recurrence}
                                    onChange={(e) => setJobForm({...jobForm, recurrence: e.target.value})}
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100"
                                >
                                    <option value={RECURRENCE_TYPE.DAILY}>Daily</option>
                                    <option value={RECURRENCE_TYPE.WEEKLY}>Weekly</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Unlock Condition
                                </label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg cursor-pointer border border-slate-600">
                                        <input
                                            type="radio"
                                            name="unlockType"
                                            checked={!jobForm.unlockConditions.requireAllChores && jobForm.unlockConditions.dailyChores === 0}
                                            onChange={() => setJobForm({
                                                ...jobForm,
                                                unlockConditions: { dailyChores: 0, weeklyChores: 0, requireAllChores: false }
                                            })}
                                            className="w-4 h-4"
                                        />
                                        <div>
                                            <span className="text-slate-200 font-medium">Always Available</span>
                                            <p className="text-xs text-slate-400">No unlock requirements</p>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg cursor-pointer border border-slate-600">
                                        <input
                                            type="radio"
                                            name="unlockType"
                                            checked={jobForm.unlockConditions.requireAllChores === true}
                                            onChange={() => setJobForm({
                                                ...jobForm,
                                                unlockConditions: { dailyChores: 0, weeklyChores: 0, requireAllChores: true }
                                            })}
                                            className="w-4 h-4"
                                        />
                                        <div>
                                            <span className="text-slate-200 font-medium">All Tasks Completed</span>
                                            <p className="text-xs text-slate-400">Requires all assigned tasks to be done & approved</p>
                                        </div>
                                    </label>
                                </div>
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
                                    className="w-5 h-5 rounded bg-slate-700 border-slate-600"
                                />
                                <label htmlFor="allowMultiple" className="text-sm font-medium text-slate-300">
                                    Allow multiple completions per day
                                </label>
                            </div>
                            {jobForm.allowMultipleCompletions && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">
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
                                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100"
                                    />
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="requiresApproval"
                                    checked={jobForm.requiresApproval}
                                    onChange={(e) => setJobForm({...jobForm, requiresApproval: e.target.checked})}
                                    className="w-5 h-5 rounded bg-slate-700 border-slate-600"
                                />
                                <label htmlFor="requiresApproval" className="text-sm font-medium text-slate-300">
                                    Requires parent approval
                                </label>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Assign To (optional)
                                </label>
                                <p className="text-xs text-slate-500 mb-2">
                                    Leave empty to save to library. Select people to make it active.
                                </p>
                                {assignableUsers.length === 0 ? (
                                    <p className="text-xs text-amber-400">No family members yet. Job will be saved to library.</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2 p-2 border border-slate-600 rounded-lg bg-slate-900/50">
                                        {assignableUsers.map(user => (
                                            <button
                                                key={user.id}
                                                type="button"
                                                onClick={() => toggleJobAssignment(user.id)}
                                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                                                    jobForm.assignTo.includes(user.id)
                                                        ? 'bg-violet-600 text-white'
                                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
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
                                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveJob}
                                className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold"
                            >
                                {editingJob
                                    ? 'Save'
                                    : jobForm.assignTo.length === 0
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
                    <div className="modal-content bg-slate-800 border border-slate-700" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-slate-100 mb-4">
                            {editingUser ? 'Edit Family Member' : 'Add Family Member'}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={userForm.name}
                                    onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-violet-500"
                                    placeholder="e.g., Emma"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Avatar</label>
                                <div className="flex flex-wrap gap-2">
                                    {['👧', '👦', '👩', '👨', '👶', '🧒', '👱‍♀️', '👱', '🧑', '👴', '👵'].map(emoji => (
                                        <button
                                            key={emoji}
                                            onClick={() => setUserForm({...userForm, avatar: emoji})}
                                            className={`text-2xl p-2 rounded-lg ${userForm.avatar === emoji ? 'bg-violet-600 ring-2 ring-violet-400' : 'bg-slate-700 hover:bg-slate-600'}`}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Role</label>
                                <select
                                    value={userForm.role}
                                    onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100"
                                >
                                    <option value="child">Child</option>
                                    <option value="parent">Parent</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowUserEditor(false)}
                                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveUser}
                                className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold"
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
                    <div className="modal-content bg-slate-800 border border-slate-700" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', maxHeight: '80vh', overflow: 'auto' }}>
                        <h2 className="text-xl font-bold text-slate-100 mb-4">
                            Parent Review
                        </h2>
                        {pendingApprovalsCount === 0 ? (
                            <p className="text-slate-400 text-center py-4">No items pending approval!</p>
                        ) : (
                            <div className="space-y-4">
                                {/* Pending Chores */}
                                {choresNeedingApproval.length > 0 && (
                                    <>
                                        <h3 className="font-semibold text-slate-300 text-sm">Tasks</h3>
                                        {choresNeedingApproval.map(chore => {
                                            const user = economy.users.find(u => u.id === chore.userId);
                                            return (
                                                <div key={chore.id} className="bg-slate-700/50 rounded-xl p-4 border border-slate-600">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <span className="text-2xl">{chore.icon || '✓'}</span>
                                                        <div className="flex-1">
                                                            <div className="font-semibold text-slate-100">{chore.name}</div>
                                                            <div className="text-sm text-slate-400">
                                                                {user?.name}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => {
                                                                economy.approveChore(chore.id, 'parent');
                                                                soundSystem.approved();
                                                            }}
                                                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold"
                                                        >
                                                            ✓ Approve
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                economy.updateChore(chore.id, { pendingApproval: false, completed: false });
                                                                soundSystem.rejected();
                                                            }}
                                                            className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold"
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
                                        <h3 className="font-semibold text-slate-300 text-sm mt-4">Jobs</h3>
                                        {economy.jobsNeedingApproval.map(job => {
                                            const pendingCount = job.completions.filter(c => c.status === 'pending').length;
                                            const pendingValue = pendingCount * job.value;
                                            const user = economy.users.find(u => u.id === job.userId);
                                            return (
                                                <div key={job.id} className="bg-slate-700/50 rounded-xl p-4 border border-slate-600">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <span className="text-2xl">{job.icon || '💵'}</span>
                                                        <div className="flex-1">
                                                            <div className="font-semibold text-slate-100">{job.title}</div>
                                                            <div className="text-sm text-slate-400">
                                                                {user?.name} • {pendingCount}x = <span className="text-emerald-400">{formatCents(pendingValue)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => {
                                                                economy.approveJob(job.id, 'parent');
                                                                soundSystem.approved();
                                                                soundSystem.cashRegister();
                                                            }}
                                                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold"
                                                        >
                                                            ✓ Approve
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                economy.rejectJob(job.id, 'parent');
                                                                soundSystem.rejected();
                                                            }}
                                                            className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold"
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
                            className="w-full mt-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl font-semibold"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Unified Management Modal */}
            {showManagement && (
                <div className="modal-overlay" onClick={() => setShowManagement(false)}>
                    <div className="modal-content bg-slate-800 border border-slate-700" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '80vh', overflow: 'auto' }}>
                        <h2 className="text-xl font-bold text-slate-100 mb-4">
                            Manage Tasks & Jobs
                        </h2>

                        {/* Tabs */}
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => {
                                    setManagementTab('chores');
                                    soundSystem.tabSwitch();
                                }}
                                className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                                    managementTab === 'chores'
                                        ? 'bg-violet-600 text-white'
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                            >
                                Tasks
                            </button>
                            <button
                                onClick={() => {
                                    setManagementTab('jobs');
                                    soundSystem.tabSwitch();
                                }}
                                className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                                    managementTab === 'jobs'
                                        ? 'bg-violet-600 text-white'
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                            >
                                Jobs
                            </button>
                            <button
                                onClick={() => {
                                    setManagementTab('library');
                                    soundSystem.tabSwitch();
                                }}
                                className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                                    managementTab === 'library'
                                        ? 'bg-violet-600 text-white'
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                            >
                                Library
                                {(libraryChores.length > 0 || libraryJobs.length > 0) && (
                                    <span className="ml-1 bg-violet-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                        {libraryChores.length + libraryJobs.length}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Chores Tab Content */}
                        {managementTab === 'chores' && (
                            <div className="space-y-4">
                                <p className="text-sm text-slate-400 mb-2">
                                    Create tasks and assign them to family members.
                                </p>

                                {/* Add New Chore Button */}
                                <button
                                    onClick={() => {
                                        setOpenedFromManagement(true);
                                        setShowManagement(false);
                                        openChoreEditor();
                                    }}
                                    className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
                                >
                                    <span>+</span> Create New Task
                                </button>

                                {/* Existing Chores List - Grouped */}
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-slate-300">All Tasks:</h4>
                                    {Object.keys(groupedChores).length === 0 ? (
                                        <p className="text-slate-500 text-sm">No tasks created yet.</p>
                                    ) : (
                                        Object.values(groupedChores).map((group, idx) => (
                                            <div key={idx} className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">{group.icon}</span>
                                                    <div className="flex-1">
                                                        <div className="font-medium text-slate-100">{group.name}</div>
                                                        <div className="text-xs text-slate-400">{group.recurrence}</div>
                                                    </div>
                                                </div>
                                                <div className="mt-2 flex flex-wrap gap-1">
                                                    {group.assignments.map(assignment => (
                                                        <span
                                                            key={assignment.choreId}
                                                            className="inline-flex items-center gap-1 bg-violet-600/30 text-violet-300 px-2 py-1 rounded-full text-xs border border-violet-500/30"
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
                                                                className="ml-1 text-violet-400 hover:text-violet-200"
                                                                title="Edit this assignment"
                                                            >
                                                                ✎
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
                                <p className="text-sm text-slate-400 mb-2">
                                    Create paid jobs and assign them to family members.
                                </p>

                                {/* Add New Job Button */}
                                <button
                                    onClick={() => {
                                        setOpenedFromManagement(true);
                                        setShowManagement(false);
                                        openJobEditor();
                                    }}
                                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
                                >
                                    <span>+</span> Create New Job
                                </button>

                                {/* Existing Jobs List - Grouped */}
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-slate-300">All Jobs:</h4>
                                    {Object.keys(groupedJobs).length === 0 ? (
                                        <p className="text-slate-500 text-sm">No jobs created yet.</p>
                                    ) : (
                                        Object.values(groupedJobs).map((group, idx) => (
                                            <div key={idx} className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">{group.icon}</span>
                                                    <div className="flex-1">
                                                        <div className="font-medium text-slate-100">{group.title}</div>
                                                        <div className="text-xs text-slate-400">
                                                            <span className="text-emerald-400">{formatCents(group.value)}</span> • {group.recurrence}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-2 flex flex-wrap gap-1">
                                                    {group.assignments.map(assignment => (
                                                        <span
                                                            key={assignment.jobId}
                                                            className="inline-flex items-center gap-1 bg-emerald-600/30 text-emerald-300 px-2 py-1 rounded-full text-xs border border-emerald-500/30"
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
                                                                className="ml-1 text-emerald-400 hover:text-emerald-200"
                                                                title="Edit this assignment"
                                                            >
                                                                ✎
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
                                <p className="text-sm text-slate-400 mb-2">
                                    Unassigned tasks and jobs. Edit to assign to family members.
                                </p>

                                {/* Library Chores */}
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-slate-300">Tasks in Library:</h4>
                                    {libraryChores.length === 0 ? (
                                        <p className="text-slate-500 text-sm">No unassigned tasks. Create a task and leave assignment empty to add here.</p>
                                    ) : (
                                        libraryChores.map(chore => (
                                            <div key={chore.id} className="bg-slate-700/50 rounded-lg p-3 flex items-center gap-3 border border-slate-600">
                                                <span className="text-2xl">{chore.icon}</span>
                                                <div className="flex-1">
                                                    <div className="font-medium text-slate-100">{chore.name}</div>
                                                    <div className="text-xs text-slate-400">{chore.recurrence}</div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setOpenedFromManagement(true);
                                                        setShowManagement(false);
                                                        openChoreEditor(chore);
                                                    }}
                                                    className="bg-violet-600 hover:bg-violet-500 text-white px-3 py-1 rounded-lg text-sm font-medium"
                                                >
                                                    Assign
                                                </button>
                                                <button
                                                    onClick={() => economy.deleteChore(chore.id)}
                                                    className="text-red-400 hover:text-red-300 px-2"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Library Jobs */}
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-slate-300">Jobs in Library:</h4>
                                    {libraryJobs.length === 0 ? (
                                        <p className="text-slate-500 text-sm">No unassigned jobs. Create a job and leave assignment empty to add here.</p>
                                    ) : (
                                        libraryJobs.map(job => (
                                            <div key={job.id} className="bg-slate-700/50 rounded-lg p-3 flex items-center gap-3 border border-slate-600">
                                                <span className="text-2xl">{job.icon || '💵'}</span>
                                                <div className="flex-1">
                                                    <div className="font-medium text-slate-100">{job.title}</div>
                                                    <div className="text-xs text-slate-400">
                                                        <span className="text-emerald-400">{formatCents(job.value)}</span> • {job.recurrence}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setOpenedFromManagement(true);
                                                        setShowManagement(false);
                                                        openJobEditor(job);
                                                    }}
                                                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-lg text-sm font-medium"
                                                >
                                                    Assign
                                                </button>
                                                <button
                                                    onClick={() => economy.deleteJob(job.id)}
                                                    className="text-red-400 hover:text-red-300 px-2"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => setShowManagement(false)}
                            className="w-full mt-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl font-semibold"
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

            {/* Spending Modal */}
            {showSpendingModal && (
                <div className="modal-overlay" onClick={() => setShowSpendingModal(false)}>
                    <div className="modal-content bg-slate-800 border border-slate-700" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
                            <span className="text-red-400">💸</span> Record Spending
                        </h2>
                        <p className="text-sm text-slate-400 mb-4">
                            Deduct money from {activeUser?.name}'s balance (current: {formatCents(activeUser?.cashBalance || 0)})
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Amount ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max={(activeUser?.cashBalance || 0) / 100}
                                    value={spendingForm.amount}
                                    onChange={(e) => setSpendingForm({...spendingForm, amount: e.target.value})}
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-red-500"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Description <span className="text-slate-500">(optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={spendingForm.description}
                                    onChange={(e) => setSpendingForm({...spendingForm, description: e.target.value})}
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-red-500"
                                    placeholder="e.g., Toy store, Ice cream, etc."
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowSpendingModal(false)}
                                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    const amountCents = Math.round(parseFloat(spendingForm.amount || 0) * 100);
                                    if (amountCents <= 0 || amountCents > (activeUser?.cashBalance || 0)) return;
                                    const description = spendingForm.description.trim() || 'Spending';
                                    economy.redeemCash(activeUser.id, amountCents, description);
                                    soundSystem.purchase();
                                    setShowSpendingModal(false);
                                }}
                                disabled={
                                    !spendingForm.amount ||
                                    parseFloat(spendingForm.amount) <= 0 ||
                                    Math.round(parseFloat(spendingForm.amount || 0) * 100) > (activeUser?.cashBalance || 0)
                                }
                                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Deduct {spendingForm.amount ? formatCents(Math.round(parseFloat(spendingForm.amount) * 100)) : '$0.00'}
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
            return 'bg-emerald-900/40 border border-emerald-500/50';
        }
        if (isPending) {
            return 'bg-amber-900/30 border border-amber-500/50';
        }
        return 'bg-slate-800 border border-slate-700 hover:border-slate-600';
    };

    return (
        <div className={`rounded-xl p-4 transition-all ${getCardStyle()}`}>
            <div className="flex items-center gap-3">
                {/* Status indicator overlay on icon */}
                <div className="relative">
                    <span className={`text-3xl ${isCompleted ? 'opacity-50' : ''}`}>{chore.icon}</span>
                    {isCompleted && !isPending && (
                        <div className="absolute -top-1 -right-1 bg-emerald-500 rounded-full w-5 h-5 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">✓</span>
                        </div>
                    )}
                    {isPending && (
                        <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full w-5 h-5 flex items-center justify-center">
                            <span className="text-white text-xs">◔</span>
                        </div>
                    )}
                </div>
                <div className="flex-1">
                    <div className={`font-semibold ${isCompleted ? 'text-emerald-400' : isPending ? 'text-amber-400' : 'text-slate-100'}`}>
                        {chore.name}
                    </div>
                    <div className="text-sm text-slate-400">
                        {chore.recurrence === RECURRENCE_TYPE.DAILY ? 'Daily' : 'Weekly'}
                    </div>
                </div>
                <div className="flex gap-2 items-center">
                    {!isCompleted && !isPending && (
                        <button
                            onClick={onComplete}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-semibold"
                        >
                            ✓ Done
                        </button>
                    )}
                    {isPending && (
                        <div className="bg-amber-500/20 text-amber-400 border border-amber-500/50 px-3 py-2 rounded-lg text-sm font-bold">
                            PENDING
                        </div>
                    )}
                    {isCompleted && !isPending && (
                        <div className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 px-3 py-2 rounded-lg text-sm font-bold">
                            DONE
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

    // Check for pending completions in current period
    const hasPending = job.completions?.some(c => {
        if (c.status !== 'pending') return false;
        if (job.recurrence === RECURRENCE_TYPE.DAILY) {
            const today = new Date().toDateString();
            return new Date(c.timestamp).toDateString() === today;
        }
        // Weekly - all completions in array are current period
        return true;
    }) || false;

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
            return 'bg-slate-800/50 border border-slate-600 opacity-60';
        }
        if (isDone && !hasPending) {
            return 'bg-emerald-900/40 border border-emerald-500/50';
        }
        if (hasPending) {
            return 'bg-amber-900/30 border border-amber-500/50';
        }
        return 'bg-slate-800 border border-slate-700 hover:border-slate-600';
    };

    return (
        <div className={`rounded-xl p-4 transition-all ${getCardStyle()}`}>
            <div className="flex items-center gap-3">
                {/* Status indicator overlay on icon */}
                <div className="relative">
                    <span className={`text-3xl ${isDone ? 'opacity-50' : ''}`}>{job.icon || '💵'}</span>
                    {isDone && !hasPending && (
                        <div className="absolute -top-1 -right-1 bg-emerald-500 rounded-full w-5 h-5 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">✓</span>
                        </div>
                    )}
                    {hasPending && (
                        <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full w-5 h-5 flex items-center justify-center">
                            <span className="text-white text-xs">◔</span>
                        </div>
                    )}
                    {isLocked && (
                        <div className="absolute -top-1 -right-1 bg-slate-500 rounded-full w-5 h-5 flex items-center justify-center">
                            <span className="text-white text-xs">🔒</span>
                        </div>
                    )}
                </div>
                <div className="flex-1">
                    <div className={`font-semibold ${isDone ? 'text-emerald-400' : hasPending ? 'text-amber-400' : isLocked ? 'text-slate-500' : 'text-slate-100'}`}>
                        {job.title}
                    </div>
                    <div className="text-sm text-slate-400">
                        <span className="text-emerald-400">{formatCents(job.value)}</span> • {job.recurrence === RECURRENCE_TYPE.DAILY ? 'Daily' : 'Weekly'}
                        {job.allowMultipleCompletions && maxCompletions &&
                            ` • ${completionCount}/${maxCompletions}`
                        }
                    </div>
                    {isLocked && (
                        <div className="text-xs text-amber-500 mt-1">
                            {job.unlockConditions?.requireAllChores
                                ? 'Complete all tasks to unlock'
                                : `Complete ${job.unlockConditions?.dailyChores || 0} daily tasks to unlock`
                            }
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {hasPending && (
                        <div className="bg-amber-500/20 text-amber-400 border border-amber-500/50 px-3 py-2 rounded-lg text-sm font-bold">
                            PENDING
                        </div>
                    )}
                    {isDone && !hasPending && (
                        <div className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 px-3 py-2 rounded-lg text-sm font-bold">
                            DONE
                        </div>
                    )}
                    {canComplete && (
                        <button
                            onClick={() => onComplete(1)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-semibold"
                        >
                            ✓ Done
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FamilyEconomyApp;
