/**
 * PatternLock Component
 *
 * 9-dot pattern lock for parent authentication.
 * Supports both password setup and verification modes.
 */

import React from 'react';
import { getPatternPath, getDotCenter } from '../utils/patternLock.js';

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
            ref={gridRef}
            onMouseMove={onPatternMove}
            onMouseUp={onPatternEnd}
            onMouseLeave={onPatternEnd}
            onTouchMove={onPatternMove}
            onTouchEnd={onPatternEnd}
        >
            <div className="pattern-grid">
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
 * @param {Function} props.onClear - Clear pattern handler
 * @param {Object} props.patternLock - Pattern lock hook return value
 */
export const PasswordSetupModal = ({
    isOpen,
    onClose,
    onClear,
    patternLock
}) => {
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

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-purple-600 text-center mb-2">
                    Create Parent Pattern
                </h2>
                <p className="text-gray-600 text-center mb-4">
                    Draw a pattern connecting at least 4 dots
                </p>

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
                    onPatternEnd={handlePatternEnd}
                />

                <div className="flex gap-3 mt-4">
                    <button
                        onClick={onClear}
                        className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300"
                    >
                        Clear
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-red-100 text-red-600 rounded-xl font-semibold hover:bg-red-200"
                    >
                        Cancel
                    </button>
                </div>
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
 * @param {Function} props.onClear - Clear pattern handler
 * @param {Object} props.patternLock - Pattern lock hook return value
 */
export const PasswordEntryModal = ({
    isOpen,
    onClose,
    onClear,
    patternLock
}) => {
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

                <div className="flex gap-3 mt-4">
                    <button
                        onClick={onClear}
                        className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300"
                    >
                        Clear
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-red-100 text-red-600 rounded-xl font-semibold hover:bg-red-200"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PatternLockGrid;
