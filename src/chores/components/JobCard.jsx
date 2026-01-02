/**
 * Job Card Components
 *
 * Components for displaying and interacting with jobs.
 * Includes lock/unlock status, completion, and value display.
 */

import React, { useState } from 'react';
import { RECURRENCE_TYPE, APPROVAL_STATUS } from '../schema.js';
import { formatCents, formatCentsShort, calculateBillCount } from '../utils/currency.js';
import { getPeriodLabel } from '../utils/dateTime.js';

/**
 * Job Value Display
 */
export const JobValue = ({ cents, size = 'md' }) => {
    const sizeClasses = {
        sm: 'text-sm',
        md: 'text-lg',
        lg: 'text-2xl',
        xl: 'text-3xl'
    };

    return (
        <span className={`font-bold text-green-600 ${sizeClasses[size]}`}>
            {formatCents(cents)}
        </span>
    );
};

/**
 * Unlock Progress Bar
 */
export const UnlockProgressBar = ({ progress, label }) => {
    const { current, required } = progress;
    if (required === 0) return null;

    const percentage = Math.min((current / required) * 100, 100);
    const isMet = current >= required;

    return (
        <div className="mb-2">
            <div className="flex justify-between text-xs mb-1">
                <span className={isMet ? 'text-green-600' : 'text-gray-500'}>{label}</span>
                <span className={isMet ? 'text-green-600 font-bold' : 'text-gray-500'}>
                    {current}/{required} {isMet && '✓'}
                </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all ${
                        isMet ? 'bg-green-500' : 'bg-purple-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};

/**
 * Unlock Status Display
 */
export const UnlockStatus = ({ unlockProgress, recurrence }) => {
    const { dailyProgress, weeklyProgress, isUnlocked } = unlockProgress;

    if (isUnlocked) {
        return (
            <div className="text-green-600 text-sm font-semibold flex items-center gap-1">
                <span>🔓</span> Unlocked
            </div>
        );
    }

    return (
        <div className="space-y-1">
            <div className="text-amber-600 text-sm font-semibold flex items-center gap-1">
                <span>🔒</span> Locked - Complete chores to unlock
            </div>
            {dailyProgress.required > 0 && (
                <UnlockProgressBar
                    progress={dailyProgress}
                    label="Daily chores"
                />
            )}
            {weeklyProgress.required > 0 && (
                <UnlockProgressBar
                    progress={weeklyProgress}
                    label="Weekly chores"
                />
            )}
        </div>
    );
};

/**
 * Completion Counter
 */
export const CompletionCounter = ({
    currentCount,
    maxCount,
    allowMultiple,
    pendingCount = 0
}) => {
    if (!allowMultiple && currentCount > 0) {
        return (
            <div className="text-green-600 font-semibold">
                ✓ Completed
            </div>
        );
    }

    if (!allowMultiple) {
        return null;
    }

    const displayMax = maxCount !== null ? maxCount : '∞';

    return (
        <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-purple-600">
                {currentCount}×
            </span>
            {maxCount !== null && (
                <span className="text-gray-400">/ {displayMax}</span>
            )}
            {pendingCount > 0 && (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                    ⏳ {pendingCount} pending
                </span>
            )}
        </div>
    );
};

/**
 * Multiple Completion Input
 */
export const MultipleCompletionInput = ({
    onComplete,
    maxAllowed = null,
    disabled = false
}) => {
    const [count, setCount] = useState(1);
    const [showInput, setShowInput] = useState(false);

    const handleQuickComplete = () => {
        onComplete(1);
    };

    const handleBatchComplete = () => {
        if (count > 0) {
            onComplete(count);
            setCount(1);
            setShowInput(false);
        }
    };

    if (!showInput) {
        return (
            <div className="flex gap-2">
                <button
                    onClick={handleQuickComplete}
                    disabled={disabled}
                    className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold hover:scale-102 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    ✓ Complete
                </button>
                <button
                    onClick={() => setShowInput(true)}
                    disabled={disabled}
                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-50"
                    title="Complete multiple"
                >
                    ×#
                </button>
            </div>
        );
    }

    return (
        <div className="flex gap-2 items-center">
            <button
                onClick={() => setCount(Math.max(1, count - 1))}
                className="w-10 h-10 bg-gray-100 rounded-lg text-xl font-bold hover:bg-gray-200"
            >
                -
            </button>
            <input
                type="number"
                value={count}
                onChange={e => {
                    let val = parseInt(e.target.value) || 1;
                    if (maxAllowed !== null) val = Math.min(val, maxAllowed);
                    setCount(Math.max(1, val));
                }}
                className="w-16 h-10 text-center border-2 border-gray-200 rounded-lg font-bold"
                min={1}
                max={maxAllowed || undefined}
            />
            <button
                onClick={() => setCount(count + 1)}
                disabled={maxAllowed !== null && count >= maxAllowed}
                className="w-10 h-10 bg-gray-100 rounded-lg text-xl font-bold hover:bg-gray-200 disabled:opacity-50"
            >
                +
            </button>
            <button
                onClick={handleBatchComplete}
                className="px-4 py-2 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600"
            >
                ✓ {count}×
            </button>
            <button
                onClick={() => setShowInput(false)}
                className="px-3 py-2 text-gray-500 hover:text-gray-700"
            >
                ✕
            </button>
        </div>
    );
};

/**
 * Job Card Component
 */
export const JobCard = ({
    job,
    unlockProgress,
    currentCompletions,
    pendingCompletions = 0,
    onComplete,
    canComplete,
    disabled = false
}) => {
    const {
        title,
        description,
        icon,
        value,
        recurrence,
        allowMultipleCompletions,
        maxCompletionsPerPeriod,
        isLocked
    } = job;

    const { isUnlocked } = unlockProgress;

    // Calculate remaining completions
    const remainingCompletions = maxCompletionsPerPeriod !== null
        ? maxCompletionsPerPeriod - currentCompletions
        : null;

    const isCompleted = !allowMultipleCompletions && currentCompletions > 0;
    const isMaxedOut = maxCompletionsPerPeriod !== null && currentCompletions >= maxCompletionsPerPeriod;

    // Determine card state
    const cardClasses = (() => {
        if (!isUnlocked) return 'bg-gray-100 border-gray-300 opacity-75';
        if (isCompleted || isMaxedOut) return 'bg-green-50 border-green-300';
        return 'bg-white border-purple-200 hover:border-purple-400 hover:shadow-lg';
    })();

    return (
        <div className={`p-5 rounded-2xl border-2 transition-all ${cardClasses}`}>
            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl ${
                    isUnlocked ? 'bg-gradient-to-br from-green-400 to-emerald-500' : 'bg-gray-200'
                }`}>
                    {isUnlocked ? icon : '🔒'}
                </div>

                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-lg text-gray-800">{title}</h3>
                            {description && (
                                <p className="text-sm text-gray-500 mt-1">{description}</p>
                            )}
                        </div>
                        <JobValue cents={value} size="lg" />
                    </div>

                    {/* Recurrence Badge */}
                    <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                            recurrence === RECURRENCE_TYPE.DAILY
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-purple-100 text-purple-700'
                        }`}>
                            {recurrence === RECURRENCE_TYPE.DAILY ? '📅 Daily' : '📆 Weekly'}
                        </span>

                        {allowMultipleCompletions && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                                🔁 Multiple
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Unlock Status */}
            {!isUnlocked && (
                <div className="mb-4 p-3 bg-amber-50 rounded-xl">
                    <UnlockStatus
                        unlockProgress={unlockProgress}
                        recurrence={recurrence}
                    />
                </div>
            )}

            {/* Completion Status */}
            {isUnlocked && (
                <div className="mb-4">
                    <CompletionCounter
                        currentCount={currentCompletions}
                        maxCount={maxCompletionsPerPeriod}
                        allowMultiple={allowMultipleCompletions}
                        pendingCount={pendingCompletions}
                    />
                </div>
            )}

            {/* Action Button */}
            {isUnlocked && !isCompleted && !isMaxedOut && (
                allowMultipleCompletions ? (
                    <MultipleCompletionInput
                        onComplete={onComplete}
                        maxAllowed={remainingCompletions}
                        disabled={disabled || !canComplete.canComplete}
                    />
                ) : (
                    <button
                        onClick={() => onComplete(1)}
                        disabled={disabled || !canComplete.canComplete}
                        className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold hover:scale-102 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        💵 Complete for {formatCents(value)}
                    </button>
                )
            )}

            {/* Reason why can't complete */}
            {isUnlocked && canComplete && !canComplete.canComplete && canComplete.reason && (
                <div className="text-sm text-amber-600 text-center mt-2">
                    {canComplete.reason}
                </div>
            )}
        </div>
    );
};

/**
 * Job List Component
 */
export const JobList = ({
    jobs,
    getUnlockProgress,
    getCurrentPeriodCompletions,
    canCompleteJob,
    onCompleteJob,
    recurrenceFilter = null // 'daily', 'weekly', or null for all
}) => {
    const filteredJobs = recurrenceFilter
        ? jobs.filter(j => j.recurrence === recurrenceFilter)
        : jobs;

    if (filteredJobs.length === 0) {
        return (
            <div className="text-center text-gray-500 py-12">
                <p className="text-xl">No jobs available</p>
                <p className="mt-2">Ask a parent to add some jobs!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {filteredJobs.map(job => {
                const unlockProgress = getUnlockProgress(job);
                const currentCompletions = getCurrentPeriodCompletions(job);
                const canComplete = canCompleteJob(job);
                const pendingCompletions = job.completions
                    .filter(c => c.status === APPROVAL_STATUS.PENDING)
                    .reduce((sum, c) => sum + c.count, 0);

                return (
                    <JobCard
                        key={job.id}
                        job={job}
                        unlockProgress={unlockProgress}
                        currentCompletions={currentCompletions}
                        pendingCompletions={pendingCompletions}
                        onComplete={(count) => onCompleteJob(job.id, count)}
                        canComplete={canComplete}
                    />
                );
            })}
        </div>
    );
};

/**
 * Jobs Summary Header
 */
export const JobsSummaryHeader = ({ jobs, totalEarnedToday, recurrence }) => {
    const periodLabel = getPeriodLabel(recurrence);
    const completedJobs = jobs.filter(j =>
        j.completions.some(c => c.status === APPROVAL_STATUS.APPROVED)
    ).length;

    return (
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white mb-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">💼 Jobs</h2>
                    <p className="text-green-100">
                        {completedJobs} of {jobs.length} completed {periodLabel.toLowerCase()}
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-bold">{formatCents(totalEarnedToday)}</div>
                    <div className="text-green-100 text-sm">Earned {periodLabel.toLowerCase()}</div>
                </div>
            </div>
        </div>
    );
};

export default {
    JobValue,
    UnlockProgressBar,
    UnlockStatus,
    CompletionCounter,
    MultipleCompletionInput,
    JobCard,
    JobList,
    JobsSummaryHeader
};
