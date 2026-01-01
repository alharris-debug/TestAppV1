# Chore Management System

A complete, modular chore management system extracted from the ChoreQuest application.

## Features

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
- **localStorage Persistence**: Data saved automatically

## Directory Structure

```
src/chores/
├── index.js              # Main exports
├── constants.js          # Configuration constants
├── types.js              # JSDoc type definitions
├── README.md             # Documentation
├── components/
│   ├── ChoreCard.jsx     # Chore display components
│   ├── ChoreEditor.jsx   # Add/Edit chore modal
│   ├── ChoreList.jsx     # Main chores view
│   ├── ChoreManagement.jsx  # Parent settings modal
│   ├── ParentReview.jsx  # Approval modal
│   └── PatternLock.jsx   # Pattern lock components
├── hooks/
│   ├── useChoreManagement.js  # Core chore state/logic
│   └── usePatternLock.js      # Pattern lock state/logic
├── utils/
│   ├── choreHelpers.js   # Chore utility functions
│   ├── patternLock.js    # Pattern lock utilities
│   └── storage.js        # localStorage helpers
└── styles/
    └── chores.css        # All chore-related styles
```

## Usage

### Basic Setup

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

## Styling

Import the CSS file to apply default styles:

```javascript
import './chores/styles/chores.css';
```

Or use the individual class names with your own CSS framework.

## License

Part of the ChoreQuest application.
