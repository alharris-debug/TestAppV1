/**
 * Pattern Lock Utility Functions
 *
 * This module provides utility functions for the 9-dot pattern lock
 * security feature used to protect parent-only functionality.
 */

import { PATTERN_LOCK_CONFIG } from '../constants.js';

/**
 * Get the center coordinates of a pattern dot relative to the grid
 *
 * @param {number} dotIndex - Index of the dot (0-8)
 * @param {HTMLElement[]} dotRefs - Array of dot DOM element references
 * @param {HTMLElement} gridRef - Grid container DOM element reference
 * @returns {{x: number, y: number} | null} Center coordinates or null if refs unavailable
 */
export const getDotCenter = (dotIndex, dotRefs, gridRef) => {
    const dot = dotRefs[dotIndex];
    if (!dot || !gridRef) return null;

    const dotRect = dot.getBoundingClientRect();
    const gridRect = gridRef.getBoundingClientRect();

    return {
        x: dotRect.left + dotRect.width / 2 - gridRect.left,
        y: dotRect.top + dotRect.height / 2 - gridRect.top
    };
};

/**
 * Generate SVG path string for the pattern line
 *
 * @param {number[]} pattern - Array of dot indices in the pattern
 * @param {HTMLElement[]} dotRefs - Array of dot DOM element references
 * @param {HTMLElement} gridRef - Grid container DOM element reference
 * @param {{x: number, y: number} | null} currentPoint - Current pointer position (for drawing)
 * @returns {string} SVG path 'd' attribute value
 */
export const getPatternPath = (pattern, dotRefs, gridRef, currentPoint = null) => {
    if (pattern.length === 0) return '';

    const points = pattern
        .map(idx => getDotCenter(idx, dotRefs, gridRef))
        .filter(Boolean);

    if (points.length === 0) return '';

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
        path += ` L ${points[i].x} ${points[i].y}`;
    }

    // Add line to current pointer position while drawing
    if (currentPoint && points.length > 0) {
        path += ` L ${currentPoint.x} ${currentPoint.y}`;
    }

    return path;
};

/**
 * Verify if an input pattern matches the stored password
 *
 * @param {number[]} input - Pattern input to verify
 * @param {number[] | null} password - Stored password pattern
 * @returns {boolean} True if patterns match
 */
export const verifyPattern = (input, password) => {
    if (!password || !Array.isArray(password)) return false;
    if (input.length !== password.length) return false;
    return input.every((dot, idx) => dot === password[idx]);
};

/**
 * Check if a point is within hit radius of a dot
 *
 * @param {number} clientX - Client X coordinate of pointer
 * @param {number} clientY - Client Y coordinate of pointer
 * @param {HTMLElement} dot - Dot DOM element
 * @param {number} [hitRadius=35] - Pixel radius for hit detection
 * @returns {boolean} True if point is within hit radius
 */
export const isPointNearDot = (clientX, clientY, dot, hitRadius = PATTERN_LOCK_CONFIG.DOT_HIT_RADIUS) => {
    if (!dot) return false;

    const dotRect = dot.getBoundingClientRect();
    const dotCenterX = dotRect.left + dotRect.width / 2;
    const dotCenterY = dotRect.top + dotRect.height / 2;

    const distance = Math.sqrt(
        Math.pow(clientX - dotCenterX, 2) +
        Math.pow(clientY - dotCenterY, 2)
    );

    return distance < hitRadius;
};

/**
 * Get pointer coordinates from mouse or touch event
 *
 * @param {MouseEvent | TouchEvent} event - The pointer event
 * @returns {{clientX: number, clientY: number}} Pointer coordinates
 */
export const getPointerCoordinates = (event) => {
    if (event.touches && event.touches.length > 0) {
        return {
            clientX: event.touches[0].clientX,
            clientY: event.touches[0].clientY
        };
    }
    return {
        clientX: event.clientX,
        clientY: event.clientY
    };
};

/**
 * Calculate relative position within grid
 *
 * @param {MouseEvent | TouchEvent} event - The pointer event
 * @param {HTMLElement} gridRef - Grid container DOM element
 * @returns {{x: number, y: number} | null} Relative coordinates or null
 */
export const getRelativePosition = (event, gridRef) => {
    if (!gridRef) return null;

    const gridRect = gridRef.getBoundingClientRect();
    const { clientX, clientY } = getPointerCoordinates(event);

    return {
        x: clientX - gridRect.left,
        y: clientY - gridRect.top
    };
};

/**
 * Check if pattern meets minimum length requirement
 *
 * @param {number[]} pattern - The pattern to validate
 * @param {number} [minDots=4] - Minimum required dots
 * @returns {boolean} True if pattern is valid length
 */
export const isPatternValid = (pattern, minDots = PATTERN_LOCK_CONFIG.MIN_DOTS) => {
    return Array.isArray(pattern) && pattern.length >= minDots;
};
