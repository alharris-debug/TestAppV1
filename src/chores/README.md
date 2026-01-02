# Chore Management System & Family Economy

A complete, modular chore management and family economy system for teaching kids about money management.

## Features

### Core Chore System
- **CRUD Operations**: Create, Read, Update, Delete chores
- **Parent Approval Workflow**: Children complete chores, parents review and approve
- **Three Repeat Modes**:
  - `once`: Complete once, then permanently removed
  - `daily`: Resets each day at midnight
  - `multiple`: Can be completed multiple times per day
- **Save for Later**: Archive chores temporarily
- **9-Dot Pattern Lock**: Secure parent-only access
- **Automatic Daily Reset**: Tasks reset at midnight
- **Streak Tracking**: Bonus gems for consecutive day streaks

### Family Economy System (NEW)
- **Multi-User Profiles**: Support for parents and children
- **Jobs with Cash Rewards**: Paid tasks stored in cents to avoid floating-point errors
- **Daily/Weekly Recurrence**: Jobs and chores reset on configurable schedules
- **Lock/Unlock Logic**: Jobs unlock after completing required chores
- **Multiple Completion Events**: Track multiple completions per period (e.g., "washed 6 windows")
- **Cash Balance Tracking**: Real-time balance with pending/approved amounts
- **Transaction History**: Full history of earnings and spending
- **Money Animations**: Visual feedback with flying bills, coin rain, and toasts
- **Redemption System**: Children can spend earned cash on rewards

### Data Persistence
- **localStorage**: All data saved automatically
- **Offline-First**: Works without network connectivity

## Directory Structure

```
src/chores/
├── index.js              # Main exports
├── schema.js             # Data types and factory functions
├── constants.js          # Configuration constants
├── types.js              # JSDoc type definitions
├── README.md             # Documentation
├── components/
│   ├── ChoreCard.jsx     # Chore display components
│   ├── ChoreEditor.jsx   # Add/Edit chore modal
│   ├── ChoreList.jsx     # Main chores view
│   ├── ChoreManagement.jsx  # Parent settings modal
│   ├── ParentReview.jsx  # Approval modal
│   ├── PatternLock.jsx   # Pattern lock components
│   ├── UserProfile.jsx   # User profile & selection
│   ├── JobCard.jsx       # Job cards with lock/unlock
│   ├── JobEditor.jsx     # Job creation/editing modal
│   ├── TransactionHistory.jsx  # Transaction history view
│   └── MoneyAnimation.jsx      # Money animations
├── hooks/
│   ├── useChoreManagement.js  # Core chore state/logic
│   ├── usePatternLock.js      # Pattern lock state/logic
│   └── useFamilyEconomy.js    # Family economy state/logic
├── utils/
│   ├── choreHelpers.js   # Chore utility functions
│   ├── patternLock.js    # Pattern lock utilities
│   ├── storage.js        # localStorage helpers
│   ├── currency.js       # Currency formatting (cents-based)
│   ├── dateTime.js       # Daily/weekly reset logic
│   └── jobHelpers.js     # Job lock/unlock utilities
└── styles/
    └── chores.css        # All chore-related styles
```

## Usage

### Family Economy Setup (Recommended)

```javascript
import {
  useFamilyEconomy,
  usePatternLock,
  useMoneyAnimations,
  ActiveUserHeader,
  UserSelector,
  JobList,
  JobEditorModal,
  TransactionHistory,
  RECURRENCE_TYPE
} from './chores';

// Import styles
import './chores/styles/chores.css';

function FamilyEconomyApp() {
  // Initialize family economy system
  const economy = useFamilyEconomy({
    savedState: localStorage.getItem('familyEconomy'),
    soundSystem: window.SoundSystem
  });

  // Initialize pattern lock for parent access
  const patternLock = usePatternLock({
    storedPassword: economy.parentPassword,
    onPasswordSet: economy.setParentPassword,
    onVerificationSuccess: () => {}
  });

  // Initialize money animations
  const { showEarning, showCashBurst, AnimationOverlay } = useMoneyAnimations();

  // Handle job completion
  const handleCompleteJob = (jobId, count = 1) => {
    const result = economy.completeJob(jobId, count);
    if (result.success) {
      showEarning(result.earned, result.jobTitle);
      showCashBurst(window.innerWidth / 2, window.innerHeight / 2, result.earned);
    }
  };

  return (
    <>
      {/* User Header with Balance */}
      <ActiveUserHeader
        user={economy.activeUser}
        onSwitchUser={() => economy.openUserSelector()}
      />

      {/* Job List with Lock/Unlock */}
      <JobList
        jobs={economy.userJobs}
        chores={economy.userChores}
        resetDay={economy.weeklyResetDay}
        onComplete={handleCompleteJob}
        onEdit={(job) => patternLock.requestAccess(() => economy.openJobEditor(job))}
      />

      {/* Transaction History */}
      <TransactionHistory
        transactions={economy.userTransactions}
        currentBalance={economy.activeUser?.balance || 0}
        pendingBalance={economy.activeUser?.pendingBalance || 0}
      />

      {/* Job Editor Modal */}
      <JobEditorModal
        isOpen={economy.showJobEditor}
        editingJob={economy.editingJob}
        form={economy.jobForm}
        onFormChange={economy.setJobForm}
        onSave={economy.editingJob ? economy.updateJob : economy.createJob}
        onClose={economy.closeJobEditor}
      />

      {/* Money Animation Overlay */}
      <AnimationOverlay />
    </>
  );
}
```

### Basic Chore Setup (Original)

```javascript
import {
  useChoreManagement,
  usePatternLock,
  ChoreList,
  ChoreEditorModal,
  ChoreManagementModal,
  ParentReviewModal,
  PasswordSetupModal,
  PasswordEntryModal
} from './chores';

// Import styles
import './chores/styles/chores.css';

function App() {
  const [gems, setGems] = useState(0);

  // Initialize chore management
  const choreManager = useChoreManagement({
    initialTasks: savedGame?.tasks,
    initialSavedChores: savedGame?.savedChores,
    initialPendingApproval: savedGame?.pendingApproval,
    initialParentPassword: savedGame?.parentPassword,
    initialStreak: savedGame?.streak || 0,
    onGemsAwarded: (amount) => setGems(g => g + amount),
    soundSystem: window.SoundSystem // Optional
  });

  // Initialize pattern lock
  const patternLock = usePatternLock({
    storedPassword: choreManager.parentPassword,
    onPasswordSet: choreManager.setParentPassword,
    onVerificationSuccess: () => {
      // Action after successful verification
    },
    soundSystem: window.SoundSystem // Optional
  });

  // Request parent access before opening management
  const handleOpenManagement = () => {
    patternLock.requestAccess(() => choreManager.openChoreManagement());
  };

  return (
    <>
      <ChoreList
        tasks={choreManager.tasks}
        streak={choreManager.streak}
        pendingApproval={choreManager.pendingApproval}
        onToggleTask={choreManager.toggleTask}
        onOpenManagement={handleOpenManagement}
        onOpenReview={() => patternLock.requestAccess(choreManager.openParentReview)}
        hasPendingChores={choreManager.hasPendingChores}
        allChoresComplete={choreManager.allChoresComplete}
        getPendingCount={choreManager.getPendingCount}
      />

      {/* Pattern Lock Modals */}
      <PasswordSetupModal
        isOpen={patternLock.isSettingUp}
        onClose={patternLock.cancel}
        onClear={patternLock.clearPattern}
        patternLock={patternLock}
      />

      <PasswordEntryModal
        isOpen={patternLock.isVerifying}
        onClose={patternLock.cancel}
        onClear={patternLock.clearPattern}
        patternLock={patternLock}
      />

      {/* Chore Management Modals */}
      <ChoreManagementModal
        isOpen={choreManager.showChoreManagement}
        onClose={choreManager.closeChoreManagement}
        activeTab={choreManager.choreManagementTab}
        onTabChange={choreManager.setChoreManagementTab}
        tasks={choreManager.tasks}
        savedChores={choreManager.savedChores}
        onAddNew={() => choreManager.openChoreEditor()}
        onEdit={choreManager.openChoreEditor}
        onSaveForLater={choreManager.saveChoreForLater}
        onDelete={choreManager.deleteChore}
        onRestore={choreManager.restoreChore}
        onDeleteSaved={choreManager.deleteSavedChore}
        onResetPassword={() => {
          choreManager.resetParentPassword();
          choreManager.closeChoreManagement();
        }}
      />

      <ChoreEditorModal
        isOpen={choreManager.showChoreEditor}
        editingChore={choreManager.editingChore}
        form={choreManager.choreForm}
        onFormChange={choreManager.setChoreForm}
        onSave={choreManager.editingChore
          ? choreManager.updateChore
          : choreManager.addNewChore}
        onClose={choreManager.closeChoreEditor}
      />

      <ParentReviewModal
        isOpen={choreManager.showParentReview}
        onClose={choreManager.closeParentReview}
        pendingApproval={choreManager.pendingApproval}
        reviewDecisions={choreManager.reviewDecisions}
        onDecide={choreManager.setReviewDecision}
        onSubmit={choreManager.submitReviews}
        canSubmit={choreManager.canSubmitReviews}
        reviewProgress={choreManager.reviewProgress}
        reviewTotal={choreManager.reviewTotal}
      />
    </>
  );
}
```

### Persistence

```javascript
import { saveChoreState, loadChoreState } from './chores';

// Load on mount
useEffect(() => {
  const saved = loadChoreState();
  if (saved) {
    // Initialize with saved data
  }
}, []);

// Save on state change
useEffect(() => {
  saveChoreState(choreManager.getState());
}, [choreManager.tasks, choreManager.pendingApproval, /* etc */]);
```

### Constants

```javascript
import { INITIAL_TASKS, CHORE_ICONS, REPEAT_TYPES } from './chores';

// Default tasks for new users
console.log(INITIAL_TASKS);

// Available icons for chore customization
console.log(CHORE_ICONS);

// Repeat type constants
console.log(REPEAT_TYPES.ONCE);    // 'once'
console.log(REPEAT_TYPES.DAILY);   // 'daily'
console.log(REPEAT_TYPES.MULTIPLE); // 'multiple'
```

## API Reference

### useChoreManagement(options)

Main hook for chore state management.

**Options:**
- `initialTasks` - Array of initial tasks
- `initialSavedChores` - Array of saved chores
- `initialPendingApproval` - Array of pending approvals
- `initialParentPassword` - Stored pattern password
- `initialStreak` - Current streak count
- `initialLastPlayDate` - Last activity date
- `onGemsAwarded(amount)` - Callback when gems awarded
- `soundSystem` - Optional sound system object

**Returns:**
- State: `tasks`, `savedChores`, `pendingApproval`, `parentPassword`, `streak`, etc.
- UI State: `showChoreManagement`, `showChoreEditor`, `showParentReview`, etc.
- Actions: `toggleTask`, `addNewChore`, `updateChore`, `deleteChore`, etc.
- Computed: `hasPendingChores`, `allChoresComplete`, `canSubmitReviews`, etc.

### usePatternLock(options)

Hook for pattern lock functionality.

**Options:**
- `storedPassword` - Currently stored pattern
- `onPasswordSet(pattern)` - Called when new password set
- `onVerificationSuccess()` - Called on successful verification
- `onVerificationFail()` - Called on failed verification
- `soundSystem` - Optional sound system

**Returns:**
- State: `patternInput`, `isDrawing`, `currentPoint`, `error`, `success`
- Refs: `gridRef`, `dotRefs`
- Actions: `handlePatternStart`, `handlePatternMove`, `handlePatternEnd`, etc.

### useFamilyEconomy(options)

Main hook for family economy system with jobs, transactions, and multi-user support.

**Options:**
- `savedState` - Previously saved state (JSON string or object)
- `soundSystem` - Optional sound system object

**Returns:**
- **User State:** `users`, `activeUser`, `activeUserId`
- **Job State:** `jobs`, `userJobs` (filtered for active user)
- **Chore State:** `chores`, `userChores` (filtered for active user)
- **Transaction State:** `transactions`, `userTransactions`
- **Settings:** `weeklyResetDay`, `parentPassword`
- **UI State:** `showUserSelector`, `showJobEditor`, etc.
- **User Actions:** `switchUser`, `createUser`, `updateUser`, `deleteUser`
- **Job Actions:** `createJob`, `updateJob`, `deleteJob`, `completeJob`
- **Chore Actions:** `createChore`, `updateChore`, `deleteChore`, `completeChore`
- **Approval Actions:** `approveJobCompletion`, `rejectJobCompletion`
- **Computed:** `getUnlockProgress`, `canCompleteJob`, `getUserBalance`

### useMoneyAnimations(soundSystem)

Hook for money-related visual animations.

**Returns:**
- `showEarning(amount, description)` - Show earning toast notification
- `showSpending(amount, description)` - Show spending toast notification
- `showCashBurst(x, y, amount)` - Trigger cash burst animation at position
- `showMoneyRain()` - Trigger coin rain effect
- `AnimationOverlay` - React component to render all animations

## Data Schema

### User
```javascript
{
  id: string,
  name: string,
  avatar: string,        // Emoji or image URL
  role: 'parent' | 'child',
  balance: number,       // In cents (e.g., 1050 = $10.50)
  pendingBalance: number,
  streak: number,
  createdAt: string,     // ISO date
  updatedAt: string
}
```

### Job
```javascript
{
  id: string,
  title: string,
  icon: string,
  value: number,         // In cents
  recurrence: 'daily' | 'weekly',
  userId: string,
  createdBy: string,
  isLocked: boolean,
  unlockConditions: {
    dailyChores: number,
    weeklyChores: number
  },
  allowMultipleCompletions: boolean,
  maxCompletionsPerPeriod: number | null,
  completions: JobCompletionEvent[],
  requiresApproval: boolean,
  lastReset: string
}
```

### Transaction
```javascript
{
  id: string,
  userId: string,
  type: 'earn' | 'redeem' | 'bonus' | 'adjust',
  amount: number,        // Positive or negative cents
  description: string,
  date: string,
  status: 'pending' | 'approved' | 'rejected',
  relatedJobId: string | null,
  completionCount: number | null
}
```

## Currency Utilities

All monetary values are stored in cents to avoid floating-point errors.

```javascript
import {
  dollarsToCents,
  centsToDollars,
  formatCents,
  formatCentsShort
} from './chores';

dollarsToCents(10.50);     // 1050
centsToDollars(1050);      // 10.5
formatCents(1050);         // "$10.50"
formatCentsShort(1050);    // "$10.50" or "$10" for whole dollars
```

## Date/Time Utilities

```javascript
import {
  needsReset,
  isCurrentPeriod,
  getNextResetTime,
  getTimeUntilReset,
  RECURRENCE_TYPE
} from './chores';

// Check if job needs reset
needsReset(job.lastReset, RECURRENCE_TYPE.DAILY);

// Check if timestamp is in current period
isCurrentPeriod(timestamp, RECURRENCE_TYPE.WEEKLY, resetDay);

// Get next reset time
getNextResetTime(RECURRENCE_TYPE.DAILY);
```

## Styling

Import the CSS file to apply default styles:

```javascript
import './chores/styles/chores.css';
```

Or use the individual class names with your own CSS framework.

## License

Part of the ChoreQuest application.
