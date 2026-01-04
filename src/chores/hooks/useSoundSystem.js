/**
 * Sound Effects System for Family Economy App
 *
 * A scalable, extensible sound system that supports:
 * - Multiple sound categories (UI, rewards, notifications)
 * - Volume control per category and global
 * - Mute functionality
 * - Easy addition of new sounds
 * - Web Audio API for better performance
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// ============ SOUND DEFINITIONS ============
// Add new sounds here - the system will automatically handle loading and playing

export const SOUND_CATEGORIES = {
    UI: 'ui',
    REWARDS: 'rewards',
    NOTIFICATIONS: 'notifications',
    FEEDBACK: 'feedback'
};

export const SOUNDS = {
    // UI Sounds
    BUTTON_CLICK: {
        id: 'button_click',
        category: SOUND_CATEGORIES.UI,
        // Using Web Audio API generated sounds for now
        // Can be replaced with actual audio files later
        generator: 'click'
    },
    MODAL_OPEN: {
        id: 'modal_open',
        category: SOUND_CATEGORIES.UI,
        generator: 'swoosh'
    },
    MODAL_CLOSE: {
        id: 'modal_close',
        category: SOUND_CATEGORIES.UI,
        generator: 'swoosh_reverse'
    },
    TAB_SWITCH: {
        id: 'tab_switch',
        category: SOUND_CATEGORIES.UI,
        generator: 'tick'
    },

    // Reward Sounds
    TASK_COMPLETE: {
        id: 'task_complete',
        category: SOUND_CATEGORIES.REWARDS,
        generator: 'success'
    },
    MONEY_EARNED: {
        id: 'money_earned',
        category: SOUND_CATEGORIES.REWARDS,
        generator: 'coin'
    },
    CASH_REGISTER: {
        id: 'cash_register',
        category: SOUND_CATEGORIES.REWARDS,
        generator: 'cha_ching'
    },
    STREAK_BONUS: {
        id: 'streak_bonus',
        category: SOUND_CATEGORIES.REWARDS,
        generator: 'fanfare'
    },
    LEVEL_UP: {
        id: 'level_up',
        category: SOUND_CATEGORIES.REWARDS,
        generator: 'level_up'
    },

    // Notification Sounds
    APPROVAL_NEEDED: {
        id: 'approval_needed',
        category: SOUND_CATEGORIES.NOTIFICATIONS,
        generator: 'notification'
    },
    APPROVED: {
        id: 'approved',
        category: SOUND_CATEGORIES.NOTIFICATIONS,
        generator: 'approved'
    },
    REJECTED: {
        id: 'rejected',
        category: SOUND_CATEGORIES.NOTIFICATIONS,
        generator: 'rejected'
    },

    // Feedback Sounds
    ERROR: {
        id: 'error',
        category: SOUND_CATEGORIES.FEEDBACK,
        generator: 'error'
    },
    WARNING: {
        id: 'warning',
        category: SOUND_CATEGORIES.FEEDBACK,
        generator: 'warning'
    }
};

// ============ SOUND GENERATORS ============
// Generate sounds using Web Audio API (no external files needed)

const createSoundGenerator = (audioContext) => {
    const generators = {
        click: () => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.frequency.value = 800;
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.3, audioContext.currentTime);
            gain.gain.exponentialDecayTo(0.01, audioContext.currentTime + 0.1);
            osc.start();
            osc.stop(audioContext.currentTime + 0.1);
        },

        tick: () => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.frequency.value = 1200;
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.2, audioContext.currentTime);
            gain.gain.exponentialDecayTo(0.01, audioContext.currentTime + 0.05);
            osc.start();
            osc.stop(audioContext.currentTime + 0.05);
        },

        success: () => {
            const now = audioContext.currentTime;
            [523.25, 659.25, 783.99].forEach((freq, i) => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.frequency.value = freq;
                osc.type = 'sine';
                gain.gain.setValueAtTime(0, now + i * 0.1);
                gain.gain.linearRampToValueAtTime(0.3, now + i * 0.1 + 0.02);
                gain.gain.exponentialDecayTo(0.01, now + i * 0.1 + 0.3);
                osc.start(now + i * 0.1);
                osc.stop(now + i * 0.1 + 0.3);
            });
        },

        coin: () => {
            const now = audioContext.currentTime;
            [1200, 1500, 1800].forEach((freq, i) => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.frequency.value = freq;
                osc.type = 'square';
                gain.gain.setValueAtTime(0.15, now + i * 0.05);
                gain.gain.exponentialDecayTo(0.01, now + i * 0.05 + 0.1);
                osc.start(now + i * 0.05);
                osc.stop(now + i * 0.05 + 0.1);
            });
        },

        cha_ching: () => {
            const now = audioContext.currentTime;
            // Cash register "cha" - noise burst
            const noise = audioContext.createBufferSource();
            const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.1, audioContext.sampleRate);
            const noiseData = noiseBuffer.getChannelData(0);
            for (let i = 0; i < noiseData.length; i++) {
                noiseData[i] = Math.random() * 2 - 1;
            }
            noise.buffer = noiseBuffer;
            const noiseGain = audioContext.createGain();
            noise.connect(noiseGain);
            noiseGain.connect(audioContext.destination);
            noiseGain.gain.setValueAtTime(0.2, now);
            noiseGain.gain.exponentialDecayTo(0.01, now + 0.1);
            noise.start(now);

            // "Ching" - bell tones
            [2000, 2500, 3000].forEach((freq, i) => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.frequency.value = freq;
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.2, now + 0.1 + i * 0.02);
                gain.gain.exponentialDecayTo(0.01, now + 0.1 + i * 0.02 + 0.3);
                osc.start(now + 0.1 + i * 0.02);
                osc.stop(now + 0.5);
            });
        },

        fanfare: () => {
            const now = audioContext.currentTime;
            const notes = [523.25, 659.25, 783.99, 1046.5];
            notes.forEach((freq, i) => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.frequency.value = freq;
                osc.type = 'triangle';
                gain.gain.setValueAtTime(0, now + i * 0.15);
                gain.gain.linearRampToValueAtTime(0.25, now + i * 0.15 + 0.05);
                gain.gain.exponentialDecayTo(0.01, now + i * 0.15 + 0.4);
                osc.start(now + i * 0.15);
                osc.stop(now + i * 0.15 + 0.4);
            });
        },

        level_up: () => {
            const now = audioContext.currentTime;
            for (let i = 0; i < 8; i++) {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.frequency.value = 400 + i * 100;
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.2, now + i * 0.05);
                gain.gain.exponentialDecayTo(0.01, now + i * 0.05 + 0.15);
                osc.start(now + i * 0.05);
                osc.stop(now + i * 0.05 + 0.15);
            }
        },

        swoosh: () => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.frequency.setValueAtTime(200, audioContext.currentTime);
            osc.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.15);
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.15, audioContext.currentTime);
            gain.gain.exponentialDecayTo(0.01, audioContext.currentTime + 0.15);
            osc.start();
            osc.stop(audioContext.currentTime + 0.15);
        },

        swoosh_reverse: () => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.frequency.setValueAtTime(800, audioContext.currentTime);
            osc.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.15);
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.15, audioContext.currentTime);
            gain.gain.exponentialDecayTo(0.01, audioContext.currentTime + 0.15);
            osc.start();
            osc.stop(audioContext.currentTime + 0.15);
        },

        notification: () => {
            const now = audioContext.currentTime;
            [880, 1100].forEach((freq, i) => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.frequency.value = freq;
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.2, now + i * 0.15);
                gain.gain.exponentialDecayTo(0.01, now + i * 0.15 + 0.2);
                osc.start(now + i * 0.15);
                osc.stop(now + i * 0.15 + 0.2);
            });
        },

        approved: () => {
            const now = audioContext.currentTime;
            [523.25, 783.99].forEach((freq, i) => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.frequency.value = freq;
                osc.type = 'triangle';
                gain.gain.setValueAtTime(0.25, now + i * 0.1);
                gain.gain.exponentialDecayTo(0.01, now + i * 0.1 + 0.3);
                osc.start(now + i * 0.1);
                osc.stop(now + i * 0.1 + 0.3);
            });
        },

        rejected: () => {
            const now = audioContext.currentTime;
            [300, 250].forEach((freq, i) => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.frequency.value = freq;
                osc.type = 'sawtooth';
                gain.gain.setValueAtTime(0.15, now + i * 0.15);
                gain.gain.exponentialDecayTo(0.01, now + i * 0.15 + 0.2);
                osc.start(now + i * 0.15);
                osc.stop(now + i * 0.15 + 0.2);
            });
        },

        error: () => {
            const now = audioContext.currentTime;
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.frequency.value = 200;
            osc.type = 'square';
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialDecayTo(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        },

        warning: () => {
            const now = audioContext.currentTime;
            [400, 350, 400].forEach((freq, i) => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.frequency.value = freq;
                osc.type = 'triangle';
                gain.gain.setValueAtTime(0.15, now + i * 0.1);
                gain.gain.exponentialDecayTo(0.01, now + i * 0.1 + 0.1);
                osc.start(now + i * 0.1);
                osc.stop(now + i * 0.1 + 0.1);
            });
        }
    };

    return generators;
};

// Polyfill for exponentialDecayTo (non-standard)
if (typeof AudioParam !== 'undefined' && !AudioParam.prototype.exponentialDecayTo) {
    AudioParam.prototype.exponentialDecayTo = function(value, endTime) {
        this.exponentialRampToValueAtTime(Math.max(value, 0.0001), endTime);
    };
}

// ============ SOUND SYSTEM HOOK ============

const useSoundSystem = () => {
    const audioContextRef = useRef(null);
    const generatorsRef = useRef(null);

    // Settings state with localStorage persistence
    const [settings, setSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('family_economy_sound_settings');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Failed to load sound settings:', e);
        }
        return {
            enabled: true,
            masterVolume: 0.7,
            categoryVolumes: {
                [SOUND_CATEGORIES.UI]: 0.5,
                [SOUND_CATEGORIES.REWARDS]: 1.0,
                [SOUND_CATEGORIES.NOTIFICATIONS]: 0.8,
                [SOUND_CATEGORIES.FEEDBACK]: 0.7
            }
        };
    });

    // Save settings to localStorage when they change
    useEffect(() => {
        try {
            localStorage.setItem('family_economy_sound_settings', JSON.stringify(settings));
        } catch (e) {
            console.warn('Failed to save sound settings:', e);
        }
    }, [settings]);

    // Initialize audio context on first user interaction
    const initAudio = useCallback(() => {
        if (!audioContextRef.current) {
            try {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
                generatorsRef.current = createSoundGenerator(audioContextRef.current);
            } catch (e) {
                console.warn('Web Audio API not supported:', e);
            }
        }
        // Resume if suspended (happens on mobile)
        if (audioContextRef.current?.state === 'suspended') {
            audioContextRef.current.resume();
        }
    }, []);

    // Play a sound by ID
    const play = useCallback((soundId) => {
        if (!settings.enabled) return;

        const sound = Object.values(SOUNDS).find(s => s.id === soundId);
        if (!sound) {
            console.warn(`Sound not found: ${soundId}`);
            return;
        }

        initAudio();

        if (!generatorsRef.current || !generatorsRef.current[sound.generator]) {
            return;
        }

        try {
            generatorsRef.current[sound.generator]();
        } catch (e) {
            console.warn(`Failed to play sound ${soundId}:`, e);
        }
    }, [settings.enabled, initAudio]);

    // Convenience methods for common sounds
    const sounds = {
        // UI
        buttonClick: useCallback(() => play(SOUNDS.BUTTON_CLICK.id), [play]),
        modalOpen: useCallback(() => play(SOUNDS.MODAL_OPEN.id), [play]),
        modalClose: useCallback(() => play(SOUNDS.MODAL_CLOSE.id), [play]),
        tabSwitch: useCallback(() => play(SOUNDS.TAB_SWITCH.id), [play]),

        // Rewards
        taskComplete: useCallback(() => play(SOUNDS.TASK_COMPLETE.id), [play]),
        moneyEarned: useCallback(() => play(SOUNDS.MONEY_EARNED.id), [play]),
        cashRegister: useCallback(() => play(SOUNDS.CASH_REGISTER.id), [play]),
        streakBonus: useCallback(() => play(SOUNDS.STREAK_BONUS.id), [play]),
        levelUp: useCallback(() => play(SOUNDS.LEVEL_UP.id), [play]),

        // Notifications
        approvalNeeded: useCallback(() => play(SOUNDS.APPROVAL_NEEDED.id), [play]),
        approved: useCallback(() => play(SOUNDS.APPROVED.id), [play]),
        rejected: useCallback(() => play(SOUNDS.REJECTED.id), [play]),

        // Feedback
        error: useCallback(() => play(SOUNDS.ERROR.id), [play]),
        warning: useCallback(() => play(SOUNDS.WARNING.id), [play]),

        // Legacy compatibility
        purchase: useCallback(() => play(SOUNDS.MONEY_EARNED.id), [play])
    };

    // Settings controls
    const toggleEnabled = useCallback(() => {
        setSettings(prev => ({ ...prev, enabled: !prev.enabled }));
    }, []);

    const setMasterVolume = useCallback((volume) => {
        setSettings(prev => ({ ...prev, masterVolume: Math.max(0, Math.min(1, volume)) }));
    }, []);

    const setCategoryVolume = useCallback((category, volume) => {
        setSettings(prev => ({
            ...prev,
            categoryVolumes: {
                ...prev.categoryVolumes,
                [category]: Math.max(0, Math.min(1, volume))
            }
        }));
    }, []);

    return {
        // Sound player methods
        play,
        ...sounds,

        // Settings
        settings,
        toggleEnabled,
        setMasterVolume,
        setCategoryVolume,

        // Initialize (call on first user interaction)
        initAudio,

        // Constants for reference
        SOUNDS,
        SOUND_CATEGORIES
    };
};

export default useSoundSystem;
