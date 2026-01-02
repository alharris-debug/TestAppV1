/**
 * Transaction History Components
 *
 * Components for displaying transaction history, earnings, and redemptions.
 */

import React, { useState, useMemo } from 'react';
import { TRANSACTION_TYPE, APPROVAL_STATUS } from '../schema.js';
import { formatCents, formatCentsShort } from '../utils/currency.js';
import { formatDate, isToday, isThisWeek } from '../utils/dateTime.js';

/**
 * Transaction Type Icon
 */
export const TransactionIcon = ({ type }) => {
    const icons = {
        [TRANSACTION_TYPE.EARN]: '💵',
        [TRANSACTION_TYPE.REDEEM]: '🛒',
        [TRANSACTION_TYPE.BONUS]: '🎁',
        [TRANSACTION_TYPE.ADJUST]: '⚙️'
    };
    return <span className="text-2xl">{icons[type] || '📋'}</span>;
};

/**
 * Transaction Amount Display
 */
export const TransactionAmount = ({ amount, type }) => {
    const isPositive = amount > 0;
    const colorClass = isPositive ? 'text-green-600' : 'text-red-500';

    return (
        <span className={`font-bold ${colorClass}`}>
            {isPositive ? '+' : ''}{formatCents(amount)}
        </span>
    );
};

/**
 * Transaction Status Badge
 */
export const TransactionStatus = ({ status }) => {
    const statusConfig = {
        [APPROVAL_STATUS.PENDING]: {
            label: 'Pending',
            className: 'bg-yellow-100 text-yellow-700'
        },
        [APPROVAL_STATUS.APPROVED]: {
            label: 'Approved',
            className: 'bg-green-100 text-green-700'
        },
        [APPROVAL_STATUS.REJECTED]: {
            label: 'Rejected',
            className: 'bg-red-100 text-red-700'
        }
    };

    const config = statusConfig[status];
    if (!config) return null;

    return (
        <span className={`text-xs px-2 py-1 rounded-full ${config.className}`}>
            {config.label}
        </span>
    );
};

/**
 * Single Transaction Item
 */
export const TransactionItem = ({ transaction, showStatus = true }) => {
    const { type, amount, description, date, status, completionCount } = transaction;

    return (
        <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-sm transition-shadow">
            <TransactionIcon type={type} />

            <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800 truncate">
                    {description}
                    {completionCount && completionCount > 1 && (
                        <span className="text-purple-600 ml-1">({completionCount}×)</span>
                    )}
                </div>
                <div className="text-sm text-gray-500">
                    {formatDate(date, 'datetime')}
                </div>
            </div>

            <div className="text-right">
                <TransactionAmount amount={amount} type={type} />
                {showStatus && status !== APPROVAL_STATUS.APPROVED && (
                    <div className="mt-1">
                        <TransactionStatus status={status} />
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * Transaction Group Header (by date)
 */
export const TransactionGroupHeader = ({ label, total }) => {
    return (
        <div className="flex justify-between items-center py-2 px-1">
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                {label}
            </span>
            {total !== undefined && (
                <span className={`text-sm font-bold ${total >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {total >= 0 ? '+' : ''}{formatCents(total)}
                </span>
            )}
        </div>
    );
};

/**
 * Filter Tabs for Transaction Types
 */
export const TransactionFilterTabs = ({ activeFilter, onFilterChange }) => {
    const filters = [
        { key: 'all', label: 'All' },
        { key: TRANSACTION_TYPE.EARN, label: '💵 Earned' },
        { key: TRANSACTION_TYPE.REDEEM, label: '🛒 Spent' }
    ];

    return (
        <div className="flex gap-2 mb-4 overflow-x-auto">
            {filters.map(filter => (
                <button
                    key={filter.key}
                    onClick={() => onFilterChange(filter.key)}
                    className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-all ${
                        activeFilter === filter.key
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    {filter.label}
                </button>
            ))}
        </div>
    );
};

/**
 * Transaction Summary Card
 */
export const TransactionSummaryCard = ({
    totalEarned,
    totalSpent,
    currentBalance,
    pendingBalance
}) => {
    return (
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white mb-6">
            <h3 className="text-lg font-semibold mb-4">💰 Balance Overview</h3>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/20 rounded-xl p-4">
                    <div className="text-white/80 text-sm">Available</div>
                    <div className="text-2xl font-bold">{formatCents(currentBalance)}</div>
                </div>

                {pendingBalance > 0 && (
                    <div className="bg-white/20 rounded-xl p-4">
                        <div className="text-white/80 text-sm">Pending</div>
                        <div className="text-2xl font-bold">{formatCents(pendingBalance)}</div>
                    </div>
                )}

                <div className="bg-white/10 rounded-xl p-3">
                    <div className="text-white/70 text-xs">Total Earned</div>
                    <div className="text-lg font-semibold text-green-200">
                        +{formatCents(totalEarned)}
                    </div>
                </div>

                <div className="bg-white/10 rounded-xl p-3">
                    <div className="text-white/70 text-xs">Total Spent</div>
                    <div className="text-lg font-semibold text-red-200">
                        -{formatCents(Math.abs(totalSpent))}
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * Full Transaction History Component
 */
export const TransactionHistory = ({
    transactions,
    currentBalance,
    pendingBalance,
    showSummary = true
}) => {
    const [filter, setFilter] = useState('all');

    // Filter transactions
    const filteredTransactions = useMemo(() => {
        if (filter === 'all') return transactions;
        return transactions.filter(t => t.type === filter);
    }, [transactions, filter]);

    // Group transactions by date
    const groupedTransactions = useMemo(() => {
        const groups = {};
        const today = new Date().toDateString();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        filteredTransactions.forEach(txn => {
            const txnDate = new Date(txn.date).toDateString();
            let label;

            if (txnDate === today) {
                label = 'Today';
            } else if (txnDate === yesterdayStr) {
                label = 'Yesterday';
            } else {
                label = formatDate(txn.date, 'short');
            }

            if (!groups[label]) {
                groups[label] = { transactions: [], total: 0 };
            }
            groups[label].transactions.push(txn);
            groups[label].total += txn.amount;
        });

        return groups;
    }, [filteredTransactions]);

    // Calculate totals
    const { totalEarned, totalSpent } = useMemo(() => {
        return transactions.reduce((acc, txn) => {
            if (txn.amount > 0) {
                acc.totalEarned += txn.amount;
            } else {
                acc.totalSpent += Math.abs(txn.amount);
            }
            return acc;
        }, { totalEarned: 0, totalSpent: 0 });
    }, [transactions]);

    return (
        <div>
            {/* Summary Card */}
            {showSummary && (
                <TransactionSummaryCard
                    totalEarned={totalEarned}
                    totalSpent={totalSpent}
                    currentBalance={currentBalance}
                    pendingBalance={pendingBalance}
                />
            )}

            {/* Filters */}
            <TransactionFilterTabs
                activeFilter={filter}
                onFilterChange={setFilter}
            />

            {/* Transaction List */}
            {Object.keys(groupedTransactions).length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                    <p className="text-xl">No transactions yet</p>
                    <p className="mt-2">Complete some jobs to start earning!</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedTransactions).map(([label, group]) => (
                        <div key={label}>
                            <TransactionGroupHeader
                                label={label}
                                total={group.total}
                            />
                            <div className="space-y-2">
                                {group.transactions.map(txn => (
                                    <TransactionItem key={txn.id} transaction={txn} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

/**
 * Compact Transaction List (recent only)
 */
export const RecentTransactions = ({
    transactions,
    limit = 5,
    onViewAll
}) => {
    const recent = transactions.slice(0, limit);

    return (
        <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-gray-800">📜 Recent Activity</h3>
                {transactions.length > limit && (
                    <button
                        onClick={onViewAll}
                        className="text-purple-600 text-sm font-semibold hover:text-purple-700"
                    >
                        View All →
                    </button>
                )}
            </div>

            {recent.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recent activity</p>
            ) : (
                <div className="space-y-2">
                    {recent.map(txn => (
                        <TransactionItem key={txn.id} transaction={txn} showStatus={false} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default {
    TransactionIcon,
    TransactionAmount,
    TransactionStatus,
    TransactionItem,
    TransactionGroupHeader,
    TransactionFilterTabs,
    TransactionSummaryCard,
    TransactionHistory,
    RecentTransactions
};
