/**
 * useEmailRecovery Hook
 *
 * Handles email-based pattern lock recovery.
 * Uses EmailJS for sending recovery codes without a backend.
 *
 * To remove this feature:
 * 1. Set ENABLE_EMAIL_RECOVERY to false in config/features.js
 * 2. Or delete this file and remove imports
 */

import { useState, useCallback } from 'react';
import { FEATURES, isEmailRecoveryConfigured } from '../config/features.js';

// Recovery code settings
const CODE_LENGTH = 6;
const CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Generate a random numeric recovery code
 */
const generateRecoveryCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Simple hash for storing email (not cryptographically secure, just obfuscation)
 * For production, consider a proper hashing library
 */
const simpleHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(36);
};

/**
 * Email Recovery Hook
 */
export const useEmailRecovery = ({ onRecoverySuccess }) => {
    const [recoveryEmail, setRecoveryEmail] = useState('');
    const [pendingCode, setPendingCode] = useState(null);
    const [codeExpiry, setCodeExpiry] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [codeSent, setCodeSent] = useState(false);

    /**
     * Store recovery email (hashed) in localStorage
     */
    const saveRecoveryEmail = useCallback((email) => {
        if (!email) return;
        const emailLower = email.toLowerCase().trim();
        localStorage.setItem('family_economy_recovery_email', simpleHash(emailLower));
        localStorage.setItem('family_economy_recovery_email_hint',
            emailLower.substring(0, 2) + '***@' + emailLower.split('@')[1]
        );
    }, []);

    /**
     * Get email hint for display (e.g., "jo***@gmail.com")
     */
    const getEmailHint = useCallback(() => {
        return localStorage.getItem('family_economy_recovery_email_hint') || null;
    }, []);

    /**
     * Check if recovery email is set
     */
    const hasRecoveryEmail = useCallback(() => {
        return !!localStorage.getItem('family_economy_recovery_email');
    }, []);

    /**
     * Verify email matches stored hash
     */
    const verifyEmail = useCallback((email) => {
        const storedHash = localStorage.getItem('family_economy_recovery_email');
        if (!storedHash) return false;
        return simpleHash(email.toLowerCase().trim()) === storedHash;
    }, []);

    /**
     * Send recovery code via EmailJS
     */
    const sendRecoveryCode = useCallback(async (email) => {
        setIsLoading(true);
        setError(null);

        // Verify email matches
        if (!verifyEmail(email)) {
            setError('Email does not match the recovery email on file.');
            setIsLoading(false);
            return false;
        }

        // Generate code
        const code = generateRecoveryCode();

        // Check if EmailJS is configured
        if (!isEmailRecoveryConfigured()) {
            // Demo mode - just show the code (for testing)
            setPendingCode(code);
            setCodeExpiry(Date.now() + CODE_EXPIRY_MS);
            setCodeSent(true);
            setIsLoading(false);

            // In demo mode, show code in console and alert
            console.log('DEMO MODE - Recovery code:', code);
            alert(`Demo Mode: Your recovery code is ${code}\n\n(In production, this would be emailed to you.\nConfigure EmailJS in config/features.js)`);
            return true;
        }

        // EmailJS is configured - try to send email
        // Note: Requires 'npm install @emailjs/browser' to be installed
        // For now, since @emailjs/browser is not installed, fall back to demo mode
        // To enable real emails:
        // 1. npm install @emailjs/browser
        // 2. Uncomment the emailjs import and sending code below
        // 3. Configure your EmailJS credentials in config/features.js

        /*
        try {
            const emailjs = await import('@emailjs/browser');
            await emailjs.send(
                FEATURES.EMAILJS_CONFIG.SERVICE_ID,
                FEATURES.EMAILJS_CONFIG.TEMPLATE_ID,
                { to_email: email, recovery_code: code, app_name: 'Family Economy', expiry_minutes: '10' },
                FEATURES.EMAILJS_CONFIG.PUBLIC_KEY
            );
            setPendingCode(code);
            setCodeExpiry(Date.now() + CODE_EXPIRY_MS);
            setCodeSent(true);
            setIsLoading(false);
            return true;
        } catch (err) {
            console.error('Failed to send recovery email:', err);
            setError('Failed to send recovery email. Please try again.');
            setIsLoading(false);
            return false;
        }
        */

        // Temporary demo mode until EmailJS is installed
        setPendingCode(code);
        setCodeExpiry(Date.now() + CODE_EXPIRY_MS);
        setCodeSent(true);
        setIsLoading(false);
        console.log('EmailJS configured but not installed. Recovery code:', code);
        alert(`Setup Required: Your recovery code is ${code}\n\nTo enable real email delivery:\n1. npm install @emailjs/browser\n2. Uncomment EmailJS code in useEmailRecovery.js`);
        return true;
    }, [verifyEmail]);

    /**
     * Verify recovery code
     */
    const verifyRecoveryCode = useCallback((enteredCode) => {
        setError(null);

        if (!pendingCode || !codeExpiry) {
            setError('No recovery code pending. Please request a new one.');
            return false;
        }

        if (Date.now() > codeExpiry) {
            setError('Recovery code has expired. Please request a new one.');
            setPendingCode(null);
            setCodeExpiry(null);
            setCodeSent(false);
            return false;
        }

        if (enteredCode !== pendingCode) {
            setError('Invalid recovery code. Please try again.');
            return false;
        }

        // Success - clear the stored pattern
        localStorage.removeItem('family_economy_parent_password');
        setPendingCode(null);
        setCodeExpiry(null);
        setCodeSent(false);

        if (onRecoverySuccess) {
            onRecoverySuccess();
        }

        return true;
    }, [pendingCode, codeExpiry, onRecoverySuccess]);

    /**
     * Reset recovery state
     */
    const resetRecovery = useCallback(() => {
        setPendingCode(null);
        setCodeExpiry(null);
        setCodeSent(false);
        setError(null);
        setRecoveryEmail('');
    }, []);

    /**
     * Get time remaining for code
     */
    const getTimeRemaining = useCallback(() => {
        if (!codeExpiry) return 0;
        return Math.max(0, Math.ceil((codeExpiry - Date.now()) / 1000));
    }, [codeExpiry]);

    return {
        // State
        recoveryEmail,
        setRecoveryEmail,
        isLoading,
        error,
        codeSent,

        // Actions
        saveRecoveryEmail,
        sendRecoveryCode,
        verifyRecoveryCode,
        resetRecovery,

        // Helpers
        hasRecoveryEmail,
        getEmailHint,
        getTimeRemaining,
        isConfigured: isEmailRecoveryConfigured()
    };
};

export default useEmailRecovery;
