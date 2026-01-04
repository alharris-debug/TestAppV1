/**
 * PatternLock Component
 *
 * 9-dot pattern lock for parent authentication.
 * Supports both password setup and verification modes.
 *
 * Email Recovery Feature:
 * - To disable: Set ENABLE_EMAIL_RECOVERY to false in config/features.js
 * - Or remove emailRecovery prop from modal components
 */

import React, { useState } from 'react';
import { getPatternPath, getDotCenter } from '../utils/patternLock.js';
import { isEmailRecoveryEnabled } from '../config/features.js';

/**
 * Pattern Lock Grid Component
 *
 * @param {Object} props
 * @param {number[]} props.patternInput - Current pattern dots
 * @param {boolean} props.isDrawing - Whether user is drawing
 * @param {{x: number, y: number} | null} props.currentPoint - Current pointer position
 * @param {boolean} props.error - Error state
 * @param {boolean} props.success - Success state
 * @param {React.RefObject} props.gridRef - Grid ref
 * @param {React.RefObject} props.dotRefs - Dot refs array
 * @param {Function} props.onPatternStart - Pattern start handler
 * @param {Function} props.onPatternMove - Pattern move handler
 * @param {Function} props.onPatternEnd - Pattern end handler
 * @param {string} [props.hint] - Hint text to display
 */
export const PatternLockGrid = ({
    patternInput,
    isDrawing,
    currentPoint,
    error,
    success,
    gridRef,
    dotRefs,
    onPatternStart,
    onPatternMove,
    onPatternEnd,
    hint
}) => {
    // Generate path string for SVG line
    const pathString = React.useMemo(() => {
        if (!gridRef.current || !dotRefs.current) return '';
        return getPatternPath(
            patternInput,
            dotRefs.current,
            gridRef.current,
            isDrawing ? currentPoint : null
        );
    }, [patternInput, isDrawing, currentPoint, gridRef, dotRefs]);

    const lineClass = `pattern-line ${error ? 'error' : ''} ${success ? 'success' : ''}`;

    return (
        <div
            className="pattern-lock-container"
            onMouseMove={onPatternMove}
            onMouseUp={onPatternEnd}
            onMouseLeave={onPatternEnd}
            onTouchMove={onPatternMove}
            onTouchEnd={onPatternEnd}
        >
            <div className="pattern-grid" ref={gridRef}>
                <svg className="pattern-svg">
                    <path className={lineClass} d={pathString} />
                </svg>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(idx => (
                    <div
                        key={idx}
                        ref={el => { if (dotRefs.current) dotRefs.current[idx] = el; }}
                        className={`pattern-dot ${
                            patternInput.includes(idx) ? 'selected' : ''
                        } ${error ? 'error' : ''} ${success ? 'success' : ''}`}
                        onMouseDown={(e) => onPatternStart(idx, e)}
                        onTouchStart={(e) => onPatternStart(idx, e)}
                    />
                ))}
            </div>
            <div className="pattern-hint">
                {patternInput.length > 0 ? (
                    <span className="pattern-dots-count">{patternInput.length} dots selected</span>
                ) : (
                    hint || 'Touch a dot to start'
                )}
            </div>
        </div>
    );
};

/**
 * Password Setup Modal
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility
 * @param {Function} props.onClose - Close handler
 * @param {Object} props.patternLock - Pattern lock hook return value
 * @param {Object} [props.emailRecovery] - Email recovery hook (optional)
 */
export const PasswordSetupModal = ({
    isOpen,
    onClose,
    patternLock,
    emailRecovery
}) => {
    const [recoveryEmail, setRecoveryEmail] = useState('');
    const showEmailRecovery = isEmailRecoveryEnabled() && emailRecovery;

    if (!isOpen) return null;

    const {
        patternInput,
        isDrawing,
        currentPoint,
        success,
        gridRef,
        dotRefs,
        handlePatternStart,
        handlePatternMove,
        handlePatternEnd
    } = patternLock;

    // Save recovery email when pattern is set
    const handlePatternEndWithEmail = (e) => {
        if (showEmailRecovery && recoveryEmail && patternInput.length >= 4) {
            emailRecovery.saveRecoveryEmail(recoveryEmail);
        }
        handlePatternEnd(e);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-purple-600 text-center mb-2">
                    Create Parent Pattern
                </h2>
                <p className="text-gray-600 text-center mb-4">
                    Draw a pattern connecting at least 4 dots
                </p>

                {/* Recovery Email Input - Only show if feature enabled */}
                {showEmailRecovery && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Recovery Email <span className="text-gray-400">(optional)</span>
                        </label>
                        <input
                            type="email"
                            value={recoveryEmail}
                            onChange={(e) => setRecoveryEmail(e.target.value)}
                            placeholder="parent@email.com"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Used to reset your pattern if forgotten
                        </p>
                    </div>
                )}

                <div
                    onMouseUp={handlePatternEndWithEmail}
                    onTouchEnd={handlePatternEndWithEmail}
                >
                    <PatternLockGrid
                        patternInput={patternInput}
                        isDrawing={isDrawing}
                        currentPoint={currentPoint}
                        error={false}
                        success={success}
                        gridRef={gridRef}
                        dotRefs={dotRefs}
                        onPatternStart={handlePatternStart}
                        onPatternMove={handlePatternMove}
                        onPatternEnd={() => {}} // Handled by wrapper
                    />
                </div>

                <button
                    onClick={onClose}
                    className="w-full mt-4 py-3 bg-red-100 text-red-600 rounded-xl font-semibold hover:bg-red-200"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

/**
 * Password Entry Modal
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility
 * @param {Function} props.onClose - Close handler
 * @param {Object} props.patternLock - Pattern lock hook return value
 * @param {Function} [props.onForgotPattern] - Handler for forgot pattern click
 */
export const PasswordEntryModal = ({
    isOpen,
    onClose,
    patternLock,
    onForgotPattern
}) => {
    const showForgotPattern = isEmailRecoveryEnabled() && onForgotPattern;

    if (!isOpen) return null;

    const {
        patternInput,
        isDrawing,
        currentPoint,
        error,
        success,
        gridRef,
        dotRefs,
        handlePatternStart,
        handlePatternMove,
        handlePatternEnd
    } = patternLock;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-purple-600 text-center mb-2">
                    Enter Parent Pattern
                </h2>
                <p className="text-gray-600 text-center mb-4">
                    Draw your secret pattern to continue
                </p>

                {error && (
                    <div className="bg-red-100 text-red-600 p-3 rounded-xl text-center mb-4 font-semibold">
                        Wrong pattern! Try again.
                    </div>
                )}

                <PatternLockGrid
                    patternInput={patternInput}
                    isDrawing={isDrawing}
                    currentPoint={currentPoint}
                    error={error}
                    success={success}
                    gridRef={gridRef}
                    dotRefs={dotRefs}
                    onPatternStart={handlePatternStart}
                    onPatternMove={handlePatternMove}
                    onPatternEnd={handlePatternEnd}
                />

                <button
                    onClick={onClose}
                    className="w-full mt-4 py-3 bg-red-100 text-red-600 rounded-xl font-semibold hover:bg-red-200"
                >
                    Cancel
                </button>

                {/* Forgot Pattern Link - Only show if feature enabled */}
                {showForgotPattern && (
                    <button
                        onClick={onForgotPattern}
                        className="w-full mt-2 py-2 text-purple-600 text-sm font-medium hover:text-purple-800"
                    >
                        Forgot Pattern?
                    </button>
                )}
            </div>
        </div>
    );
};

/**
 * Pattern Recovery Modal
 *
 * Handles the forgot pattern flow with email verification.
 * To remove: Delete this component and remove imports.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility
 * @param {Function} props.onClose - Close handler
 * @param {Object} props.emailRecovery - Email recovery hook
 * @param {Function} props.onRecoveryComplete - Called when pattern is reset
 */
export const PatternRecoveryModal = ({
    isOpen,
    onClose,
    emailRecovery,
    onRecoveryComplete
}) => {
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [step, setStep] = useState('email'); // 'email' | 'code' | 'success'

    if (!isOpen || !emailRecovery) return null;

    const {
        isLoading,
        error,
        codeSent,
        sendRecoveryCode,
        verifyRecoveryCode,
        hasRecoveryEmail,
        getEmailHint,
        resetRecovery
    } = emailRecovery;

    const emailHint = getEmailHint();
    const hasEmail = hasRecoveryEmail();

    const handleSendCode = async () => {
        const success = await sendRecoveryCode(email);
        if (success) {
            setStep('code');
        }
    };

    const handleVerifyCode = () => {
        const success = verifyRecoveryCode(code);
        if (success) {
            setStep('success');
            setTimeout(() => {
                onRecoveryComplete?.();
                handleClose();
            }, 2000);
        }
    };

    const handleClose = () => {
        setEmail('');
        setCode('');
        setStep('email');
        resetRecovery();
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-purple-600 text-center mb-2">
                    {step === 'success' ? 'Pattern Reset!' : 'Forgot Pattern'}
                </h2>

                {/* No Recovery Email Set */}
                {!hasEmail && step === 'email' && (
                    <div className="text-center py-4">
                        <div className="text-5xl mb-4">😕</div>
                        <p className="text-gray-600 mb-4">
                            No recovery email was set up for this account.
                        </p>
                        <p className="text-sm text-gray-500">
                            Unfortunately, without a recovery email, the pattern cannot be reset.
                            You may need to clear app data to start fresh.
                        </p>
                    </div>
                )}

                {/* Step 1: Enter Email */}
                {hasEmail && step === 'email' && (
                    <>
                        <p className="text-gray-600 text-center mb-4">
                            Enter the recovery email to receive a reset code.
                        </p>
                        {emailHint && (
                            <p className="text-sm text-gray-500 text-center mb-4">
                                Hint: {emailHint}
                            </p>
                        )}

                        {error && (
                            <div className="bg-red-100 text-red-600 p-3 rounded-xl text-center mb-4 text-sm">
                                {error}
                            </div>
                        )}

                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter recovery email"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 mb-4 focus:ring-2 focus:ring-purple-500"
                        />

                        <button
                            onClick={handleSendCode}
                            disabled={!email || isLoading}
                            className="w-full py-3 bg-purple-500 text-white rounded-xl font-semibold hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Sending...' : 'Send Recovery Code'}
                        </button>
                    </>
                )}

                {/* Step 2: Enter Code */}
                {step === 'code' && (
                    <>
                        <p className="text-gray-600 text-center mb-4">
                            Enter the 6-digit code sent to your email.
                        </p>

                        {error && (
                            <div className="bg-red-100 text-red-600 p-3 rounded-xl text-center mb-4 text-sm">
                                {error}
                            </div>
                        )}

                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            maxLength={6}
                            className="w-full px-3 py-4 border border-gray-300 rounded-lg text-gray-700 mb-4 text-center text-2xl tracking-widest font-mono focus:ring-2 focus:ring-purple-500"
                        />

                        <button
                            onClick={handleVerifyCode}
                            disabled={code.length !== 6}
                            className="w-full py-3 bg-purple-500 text-white rounded-xl font-semibold hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Verify Code
                        </button>

                        <button
                            onClick={() => setStep('email')}
                            className="w-full mt-2 py-2 text-purple-600 text-sm font-medium hover:text-purple-800"
                        >
                            Use different email
                        </button>
                    </>
                )}

                {/* Step 3: Success */}
                {step === 'success' && (
                    <div className="text-center py-4">
                        <div className="text-5xl mb-4">✅</div>
                        <p className="text-gray-600">
                            Your pattern has been reset successfully!
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                            You'll be asked to create a new pattern.
                        </p>
                    </div>
                )}

                {step !== 'success' && (
                    <button
                        onClick={handleClose}
                        className="w-full mt-4 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </div>
    );
};

export default PatternLockGrid;
