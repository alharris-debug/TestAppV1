/**
 * ChoreEditor Component
 *
 * Modal for creating and editing chores.
 * Includes form fields for name, icon, points, and repeat type.
 */

import React from 'react';
import { CHORE_ICONS, REPEAT_TYPES } from '../constants.js';

/**
 * Icon Picker Component
 *
 * @param {Object} props
 * @param {string} props.selectedIcon - Currently selected icon
 * @param {Function} props.onSelect - Selection handler
 */
export const IconPicker = ({ selectedIcon, onSelect }) => {
    return (
        <div className="flex flex-wrap gap-2">
            {CHORE_ICONS.map(icon => (
                <button
                    key={icon}
                    type="button"
                    onClick={() => onSelect(icon)}
                    className={`text-2xl p-2 rounded-lg transition-all ${
                        selectedIcon === icon
                            ? 'bg-purple-500 scale-110'
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
 * Repeat Type Selector Component
 *
 * @param {Object} props
 * @param {string} props.selectedType - Currently selected repeat type
 * @param {Function} props.onSelect - Selection handler
 */
export const RepeatTypeSelector = ({ selectedType, onSelect }) => {
    const options = [
        {
            type: REPEAT_TYPES.ONCE,
            icon: '🔲',
            label: 'One-time only',
            description: 'Complete once, then remove'
        },
        {
            type: REPEAT_TYPES.DAILY,
            icon: '🔄',
            label: 'Repeat daily',
            description: 'Resets each day'
        },
        {
            type: REPEAT_TYPES.MULTIPLE,
            icon: '🔁',
            label: 'Multiple per day',
            description: 'Can complete multiple times daily'
        }
    ];

    return (
        <div className="flex flex-col gap-2">
            {options.map(option => (
                <button
                    key={option.type}
                    type="button"
                    onClick={() => onSelect(option.type)}
                    className={`p-3 rounded-xl text-left transition-all ${
                        selectedType === option.type
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    <span className="font-semibold">{option.icon} {option.label}</span>
                    <span className="block text-sm opacity-80">{option.description}</span>
                </button>
            ))}
        </div>
    );
};

/**
 * Chore Editor Modal Component
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility
 * @param {Object | null} props.editingChore - Chore being edited (null for new)
 * @param {Object} props.form - Form state object
 * @param {Function} props.onFormChange - Form update handler
 * @param {Function} props.onSave - Save handler
 * @param {Function} props.onClose - Close handler
 */
export const ChoreEditorModal = ({
    isOpen,
    editingChore,
    form,
    onFormChange,
    onSave,
    onClose
}) => {
    if (!isOpen) return null;

    const isEditing = !!editingChore;
    const isValid = form.name.trim().length > 0;

    const updateField = (field, value) => {
        onFormChange({ ...form, [field]: value });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-purple-600 text-center mb-6">
                    {isEditing ? '✏️ Edit Chore' : '➕ New Chore'}
                </h2>

                <div className="space-y-4">
                    {/* Name Input */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Chore Name
                        </label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="e.g., Clean your room"
                            value={form.name}
                            onChange={e => updateField('name', e.target.value)}
                        />
                    </div>

                    {/* Icon Picker */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Icon
                        </label>
                        <IconPicker
                            selectedIcon={form.icon}
                            onSelect={icon => updateField('icon', icon)}
                        />
                    </div>

                    {/* Gem Reward Input */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Gem Reward
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                min="1"
                                max="100"
                                className="input-field gem-input"
                                value={form.points}
                                onChange={e => updateField('points', parseInt(e.target.value) || 1)}
                            />
                            <span className="text-2xl">💎</span>
                        </div>
                    </div>

                    {/* Repeat Type Selector */}
                    <div>
                        <label className="toggle-label block mb-2">
                            Repeat Options
                        </label>
                        <RepeatTypeSelector
                            selectedType={form.repeatType}
                            onSelect={type => updateField('repeatType', type)}
                        />
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
                        className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:scale-102 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isEditing ? 'Save Changes' : 'Add Chore'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChoreEditorModal;
