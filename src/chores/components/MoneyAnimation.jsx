/**
 * Money Animation Components
 *
 * Provides animated visual feedback for earning and spending money.
 * Includes flying bills, coin rain, and cash register effects.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { formatCents, calculateBillCount } from '../utils/currency.js';

/**
 * Single Flying Bill Component
 */
export const FlyingBill = ({ id, startX, startY, endX, endY, delay, onComplete }) => {
    const [style, setStyle] = useState({
        position: 'fixed',
        left: startX,
        top: startY,
        fontSize: '2rem',
        opacity: 0,
        transform: 'scale(0.5) rotate(-10deg)',
        transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
        zIndex: 9999,
        pointerEvents: 'none'
    });

    useEffect(() => {
        const showTimer = setTimeout(() => {
            setStyle(prev => ({
                ...prev,
                opacity: 1,
                transform: 'scale(1) rotate(5deg)'
            }));
        }, delay);

        const moveTimer = setTimeout(() => {
            setStyle(prev => ({
                ...prev,
                left: endX,
                top: endY,
                opacity: 0,
                transform: 'scale(0.3) rotate(-20deg)'
            }));
        }, delay + 300);

        const completeTimer = setTimeout(() => {
            onComplete?.(id);
        }, delay + 1100);

        return () => {
            clearTimeout(showTimer);
            clearTimeout(moveTimer);
            clearTimeout(completeTimer);
        };
    }, [id, delay, endX, endY, onComplete]);

    return <div style={style}>💵</div>;
};

/**
 * Flying Coin Component
 */
export const FlyingCoin = ({ id, startX, startY, delay, onComplete }) => {
    const [style, setStyle] = useState({
        position: 'fixed',
        left: startX,
        top: startY,
        fontSize: '1.5rem',
        opacity: 0,
        transform: 'translateY(0) scale(0.5)',
        transition: 'all 0.6s ease-out',
        zIndex: 9999,
        pointerEvents: 'none'
    });

    useEffect(() => {
        const showTimer = setTimeout(() => {
            setStyle(prev => ({
                ...prev,
                opacity: 1,
                transform: 'translateY(-20px) scale(1)'
            }));
        }, delay);

        const fallTimer = setTimeout(() => {
            setStyle(prev => ({
                ...prev,
                opacity: 0,
                transform: 'translateY(100px) scale(0.3)'
            }));
        }, delay + 400);

        const completeTimer = setTimeout(() => {
            onComplete?.(id);
        }, delay + 1000);

        return () => {
            clearTimeout(showTimer);
            clearTimeout(fallTimer);
            clearTimeout(completeTimer);
        };
    }, [id, delay, onComplete]);

    return <div style={style}>🪙</div>;
};

/**
 * Money Rain Effect (multiple coins falling)
 */
export const MoneyRain = ({ active, coinCount = 10, duration = 2000, onComplete }) => {
    const [coins, setCoins] = useState([]);

    useEffect(() => {
        if (!active) return;

        const newCoins = [];
        for (let i = 0; i < coinCount; i++) {
            newCoins.push({
                id: `coin_${Date.now()}_${i}`,
                x: Math.random() * window.innerWidth,
                delay: Math.random() * 500
            });
        }
        setCoins(newCoins);

        const timer = setTimeout(() => {
            setCoins([]);
            onComplete?.();
        }, duration);

        return () => clearTimeout(timer);
    }, [active, coinCount, duration, onComplete]);

    if (!active && coins.length === 0) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {coins.map(coin => (
                <FlyingCoin
                    key={coin.id}
                    id={coin.id}
                    startX={coin.x}
                    startY={-50}
                    delay={coin.delay}
                />
            ))}
        </div>
    );
};

/**
 * Cash Burst Effect (bills flying out from a point)
 */
export const CashBurst = ({
    active,
    originX,
    originY,
    amount,
    onComplete
}) => {
    const [bills, setBills] = useState([]);

    useEffect(() => {
        if (!active || !amount) return;

        const billCount = calculateBillCount(amount);
        const newBills = [];

        for (let i = 0; i < billCount; i++) {
            const angle = (Math.PI * 2 * i) / billCount - Math.PI / 2;
            const distance = 100 + Math.random() * 50;
            newBills.push({
                id: `bill_${Date.now()}_${i}`,
                endX: originX + Math.cos(angle) * distance,
                endY: originY + Math.sin(angle) * distance,
                delay: i * 50
            });
        }
        setBills(newBills);

        const timer = setTimeout(() => {
            setBills([]);
            onComplete?.();
        }, 1500);

        return () => clearTimeout(timer);
    }, [active, originX, originY, amount, onComplete]);

    if (!active && bills.length === 0) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-50">
            {bills.map(bill => (
                <FlyingBill
                    key={bill.id}
                    id={bill.id}
                    startX={originX}
                    startY={originY}
                    endX={bill.endX}
                    endY={bill.endY}
                    delay={bill.delay}
                />
            ))}
        </div>
    );
};

/**
 * Money Counter Animation
 */
export const MoneyCounter = ({
    amount,
    duration = 1000,
    onComplete,
    className = ''
}) => {
    const [displayAmount, setDisplayAmount] = useState(0);

    useEffect(() => {
        if (amount === 0) {
            setDisplayAmount(0);
            return;
        }

        const startTime = Date.now();
        const startAmount = 0;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out cubic
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(startAmount + (amount - startAmount) * easeOut);

            setDisplayAmount(current);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                onComplete?.();
            }
        };

        requestAnimationFrame(animate);
    }, [amount, duration, onComplete]);

    return (
        <span className={`font-bold ${className}`}>
            {formatCents(displayAmount)}
        </span>
    );
};

/**
 * Earning Toast Notification
 */
export const EarningToast = ({
    amount,
    description,
    visible,
    onHide
}) => {
    useEffect(() => {
        if (visible) {
            const timer = setTimeout(onHide, 3000);
            return () => clearTimeout(timer);
        }
    }, [visible, onHide]);

    if (!visible) return null;

    return (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-2xl shadow-lg flex items-center gap-3">
                <span className="text-3xl">💵</span>
                <div>
                    <div className="text-xl font-bold">+{formatCents(amount)}</div>
                    {description && (
                        <div className="text-sm text-green-100">{description}</div>
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * Spending Toast Notification
 */
export const SpendingToast = ({
    amount,
    description,
    visible,
    onHide
}) => {
    useEffect(() => {
        if (visible) {
            const timer = setTimeout(onHide, 3000);
            return () => clearTimeout(timer);
        }
    }, [visible, onHide]);

    if (!visible) return null;

    return (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-4 rounded-2xl shadow-lg flex items-center gap-3">
                <span className="text-3xl">🛒</span>
                <div>
                    <div className="text-xl font-bold">-{formatCents(Math.abs(amount))}</div>
                    {description && (
                        <div className="text-sm text-orange-100">{description}</div>
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * Money Animation Hook
 * Provides easy access to money animations
 */
export const useMoneyAnimations = (soundSystem) => {
    const [earningToast, setEarningToast] = useState({ visible: false, amount: 0, description: '' });
    const [spendingToast, setSpendingToast] = useState({ visible: false, amount: 0, description: '' });
    const [cashBurst, setCashBurst] = useState({ active: false, x: 0, y: 0, amount: 0 });
    const [moneyRain, setMoneyRain] = useState(false);

    const showEarning = useCallback((amount, description = '', playSound = true) => {
        setEarningToast({ visible: true, amount, description });
        if (playSound && soundSystem?.play) {
            soundSystem.play('coin'); // Assume coin sound exists
        }
    }, [soundSystem]);

    const showSpending = useCallback((amount, description = '', playSound = true) => {
        setSpendingToast({ visible: true, amount, description });
        if (playSound && soundSystem?.play) {
            soundSystem.play('purchase'); // Assume purchase sound exists
        }
    }, [soundSystem]);

    const showCashBurst = useCallback((x, y, amount) => {
        setCashBurst({ active: true, x, y, amount });
    }, []);

    const showMoneyRain = useCallback(() => {
        setMoneyRain(true);
    }, []);

    const hideEarningToast = useCallback(() => {
        setEarningToast(prev => ({ ...prev, visible: false }));
    }, []);

    const hideSpendingToast = useCallback(() => {
        setSpendingToast(prev => ({ ...prev, visible: false }));
    }, []);

    const hideCashBurst = useCallback(() => {
        setCashBurst(prev => ({ ...prev, active: false }));
    }, []);

    const hideMoneyRain = useCallback(() => {
        setMoneyRain(false);
    }, []);

    const AnimationOverlay = useCallback(() => (
        <>
            <EarningToast
                amount={earningToast.amount}
                description={earningToast.description}
                visible={earningToast.visible}
                onHide={hideEarningToast}
            />
            <SpendingToast
                amount={spendingToast.amount}
                description={spendingToast.description}
                visible={spendingToast.visible}
                onHide={hideSpendingToast}
            />
            <CashBurst
                active={cashBurst.active}
                originX={cashBurst.x}
                originY={cashBurst.y}
                amount={cashBurst.amount}
                onComplete={hideCashBurst}
            />
            <MoneyRain
                active={moneyRain}
                onComplete={hideMoneyRain}
            />
        </>
    ), [earningToast, spendingToast, cashBurst, moneyRain, hideEarningToast, hideSpendingToast, hideCashBurst, hideMoneyRain]);

    return {
        showEarning,
        showSpending,
        showCashBurst,
        showMoneyRain,
        AnimationOverlay
    };
};

/**
 * CSS Keyframes (add to your stylesheet)
 */
export const MONEY_ANIMATION_CSS = `
@keyframes slide-in {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes float-up {
    from {
        transform: translateY(0) scale(1);
        opacity: 1;
    }
    to {
        transform: translateY(-50px) scale(0.8);
        opacity: 0;
    }
}

@keyframes coin-spin {
    0% { transform: rotateY(0deg); }
    100% { transform: rotateY(360deg); }
}

@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px) rotate(-5deg); }
    75% { transform: translateX(5px) rotate(5deg); }
}

.animate-slide-in {
    animation: slide-in 0.3s ease-out forwards;
}

.animate-float-up {
    animation: float-up 1s ease-out forwards;
}

.animate-coin-spin {
    animation: coin-spin 0.5s linear infinite;
}

.animate-shake {
    animation: shake 0.3s ease-in-out;
}
`;

export default {
    FlyingBill,
    FlyingCoin,
    MoneyRain,
    CashBurst,
    MoneyCounter,
    EarningToast,
    SpendingToast,
    useMoneyAnimations,
    MONEY_ANIMATION_CSS
};
