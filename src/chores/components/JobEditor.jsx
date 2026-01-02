/**
 * JobEditor Component
 *
 * Modal for creating and editing jobs.
 * Includes fields for name, cash value, recurrence, unlock conditions,
 * and multiple completion settings.
 */

import React, { useState } from 'react';
import { CHORE_ICONS, REPEAT_TYPES } from '../constants.js';
import { RECURRENCE_TYPE } from '../schema.js';
import { formatCents, dollarsToCents, centsToDollars } from '../utils/currency.js';

/**
 * Icon Picker Component (reused from ChoreEditor)
 */
export const JobIconPicker = ({ selectedIcon, onSelect }) => {
    return (
        <div className="flex flex-wrap gap-2">
            {CHORE_ICONS.map(icon => (
                <button
                    key={icon}
                    type="button"
                    onClick={() => onSelect(icon)}
                    className={`text-2xl p-2 rounded-lg transition-all ${
                        selectedIcon === icon
                            ? 'bg-green-500 scale-110'
                            : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                >
                    {icon}
                </button>
            ))}
        </div>
    );
};

/**
 * Cash Value Input Component
 */
export const CashValueInput = ({ valueCents, onChange, label = "Cash Value" }) => {
    const [displayValue, setDisplayValue] = useState(
        centsToDollars(valueCents).toFixed(2)
    );

    const handleChange = (e) => {
        const input = e.target.value;
        setDisplayValue(input);

        // Parse and convert to cents
        const dollars = parseFloat(input);
        if (!isNaN(dollars) && dollars >= 0) {
            onChange(dollarsToCents(dollars));
        }
    };

    const handleBlur = () => {
        // Normalize display on blur
        const dollars = parseFloat(displayValue);
        if (!isNaN(dollars) && dollars >= 0) {
            setDisplayValue(dollars.toFixed(2));
        } else {
            setDisplayValue(centsToDollars(valueCents).toFixed(2));
        }
    };

    return (
        <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
                {label}
            </label>
            <div className="flex items-center gap-2">
                <span className="text-2xl text-green-600">$</span>
                <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input-field flex-1"
                    value={displayValue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="0.00"
                />
            </div>
        </div>
    );
};

/**
 * Recurrence Type Selector
 */
export const RecurrenceSelector = ({ selectedType, onSelect }) => {
    const options = [
        {
            type: RECURRENCE_TYPE.DAILY,
            icon: '📅',
            label: 'Daily',
            description: 'Resets each day at midnight'
        },
        {
            type: RECURRENCE_TYPE.WEEKLY,
            icon: '📆',
            label: 'Weekly',
            description: 'Resets each week'
        }
    ];

    return (
        <div className="flex gap-2">
            {options.map(option => (
                <button
                    key={option.type}
                    type="button"
                    onClick={() => onSelect(option.type)}
                    className={`flex-1 p-3 rounded-xl text-center transition-all ${
                        selectedType === option.type
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    <span className="text-xl">{option.icon}</span>
                    <span className="block font-semibold">{option.label}</span>
                    <span className="block text-xs opacity-80">{option.description}</span>
                </button>
            ))}
        </div>
    );
};

/**
 * Unlock Conditions Editor
 */
export const UnlockConditionsEditor = ({ conditions, onChange }) => {
    const updateCondition = (field, value) => {
        onChange({
            ...conditions,
            [field]: Math.max(0, parseInt(value) || 0)
        });
    };

    return (
        <div className="bg-amber-50 rounded-xl p-4">
            <label className="block text-sm font-semibold text-amber-800 mb-3">
                🔓 Unlock After Completing
            </label>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-amber-700 mb-1 block">Daily Chores</label>
                    <input
                        type="number"
                        min="0"
                        className="w-full px-3 py-2 rounded-lg border border-amber-200 focus:border-amber-400 focus:outline-none"
                        value={conditions.dailyChores}
                        onChange={e => updateCondition('dailyChores', e.target.value)}
                    />
                </div>
                <div>
                    <label className="text-xs text-amber-700 mb-1 block">Weekly Chores</label>
                    <input
                        type="number"
                        min="0"
                        className="w-full px-3 py-2 rounded-lg border border-amber-200 focus:border-amber-400 focus:outline-none"
                        value={conditions.weeklyChores}
                        onChange={e => updateCondition('weeklyChores', e.target.value)}
                    />
                </div>
            </div>
            {(conditions.dailyChores > 0 || conditions.weeklyChores > 0) && (
                <p className="text-xs text-amber-600 mt-2">
                    Job will be locked until {conditions.dailyChores > 0 && `${conditions.dailyChores} daily`}
                    {conditions.dailyChores > 0 && conditions.weeklyChores > 0 && ' and '}
                    {conditions.weeklyChores > 0 && `${conditions.weeklyChores} weekly`} chore(s) completed
                </p>
            )}
        </div>
    );
};

/**
 * Multiple Completion Settings
 */
export const MultipleCompletionSettings = ({
    allowMultiple,
    maxPerPeriod,
    onAllowMultipleChange,
    onMaxPerPeriodChange
}) => {
    return (
        <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-blue-800">
                    🔁 Allow Multiple Completions
                </label>
                <button
                    type="button"
                    onClick={() => onAllowMultipleChange(!allowMultiple)}
                    className={`w-12 h-6 rounded-full transition-all ${
                        allowMultiple ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                        allowMultiple ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                </button>
            </div>

            {allowMultiple && (
                <div>
                    <label className="text-xs text-blue-700 mb-1 block">
                        Max completions per period (0 = unlimited)
                    </label>
                    <input
                        type="number"
                        min="0"
                        className="w-full px-3 py-2 rounded-lg border border-blue-200 focus:border-blue-400 focus:outline-none"
                        value={maxPerPeriod === null ? 0 : maxPerPeriod}
                        onChange={e => {
                            const val = parseInt(e.target.value) || 0;
                            onMaxPerPeriodChange(val === 0 ? null : val);
                        }}
                        placeholder="0 for unlimited"
                    />
                </div>
            )}
        </div>
    );
};

/**
 * Approval Requirement Toggle
 */
export const ApprovalToggle = ({ requiresApproval, onChange }) => {
    return (
        <div className="flex items-center justify-between bg-purple-50 rounded-xl p-4">
            <div>
                <label className="text-sm font-semibold text-purple-800">
                    ✅ Requires Parent Approval
                </label>
                <p className="text-xs text-purple-600 mt-1">
                    {requiresApproval
                        ? 'Parent must approve before payment'
                        : 'Payment awarded immediately on completion'
                    }
                </p>
            </div>
            <button
                type="button"
                onClick={() => onChange(!requiresApproval)}
                className={`w-12 h-6 rounded-full transition-all ${
                    requiresApproval ? 'bg-purple-500' : 'bg-gray-300'
                }`}
            >
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                    requiresApproval ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
            </button>
        </div>
    );
};

/**
 * Job Editor Modal Component
 */
export const JobEditorModal = ({
    isOpen,
    editingJob,
    form,
    onFormChange,
    onSave,
    onClose
}) => {
    if (!isOpen) return null;

    const isEditing = !!editingJob;
    const isValid = form.title.trim().length > 0 && form.value > 0;

    const updateField = (field, value) => {
        onFormChange({ ...form, [field]: value });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-green-600 text-center mb-6">
                    {isEditing ? '✏️ Edit Job' : '💼 New Job'}
                </h2>

                <div className="space-y-4">
                    {/* Job Name */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Job Name
                        </label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="e.g., Wash Windows"
                            value={form.title}
                            onChange={e => updateField('title', e.target.value)}
                        />
                    </div>

                    {/* Icon Picker */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Icon
                        </label>
                        <JobIconPicker
                            selectedIcon={form.icon}
                            onSelect={icon => updateField('icon', icon)}
                        />
                    </div>

                    {/* Cash Value */}
                    <CashValueInput
                        valueCents={form.value}
                        onChange={cents => updateField('value', cents)}
                    />

                    {/* Recurrence */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Recurrence
                        </label>
                        <RecurrenceSelector
                            selectedType={form.recurrence}
                            onSelect={type => updateField('recurrence', type)}
                        />
                    </div>

                    {/* Unlock Conditions */}
                    <UnlockConditionsEditor
                        conditions={form.unlockConditions}
                        onChange={conditions => updateField('unlockConditions', conditions)}
                    />

                    {/* Multiple Completions */}
                    <MultipleCompletionSettings
                        allowMultiple={form.allowMultipleCompletions}
                        maxPerPeriod={form.maxCompletionsPerPeriod}
                        onAllowMultipleChange={val => updateField('allowMultipleCompletions', val)}
                        onMaxPerPeriodChange={val => updateField('maxCompletionsPerPeriod', val)}
                    />

                    {/* Approval Toggle */}
                    <ApprovalToggle
                        requiresApproval={form.requiresApproval}
                        onChange={val => updateField('requiresApproval', val)}
                    />

                    {/* Description (optional) */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Description (optional)
                        </label>
                        <textarea
                            className="input-field resize-none"
                            rows={2}
                            placeholder="Any additional details..."
                            value={form.description || ''}
                            onChange={e => updateField('description', e.target.value)}
                        />
                    </div>
                </div>

                {/* Preview */}
                <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                    <div className="text-xs text-gray-500 mb-2">Preview</div>
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">{form.icon}</span>
                        <div className="flex-1">
                            <div className="font-semibold text-gray-800">
                                {form.title || 'Job Name'}
                            </div>
                            <div className="text-sm text-gray-500">
                                {form.recurrence === RECURRENCE_TYPE.DAILY ? 'Daily' : 'Weekly'}
                                {form.allowMultipleCompletions && ' • Multiple'}
                            </div>
                        </div>
                        <div className="text-xl font-bold text-green-600">
                            {formatCents(form.value)}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onSave}
                        disabled={!isValid}
                        className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:scale-102 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isEditing ? 'Save Changes' : 'Add Job'}
                    </button>
                </div>
            </div>
        </div>
    );
};

/**
 * Default job form state
 */
export const DEFAULT_JOB_FORM = {
    title: '',
    icon: '💼',
    value: 100, // $1.00 in cents
    recurrence: RECURRENCE_TYPE.DAILY,
    unlockConditions: { dailyChores: 0, weeklyChores: 0 },
    allowMultipleCompletions: false,
    maxCompletionsPerPeriod: null,
    requiresApproval: true,
    description: ''
};

export default JobEditorModal;
