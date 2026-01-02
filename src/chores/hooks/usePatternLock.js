/**
 * usePatternLock Hook
 *
 * Custom React hook for managing 9-dot pattern lock functionality.
 * Handles pattern drawing, verification, and state management.
 */

import { useState, useRef, useCallback } from 'react';
import {
    verifyPattern,
    isPointNearDot,
    getPointerCoordinates,
    getRelativePosition,
    isPatternValid
} from '../utils/patternLock.js';
import { PATTERN_LOCK_CONFIG } from '../constants.js';

/**
 * Hook for pattern lock functionality
 *
 * @param {Object} options - Hook options
 * @param {number[] | null} options.storedPassword - Currently stored password pattern
 * @param {Function} options.onPasswordSet - Callback when new password is set
 * @param {Function} options.onVerificationSuccess - Callback when pattern verified successfully
 * @param {Function} options.onVerificationFail - Callback when pattern verification fails
 * @param {Object} [options.soundSystem] - Optional sound system for audio feedback
 * @returns {Object} Pattern lock state and handlers
 */
export const usePatternLock = ({
    storedPassword,
    onPasswordSet,
    onVerificationSuccess,
    onVerificationFail,
    soundSystem
}) => {
    // Pattern state
    const [patternInput, setPatternInput] = useState([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPoint, setCurrentPoint] = useState(null);
    const [error, setError] = useState(false);
    const [success, setSuccess] = useState(false);

    // Mode state
    const [isSetupMode, setIsSetupMode] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);

    // DOM refs
    const gridRef = useRef(null);
    const dotRefs = useRef([]);

    /**
     * Clear pattern input and reset state
     */
    const clearPattern = useCallback(() => {
        setPatternInput([]);
        setError(false);
        setSuccess(false);
    }, []);

    /**
     * Start drawing pattern from a dot
     */
    const handlePatternStart = useCallback((dotIndex, event) => {
        event.preventDefault();
        setIsDrawing(true);
        setPatternInput([dotIndex]);
        setError(false);
        setSuccess(false);

        if (soundSystem?.buttonClick) {
            soundSystem.buttonClick();
        }
    }, [soundSystem]);

    /**
     * Handle pointer movement while drawing
     */
    const handlePatternMove = useCallback((event) => {
        if (!isDrawing || !gridRef.current) return;

        const position = getRelativePosition(event, gridRef.current);
        if (position) {
            setCurrentPoint(position);
        }

        // Check if we're over a new dot
        const { clientX, clientY } = getPointerCoordinates(event);

        dotRefs.current.forEach((dot, idx) => {
            if (!dot || patternInput.includes(idx)) return;

            if (isPointNearDot(clientX, clientY, dot)) {
                setPatternInput(prev => [...prev, idx]);
                if (soundSystem?.buttonClick) {
                    soundSystem.buttonClick();
                }
            }
        });
    }, [isDrawing, patternInput, soundSystem]);

    /**
     * Handle pattern drawing end
     */
    const handlePatternEnd = useCallback(() => {
        if (!isDrawing) return;

        setIsDrawing(false);
        setCurrentPoint(null);

        // Check minimum pattern length
        if (!isPatternValid(patternInput)) {
            setPatternInput([]);
            return;
        }

        if (isSetupMode) {
            // Setting up new password
            if (onPasswordSet) {
                onPasswordSet([...patternInput]);
            }
            setSuccess(true);

            if (soundSystem?.taskComplete) {
                soundSystem.taskComplete();
            }

            setTimeout(() => {
                setIsSetupMode(false);
                setPatternInput([]);
                setSuccess(false);

                if (pendingAction) {
                    pendingAction();
                    setPendingAction(null);
                }

                // Also call verification success after setup (grants access)
                if (onVerificationSuccess) {
                    onVerificationSuccess();
                }
            }, 600);
        } else {
            // Verifying password
            if (verifyPattern(patternInput, storedPassword)) {
                setSuccess(true);

                if (soundSystem?.taskComplete) {
                    soundSystem.taskComplete();
                }

                setTimeout(() => {
                    setPatternInput([]);
                    setSuccess(false);

                    if (pendingAction) {
                        pendingAction();
                        setPendingAction(null);
                    }

                    if (onVerificationSuccess) {
                        onVerificationSuccess();
                    }
                }, 600);
            } else {
                setError(true);

                if (soundSystem?.defeat) {
                    soundSystem.defeat();
                }

                setTimeout(() => {
                    setPatternInput([]);
                    setError(false);
                }, 800);

                if (onVerificationFail) {
                    onVerificationFail();
                }
            }
        }
    }, [
        isDrawing,
        patternInput,
        isSetupMode,
        storedPassword,
        pendingAction,
        onPasswordSet,
        onVerificationSuccess,
        onVerificationFail,
        soundSystem
    ]);

    /**
     * Request access with pattern lock
     * Opens setup if no password exists, otherwise opens verification
     */
    const requestAccess = useCallback((action) => {
        setPendingAction(() => action);
        clearPattern();

        if (!storedPassword) {
            setIsSetupMode(true);
        } else {
            setIsSetupMode(false);
        }
    }, [storedPassword, clearPattern]);

    /**
     * Cancel pattern entry
     */
    const cancel = useCallback(() => {
        setIsSetupMode(false);
        setPendingAction(null);
        clearPattern();
    }, [clearPattern]);

    /**
     * Check if pattern lock is active (needs user input)
     */
    const isActive = pendingAction !== null;

    /**
     * Check if currently in setup mode
     */
    const isSettingUp = isSetupMode && isActive;

    /**
     * Check if currently verifying
     */
    const isVerifying = !isSetupMode && isActive;

    return {
        // State
        patternInput,
        isDrawing,
        currentPoint,
        error,
        success,
        isActive,
        isSettingUp,
        isVerifying,
        dotCount: patternInput.length,

        // Refs
        gridRef,
        dotRefs,

        // Handlers
        handlePatternStart,
        handlePatternMove,
        handlePatternEnd,
        clearPattern,
        requestAccess,
        cancel,

        // Configuration
        minDots: PATTERN_LOCK_CONFIG.MIN_DOTS,
        totalDots: PATTERN_LOCK_CONFIG.DOT_COUNT
    };
};

export default usePatternLock;
