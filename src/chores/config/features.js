/**
 * Feature Flags Configuration
 *
 * Easy toggle for experimental features.
 * Set to false to disable features not ready for production.
 */

export const FEATURES = {
    /**
     * Email Recovery System
     *
     * When enabled, allows parents to set a recovery email during pattern setup.
     * If they forget their pattern, they can request a recovery code via email.
     *
     * Requirements for production:
     * 1. Sign up for EmailJS (https://www.emailjs.com/)
     * 2. Create an email template with {{recovery_code}} variable
     * 3. Set the config values below
     *
     * To disable: Set ENABLE_EMAIL_RECOVERY to false
     */
    ENABLE_EMAIL_RECOVERY: true,

    // EmailJS Configuration (get these from your EmailJS dashboard)
    EMAILJS_CONFIG: {
        SERVICE_ID: 'YOUR_SERVICE_ID',      // e.g., 'service_abc123'
        TEMPLATE_ID: 'YOUR_TEMPLATE_ID',    // e.g., 'template_xyz789'
        PUBLIC_KEY: 'YOUR_PUBLIC_KEY'       // e.g., 'AbCdEfGhIjKlMnOp'
    }
};

/**
 * Check if email recovery is properly configured
 */
export const isEmailRecoveryConfigured = () => {
    const { EMAILJS_CONFIG } = FEATURES;
    return (
        FEATURES.ENABLE_EMAIL_RECOVERY &&
        EMAILJS_CONFIG.SERVICE_ID !== 'YOUR_SERVICE_ID' &&
        EMAILJS_CONFIG.TEMPLATE_ID !== 'YOUR_TEMPLATE_ID' &&
        EMAILJS_CONFIG.PUBLIC_KEY !== 'YOUR_PUBLIC_KEY'
    );
};

/**
 * Check if email recovery feature is enabled (even if not fully configured)
 * This allows the UI to show but with a "not configured" message
 */
export const isEmailRecoveryEnabled = () => {
    return FEATURES.ENABLE_EMAIL_RECOVERY;
};

export default FEATURES;
