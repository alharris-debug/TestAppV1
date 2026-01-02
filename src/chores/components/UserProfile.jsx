/**
 * User Profile Components
 *
 * Components for user profile display, selection, and editing.
 */

import React from 'react';
import { USER_ROLE, DEFAULT_AVATARS } from '../schema.js';
import { formatCents } from '../utils/currency.js';

/**
 * User Avatar Display
 */
export const UserAvatar = ({ user, size = 'md', showName = false, onClick }) => {
    const sizeClasses = {
        sm: 'w-10 h-10 text-xl',
        md: 'w-14 h-14 text-2xl',
        lg: 'w-20 h-20 text-4xl',
        xl: 'w-28 h-28 text-6xl'
    };

    const avatarClass = `${sizeClasses[size]} rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-lg ${onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`;

    return (
        <div className="flex flex-col items-center" onClick={onClick}>
            <div className={avatarClass}>
                {user?.avatar || '👤'}
            </div>
            {showName && user?.name && (
                <span className="mt-1 text-sm font-semibold text-gray-700 truncate max-w-[80px]">
                    {user.name}
                </span>
            )}
        </div>
    );
};

/**
 * User Balance Display
 */
export const UserBalance = ({ user, showPending = true }) => {
    if (!user) return null;

    return (
        <div className="flex items-center gap-4">
            {/* Cash Balance */}
            <div className="flex items-center gap-2 bg-green-100 px-4 py-2 rounded-full">
                <span className="text-2xl">💵</span>
                <span className="text-xl font-bold text-green-700">
                    {formatCents(user.cashBalance)}
                </span>
            </div>

            {/* Pending Balance */}
            {showPending && user.pendingBalance > 0 && (
                <div className="flex items-center gap-2 bg-yellow-100 px-3 py-2 rounded-full">
                    <span className="text-lg">⏳</span>
                    <span className="text-sm font-semibold text-yellow-700">
                        {formatCents(user.pendingBalance)} pending
                    </span>
                </div>
            )}
        </div>
    );
};

/**
 * User Streak Display
 */
export const UserStreak = ({ user }) => {
    if (!user || user.currentStreak === 0) return null;

    return (
        <div className="flex items-center gap-1 bg-orange-100 px-3 py-2 rounded-full">
            <span className="text-2xl streak-fire">🔥</span>
            <span className="text-xl font-bold text-orange-600">{user.currentStreak}</span>
        </div>
    );
};

/**
 * User Profile Card (for selection)
 */
export const UserProfileCard = ({ user, isActive, onClick }) => {
    return (
        <div
            onClick={onClick}
            className={`p-4 rounded-2xl cursor-pointer transition-all ${
                isActive
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white scale-105 shadow-lg'
                    : 'bg-white hover:bg-purple-50 border-2 border-gray-200 hover:border-purple-300'
            }`}
        >
            <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl ${
                    isActive ? 'bg-white/20' : 'bg-gradient-to-br from-purple-400 to-pink-400'
                }`}>
                    {user.avatar}
                </div>
                <div className="flex-1">
                    <div className={`font-bold text-lg ${isActive ? 'text-white' : 'text-gray-800'}`}>
                        {user.name || 'Unnamed'}
                    </div>
                    <div className={`text-sm ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                        {user.role === USER_ROLE.PARENT ? '👨‍👩‍👧 Parent' : '🧒 Child'}
                    </div>
                </div>
                {user.role === USER_ROLE.CHILD && (
                    <div className={`text-right ${isActive ? 'text-white' : 'text-green-600'}`}>
                        <div className="font-bold">{formatCents(user.cashBalance)}</div>
                        {user.currentStreak > 0 && (
                            <div className="text-sm">🔥 {user.currentStreak}</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * User Selector Dropdown/Modal
 */
export const UserSelector = ({
    users,
    activeUserId,
    onSelectUser,
    onAddUser,
    onClose
}) => {
    const childUsers = users.filter(u => u.role === USER_ROLE.CHILD);
    const parentUsers = users.filter(u => u.role === USER_ROLE.PARENT);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" style={{ maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-purple-600">👥 Switch User</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                        ✕
                    </button>
                </div>

                {/* Children */}
                {childUsers.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">
                            Children
                        </h3>
                        <div className="space-y-3">
                            {childUsers.map(user => (
                                <UserProfileCard
                                    key={user.id}
                                    user={user}
                                    isActive={user.id === activeUserId}
                                    onClick={() => onSelectUser(user.id)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Parents */}
                {parentUsers.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">
                            Parents
                        </h3>
                        <div className="space-y-3">
                            {parentUsers.map(user => (
                                <UserProfileCard
                                    key={user.id}
                                    user={user}
                                    isActive={user.id === activeUserId}
                                    onClick={() => onSelectUser(user.id)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Add User Button */}
                <button
                    onClick={onAddUser}
                    className="w-full py-3 border-2 border-dashed border-purple-300 rounded-xl text-purple-600 font-semibold hover:bg-purple-50 transition-all"
                >
                    ➕ Add Family Member
                </button>
            </div>
        </div>
    );
};

/**
 * User Editor Modal
 */
export const UserEditorModal = ({
    isOpen,
    user,
    onSave,
    onClose
}) => {
    const [name, setName] = React.useState(user?.name || '');
    const [avatar, setAvatar] = React.useState(user?.avatar || '👦');
    const [role, setRole] = React.useState(user?.role || USER_ROLE.CHILD);

    const isEditing = !!user?.id;

    React.useEffect(() => {
        if (user) {
            setName(user.name || '');
            setAvatar(user.avatar || '👦');
            setRole(user.role || USER_ROLE.CHILD);
        } else {
            setName('');
            setAvatar('👦');
            setRole(USER_ROLE.CHILD);
        }
    }, [user]);

    const handleSave = () => {
        if (!name.trim()) return;
        onSave({
            id: user?.id,
            name: name.trim(),
            avatar,
            role
        });
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-purple-600 text-center mb-6">
                    {isEditing ? '✏️ Edit Profile' : '➕ New Family Member'}
                </h2>

                <div className="space-y-6">
                    {/* Name Input */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Name
                        </label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Enter name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>

                    {/* Avatar Picker */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Avatar
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {DEFAULT_AVATARS.map(emoji => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => setAvatar(emoji)}
                                    className={`text-3xl p-2 rounded-lg transition-all ${
                                        avatar === emoji
                                            ? 'bg-purple-500 scale-110'
                                            : 'bg-gray-100 hover:bg-gray-200'
                                    }`}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Role Selector */}
                    {!isEditing && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Role
                            </label>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setRole(USER_ROLE.CHILD)}
                                    className={`flex-1 p-4 rounded-xl text-center transition-all ${
                                        role === USER_ROLE.CHILD
                                            ? 'bg-purple-500 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    <div className="text-2xl mb-1">🧒</div>
                                    <div className="font-semibold">Child</div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole(USER_ROLE.PARENT)}
                                    className={`flex-1 p-4 rounded-xl text-center transition-all ${
                                        role === USER_ROLE.PARENT
                                            ? 'bg-purple-500 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    <div className="text-2xl mb-1">👨‍👩‍👧</div>
                                    <div className="font-semibold">Parent</div>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Buttons */}
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!name.trim()}
                        className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:scale-102 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isEditing ? 'Save Changes' : 'Add Member'}
                    </button>
                </div>
            </div>
        </div>
    );
};

/**
 * Active User Header Bar
 */
export const ActiveUserHeader = ({
    user,
    onSwitchUser,
    onOpenSettings
}) => {
    if (!user) {
        return (
            <div className="bg-white rounded-2xl p-4 shadow-lg">
                <button
                    onClick={onSwitchUser}
                    className="w-full py-3 bg-purple-100 text-purple-700 rounded-xl font-semibold"
                >
                    👥 Select a User to Start
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl shadow-2xl p-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                {/* User Info */}
                <div
                    className="flex items-center gap-4 cursor-pointer hover:opacity-80"
                    onClick={onSwitchUser}
                >
                    <UserAvatar user={user} size="md" />
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
                        <p className="text-gray-500 text-sm">Tap to switch user</p>
                    </div>
                </div>

                {/* Balance & Streak */}
                <div className="flex items-center gap-4">
                    <UserStreak user={user} />
                    <UserBalance user={user} />

                    {/* Settings Button */}
                    {onOpenSettings && (
                        <button
                            onClick={onOpenSettings}
                            className="p-3 bg-gray-100 rounded-full hover:bg-gray-200"
                        >
                            ⚙️
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default {
    UserAvatar,
    UserBalance,
    UserStreak,
    UserProfileCard,
    UserSelector,
    UserEditorModal,
    ActiveUserHeader
};
